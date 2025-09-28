package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/universal-translator"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidationMiddleware(t *testing.T) {
	// Initialize validator
	InitValidator()
	
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		method         string
		path           string
		body           interface{}
		queryParams    string
		expectedStatus int
		setupRoute     func(*gin.Engine)
	}{
		{
			name:           "valid search request",
			method:         "GET",
			path:           "/api/search",
			queryParams:    "q=Beatles&type=artist&limit=10",
			expectedStatus: http.StatusOK,
			setupRoute: func(r *gin.Engine) {
				r.GET("/api/search", func(c *gin.Context) {
					req, exists := c.Get("searchRequest")
					assert.True(t, exists)
					searchReq := req.(SearchRequest)
					assert.Equal(t, "Beatles", searchReq.Query)
					assert.Equal(t, "artist", searchReq.Type)
					assert.Equal(t, 10, searchReq.Limit)
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "invalid search request - empty query",
			method:         "GET",
			path:           "/api/search",
			queryParams:    "q=&type=artist",
			expectedStatus: http.StatusBadRequest,
			setupRoute: func(r *gin.Engine) {
				r.GET("/api/search", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "valid download request",
			method:         "POST",
			path:           "/api/download",
			body:           DownloadRequest{AlbumIDs: []string{"album1", "album2"}, Format: "mp3", Bitrate: "320"},
			expectedStatus: http.StatusOK,
			setupRoute: func(r *gin.Engine) {
				r.POST("/api/download", func(c *gin.Context) {
					req, exists := c.Get("downloadRequest")
					assert.True(t, exists)
					downloadReq := req.(DownloadRequest)
					assert.Equal(t, []string{"album1", "album2"}, downloadReq.AlbumIDs)
					assert.Equal(t, "mp3", downloadReq.Format)
					assert.Equal(t, "320", downloadReq.Bitrate)
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "invalid download request - empty album IDs",
			method:         "POST",
			path:           "/api/download",
			body:           DownloadRequest{AlbumIDs: []string{}, Format: "mp3"},
			expectedStatus: http.StatusBadRequest,
			setupRoute: func(r *gin.Engine) {
				r.POST("/api/download", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "invalid download request - too many albums",
			method:         "POST",
			path:           "/api/download",
			body:           DownloadRequest{AlbumIDs: make([]string, 15), Format: "mp3"}, // 15 albums > 10 limit
			expectedStatus: http.StatusBadRequest,
			setupRoute: func(r *gin.Engine) {
				r.POST("/api/download", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "valid artist request",
			method:         "GET",
			path:           "/api/artist/123",
			expectedStatus: http.StatusOK,
			setupRoute: func(r *gin.Engine) {
				r.GET("/api/artist/:artistId", func(c *gin.Context) {
					req, exists := c.Get("artistRequest")
					assert.True(t, exists)
					artistReq := req.(ArtistRequest)
					assert.Equal(t, "123", artistReq.ArtistID)
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "valid download status request",
			method:         "GET",
			path:           "/api/download/status/550e8400-e29b-41d4-a716-446655440000",
			expectedStatus: http.StatusOK,
			setupRoute: func(r *gin.Engine) {
				r.GET("/api/download/status/:downloadId", func(c *gin.Context) {
					req, exists := c.Get("downloadStatusRequest")
					assert.True(t, exists)
					statusReq := req.(DownloadStatusRequest)
					assert.Equal(t, "550e8400-e29b-41d4-a716-446655440000", statusReq.DownloadID)
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
		{
			name:           "invalid download status request - invalid UUID",
			method:         "GET",
			path:           "/api/download/status/invalid-uuid",
			expectedStatus: http.StatusBadRequest,
			setupRoute: func(r *gin.Engine) {
				r.GET("/api/download/status/:downloadId", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{"status": "ok"})
				})
			},
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create router
			router := gin.New()
			router.Use(ValidationMiddleware())
			
			// Setup route
			tt.setupRoute(router)
			
			// Create request
			var req *http.Request
			var err error
			
			if tt.body != nil {
				bodyBytes, _ := json.Marshal(tt.body)
				req, err = http.NewRequest(tt.method, tt.path+"?"+tt.queryParams, bytes.NewBuffer(bodyBytes))
				req.Header.Set("Content-Type", "application/json")
			} else {
				req, err = http.NewRequest(tt.method, tt.path+"?"+tt.queryParams, nil)
			}
			
			require.NoError(t, err)
			req.Header.Set("User-Agent", "test-agent")
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Perform request
			router.ServeHTTP(w, req)
			
			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestContentTypeValidationMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		method         string
		contentType    string
		body           string
		expectedStatus int
	}{
		{
			name:           "valid JSON content type",
			method:         "POST",
			contentType:    "application/json",
			body:           `{"test": "data"}`,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "valid form content type",
			method:         "POST",
			contentType:    "application/x-www-form-urlencoded",
			body:           "test=data",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid content type",
			method:         "POST",
			contentType:    "text/plain",
			body:           "test data",
			expectedStatus: http.StatusUnsupportedMediaType,
		},
		{
			name:           "GET request - no validation",
			method:         "GET",
			contentType:    "text/plain",
			body:           "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "POST with empty body - no validation",
			method:         "POST",
			contentType:    "",
			body:           "",
			expectedStatus: http.StatusOK,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create router
			router := gin.New()
			router.Use(ContentTypeValidationMiddleware())
			router.Any("/test", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})
			
			// Create request
			req, err := http.NewRequest(tt.method, "/test", strings.NewReader(tt.body))
			require.NoError(t, err)
			
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}
			
			if tt.body != "" {
				req.ContentLength = int64(len(tt.body))
			}
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Perform request
			router.ServeHTTP(w, req)
			
			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestRequestSizeValidationMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		maxSize        int64
		bodySize       int64
		expectedStatus int
	}{
		{
			name:           "request within size limit",
			maxSize:        1024,
			bodySize:       512,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "request exceeds size limit",
			maxSize:        1024,
			bodySize:       2048,
			expectedStatus: http.StatusRequestEntityTooLarge,
		},
		{
			name:           "request at size limit",
			maxSize:        1024,
			bodySize:       1024,
			expectedStatus: http.StatusOK,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create router
			router := gin.New()
			router.Use(RequestSizeValidationMiddleware(tt.maxSize))
			router.POST("/test", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})
			
			// Create request with specified body size
			body := strings.Repeat("a", int(tt.bodySize))
			req, err := http.NewRequest("POST", "/test", strings.NewReader(body))
			require.NoError(t, err)
			
			req.Header.Set("Content-Type", "application/json")
			req.ContentLength = tt.bodySize
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Perform request
			router.ServeHTTP(w, req)
			
			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestSecurityValidationMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	tests := []struct {
		name           string
		userAgent      string
		headers        map[string]string
		expectedStatus int
	}{
		{
			name:           "valid request",
			userAgent:      "Mozilla/5.0 (compatible; test)",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "missing user agent",
			userAgent:      "",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "suspicious user agent - sqlmap",
			userAgent:      "sqlmap/1.0",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "suspicious user agent - nikto",
			userAgent:      "Nikto/2.1.6",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:      "suspicious header content - script tag",
			userAgent: "Mozilla/5.0",
			headers: map[string]string{
				"X-Custom-Header": "<script>alert('xss')</script>",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:      "suspicious header content - SQL injection",
			userAgent: "Mozilla/5.0",
			headers: map[string]string{
				"X-Custom-Header": "'; DROP TABLE users; --",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:      "valid custom header",
			userAgent: "Mozilla/5.0",
			headers: map[string]string{
				"X-Custom-Header": "valid-header-value",
			},
			expectedStatus: http.StatusOK,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create router
			router := gin.New()
			router.Use(SecurityValidationMiddleware())
			router.GET("/test", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"status": "ok"})
			})
			
			// Create request
			req, err := http.NewRequest("GET", "/test", nil)
			require.NoError(t, err)
			
			if tt.userAgent != "" {
				req.Header.Set("User-Agent", tt.userAgent)
			}
			
			for key, value := range tt.headers {
				req.Header.Set(key, value)
			}
			
			// Create response recorder
			w := httptest.NewRecorder()
			
			// Perform request
			router.ServeHTTP(w, req)
			
			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestFormatValidationError(t *testing.T) {
	InitValidator()
	
	// Test with a struct that will fail validation
	type TestStruct struct {
		RequiredField string `validate:"required"`
		MinField      string `validate:"min=5"`
		MaxField      string `validate:"max=10"`
		OneOfField    string `validate:"oneof=option1 option2"`
	}
	
	testStruct := TestStruct{
		RequiredField: "",
		MinField:      "abc",
		MaxField:      "this is too long",
		OneOfField:    "invalid",
	}
	
	err := validate.Struct(testStruct)
	require.Error(t, err)
	
	formattedErr := formatValidationError(err)
	
	// Check that the error message contains expected field names
	errorMsg := formattedErr.Error()
	assert.Contains(t, errorMsg, "RequiredField")
	assert.Contains(t, errorMsg, "MinField")
	assert.Contains(t, errorMsg, "MaxField")
	assert.Contains(t, errorMsg, "OneOfField")
}

func TestFormatFieldError(t *testing.T) {
	tests := []struct {
		name     string
		tag      string
		field    string
		param    string
		expected string
	}{
		{
			name:     "required field error",
			tag:      "required",
			field:    "TestField",
			param:    "",
			expected: "TestField is required",
		},
		{
			name:     "min length error",
			tag:      "min",
			field:    "TestField",
			param:    "5",
			expected: "TestField must be at least 5 characters/items",
		},
		{
			name:     "max length error",
			tag:      "max",
			field:    "TestField",
			param:    "10",
			expected: "TestField must be at most 10 characters/items",
		},
		{
			name:     "oneof error",
			tag:      "oneof",
			field:    "TestField",
			param:    "option1 option2",
			expected: "TestField must be one of: option1 option2",
		},
		{
			name:     "uuid4 error",
			tag:      "uuid4",
			field:    "TestField",
			param:    "",
			expected: "TestField must be a valid UUID",
		},
		{
			name:     "unknown error",
			tag:      "unknown",
			field:    "TestField",
			param:    "",
			expected: "TestField is invalid",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a mock field error
			mockFieldError := &mockFieldError{
				field: tt.field,
				tag:   tt.tag,
				param: tt.param,
			}
			
			result := formatFieldError(mockFieldError)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestContainsSuspiciousContent(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		expected bool
	}{
		{
			name:     "clean content",
			content:  "This is clean content",
			expected: false,
		},
		{
			name:     "script tag",
			content:  "<script>alert('xss')</script>",
			expected: true,
		},
		{
			name:     "javascript protocol",
			content:  "javascript:alert('xss')",
			expected: true,
		},
		{
			name:     "SQL injection",
			content:  "'; DROP TABLE users; --",
			expected: true,
		},
		{
			name:     "path traversal",
			content:  "../../../etc/passwd",
			expected: true,
		},
		{
			name:     "command execution",
			content:  "cmd.exe /c dir",
			expected: true,
		},
		{
			name:     "case insensitive detection",
			content:  "JAVASCRIPT:alert('test')",
			expected: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := containsSuspiciousContent(tt.content)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// Mock field error for testing
type mockFieldError struct {
	field string
	tag   string
	param string
}

func (m *mockFieldError) Tag() string {
	return m.tag
}

func (m *mockFieldError) ActualTag() string {
	return m.tag
}

func (m *mockFieldError) Namespace() string {
	return ""
}

func (m *mockFieldError) StructNamespace() string {
	return ""
}

func (m *mockFieldError) Field() string {
	return m.field
}

func (m *mockFieldError) StructField() string {
	return m.field
}

func (m *mockFieldError) Value() interface{} {
	return ""
}

func (m *mockFieldError) Param() string {
	return m.param
}

func (m *mockFieldError) Kind() reflect.Kind {
	return reflect.String
}

func (m *mockFieldError) Type() reflect.Type {
	return reflect.TypeOf("")
}

func (m *mockFieldError) Translate(ut ut.Translator) string {
	return ""
}

func (m *mockFieldError) Error() string {
	return "mock error"
}
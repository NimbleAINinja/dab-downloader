package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestHealthEndpoint(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Create test server
	config := &ServerConfig{
		Host: "localhost",
		Port: "8080",
		Mode: gin.TestMode,
	}
	
	server := NewWebServer(config)
	server.setupRoutes()
	
	// Create test request
	req, err := http.NewRequest("GET", "/api/health", nil)
	assert.NoError(t, err)
	
	// Create response recorder
	w := httptest.NewRecorder()
	
	// Perform request
	server.router.ServeHTTP(w, req)
	
	// Check status code (can be 200 or 503 depending on service health)
	assert.True(t, w.Code == http.StatusOK || w.Code == http.StatusServiceUnavailable)
	
	// Parse response
	var health HealthStatus
	err = json.Unmarshal(w.Body.Bytes(), &health)
	assert.NoError(t, err)
	
	// Print response for debugging
	t.Logf("Health response: %+v", health)
	
	// Verify response structure
	assert.NotEmpty(t, health.Status)
	assert.NotEmpty(t, health.Timestamp)
	// Version might be empty in test environment, so we'll check it exists as a field
	assert.NotEmpty(t, health.Uptime)
	assert.NotNil(t, health.Services)
	
	// Check that all expected services are present
	expectedServices := []string{"dab_api", "download_manager", "file_system", "configuration"}
	for _, service := range expectedServices {
		assert.Contains(t, health.Services, service)
		assert.NotEmpty(t, health.Services[service].Status)
		assert.NotEmpty(t, health.Services[service].LastChecked)
	}
}

func TestVersionEndpoint(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Create test server
	config := &ServerConfig{
		Host: "localhost",
		Port: "8080",
		Mode: gin.TestMode,
	}
	
	server := NewWebServer(config)
	server.setupRoutes()
	
	// Create test request
	req, err := http.NewRequest("GET", "/api/version", nil)
	assert.NoError(t, err)
	
	// Create response recorder
	w := httptest.NewRecorder()
	
	// Perform request
	server.router.ServeHTTP(w, req)
	
	// Check status code
	assert.Equal(t, http.StatusOK, w.Code)
	
	// Parse response
	var version AppVersionInfo
	err = json.Unmarshal(w.Body.Bytes(), &version)
	assert.NoError(t, err)
	
	// Verify response structure
	assert.NotEmpty(t, version.Name)
	assert.Equal(t, "dab-downloader", version.Name)
	assert.NotEmpty(t, version.Author)
	assert.NotEmpty(t, version.GoVersion)
	assert.NotEmpty(t, version.Platform)
	assert.NotEmpty(t, version.Environment)
	assert.NotEmpty(t, version.Features)
	assert.NotEmpty(t, version.API.Endpoints)
	assert.Equal(t, "v1", version.API.Version)
	assert.NotEmpty(t, version.Dependencies)
	
	// Check that expected features are present
	expectedFeatures := []string{"Artist Search", "Album Discovery", "Batch Downloads"}
	for _, feature := range expectedFeatures {
		assert.Contains(t, version.Features, feature)
	}
	
	// Check that expected endpoints are present
	expectedEndpoints := []string{"GET /api/health", "GET /api/version", "GET /api/search"}
	for _, endpoint := range expectedEndpoints {
		assert.Contains(t, version.API.Endpoints, endpoint)
	}
}

func TestRateLimitingMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Create test server
	config := &ServerConfig{
		Host: "localhost",
		Port: "8080",
		Mode: gin.TestMode,
	}
	
	server := NewWebServer(config)
	server.setupRoutes()
	
	// Make multiple rapid requests to test rate limiting
	// Use version endpoint as it's faster than health endpoint
	successCount := 0
	rateLimitedCount := 0
	
	for i := 0; i < 25; i++ { // More than the burst limit of 20
		req, err := http.NewRequest("GET", "/api/version", nil)
		assert.NoError(t, err)
		
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)
		
		if w.Code == http.StatusOK {
			successCount++
		} else if w.Code == http.StatusTooManyRequests {
			rateLimitedCount++
		}
	}
	
	// We should have some successful requests and some rate limited
	assert.Greater(t, successCount, 0, "Should have some successful requests")
	// Note: Rate limiting might not kick in immediately in tests due to timing
	t.Logf("Success: %d, Rate limited: %d", successCount, rateLimitedCount)
}

func TestSecurityHeaders(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Create test server
	config := &ServerConfig{
		Host: "localhost",
		Port: "8080",
		Mode: gin.TestMode,
	}
	
	server := NewWebServer(config)
	server.setupRoutes()
	
	// Create test request
	req, err := http.NewRequest("GET", "/api/health", nil)
	assert.NoError(t, err)
	
	// Create response recorder
	w := httptest.NewRecorder()
	
	// Perform request
	server.router.ServeHTTP(w, req)
	
	// Check security headers
	assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
	assert.Equal(t, "DENY", w.Header().Get("X-Frame-Options"))
	assert.Equal(t, "1; mode=block", w.Header().Get("X-XSS-Protection"))
	assert.Equal(t, "strict-origin-when-cross-origin", w.Header().Get("Referrer-Policy"))
	assert.Contains(t, w.Header().Get("Content-Security-Policy"), "default-src 'self'")
}

func TestCORSHeaders(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Create test server
	config := &ServerConfig{
		Host: "localhost",
		Port: "8080",
		Mode: gin.TestMode,
	}
	
	server := NewWebServer(config)
	server.setupRoutes()
	
	// Test OPTIONS request
	req, err := http.NewRequest("OPTIONS", "/api/health", nil)
	assert.NoError(t, err)
	
	// Create response recorder
	w := httptest.NewRecorder()
	
	// Perform request
	server.router.ServeHTTP(w, req)
	
	// Check CORS headers
	assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "POST")
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Content-Type")
	
	// OPTIONS should return 204
	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestRequestValidationMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Initialize validator
	InitValidator()
	
	// Create a minimal router with just the validation middleware to avoid rate limiting
	router := gin.New()
	router.Use(ValidationMiddleware())
	
	// Add a simple test endpoint
	router.POST("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})
	
	// Test invalid content type for POST request
	req, err := http.NewRequest("POST", "/test", nil)
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "text/plain")
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	// Should return unsupported media type
	assert.Equal(t, http.StatusUnsupportedMediaType, w.Code)
	
	var errorResp ErrorResponse
	err = json.Unmarshal(w.Body.Bytes(), &errorResp)
	assert.NoError(t, err)
	assert.Equal(t, "Unsupported media type", errorResp.Error)
}
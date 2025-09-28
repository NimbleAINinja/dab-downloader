package main

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// ValidationMiddleware provides comprehensive request validation
func ValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add request ID for tracing
		requestID := uuid.New().String()
		c.Set("requestId", requestID)
		
		// Validate request based on endpoint
		if err := validateRequest(c); err != nil {
			SendErrorResponse(c, http.StatusBadRequest, ErrCodeValidationFailed, "Request validation failed", err.Error())
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// validateRequest validates the request based on the endpoint
func validateRequest(c *gin.Context) error {
	path := c.FullPath()
	method := c.Request.Method
	
	switch {
	case method == "GET" && path == "/api/search":
		return validateSearchRequest(c)
	case method == "GET" && strings.HasPrefix(path, "/api/artist/"):
		return validateArtistRequest(c)
	case method == "GET" && strings.HasPrefix(path, "/api/discography/"):
		return validateDiscographyRequest(c)
	case method == "POST" && path == "/api/download":
		return validateDownloadRequest(c)
	case method == "GET" && strings.HasPrefix(path, "/api/download/status/"):
		return validateDownloadStatusRequest(c)
	case method == "DELETE" && strings.HasPrefix(path, "/api/download/"):
		return validateCancelDownloadRequest(c)
	}
	
	return nil
}

// validateSearchRequest validates search endpoint requests
func validateSearchRequest(c *gin.Context) error {
	var req SearchRequest
	
	// Bind query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		return fmt.Errorf("invalid query parameters: %w", err)
	}
	
	// Sanitize input
	SanitizeSearchRequest(&req)
	
	// Custom validation
	if err := validate.Struct(&req); err != nil {
		return formatValidationError(err)
	}
	
	// Additional business logic validation
	if len(strings.TrimSpace(req.Query)) == 0 {
		return fmt.Errorf("search query cannot be empty")
	}
	
	if req.Limit > 50 {
		return fmt.Errorf("limit cannot exceed 50")
	}
	
	// Store sanitized request in context
	c.Set("searchRequest", req)
	return nil
}

// validateArtistRequest validates artist detail endpoint requests
func validateArtistRequest(c *gin.Context) error {
	var req ArtistRequest
	
	// Bind URI parameters
	if err := c.ShouldBindUri(&req); err != nil {
		return fmt.Errorf("invalid artist ID: %w", err)
	}
	
	// Sanitize input
	req.ArtistID = SanitizeString(req.ArtistID)
	
	// Custom validation
	if err := validate.Struct(&req); err != nil {
		return formatValidationError(err)
	}
	
	// Additional validation
	if len(req.ArtistID) == 0 {
		return fmt.Errorf("artist ID cannot be empty")
	}
	
	// Store sanitized request in context
	c.Set("artistRequest", req)
	return nil
}

// validateDiscographyRequest validates discography endpoint requests
func validateDiscographyRequest(c *gin.Context) error {
	var req DiscographyRequest
	
	// Bind URI parameters
	if err := c.ShouldBindUri(&req); err != nil {
		return fmt.Errorf("invalid artist ID: %w", err)
	}
	
	// Bind query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		return fmt.Errorf("invalid query parameters: %w", err)
	}
	
	// Sanitize input
	req.ArtistID = SanitizeString(req.ArtistID)
	
	// Set defaults
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Offset < 0 {
		req.Offset = 0
	}
	
	// Custom validation
	if err := validate.Struct(&req); err != nil {
		return formatValidationError(err)
	}
	
	// Additional validation
	if len(req.ArtistID) == 0 {
		return fmt.Errorf("artist ID cannot be empty")
	}
	
	if req.Limit > 100 {
		return fmt.Errorf("limit cannot exceed 100")
	}
	
	// Store sanitized request in context
	c.Set("discographyRequest", req)
	return nil
}

// validateDownloadRequest validates download initiation requests
func validateDownloadRequest(c *gin.Context) error {
	var req DownloadRequest
	
	// Bind JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		return fmt.Errorf("invalid request body: %w", err)
	}
	
	// Sanitize input
	SanitizeDownloadRequest(&req)
	
	// Custom validation
	if err := validate.Struct(&req); err != nil {
		return formatValidationError(err)
	}
	
	// Additional business logic validation
	if len(req.AlbumIDs) == 0 {
		return fmt.Errorf("at least one album ID must be provided")
	}
	
	if len(req.AlbumIDs) > 10 {
		return fmt.Errorf("cannot download more than 10 albums at once")
	}
	
	// Validate each album ID
	for i, albumID := range req.AlbumIDs {
		if len(strings.TrimSpace(albumID)) == 0 {
			return fmt.Errorf("album ID at index %d cannot be empty", i)
		}
		if len(albumID) > 100 {
			return fmt.Errorf("album ID at index %d is too long", i)
		}
	}
	
	// Validate format and bitrate combination
	if req.Format == "flac" && req.Bitrate != "" {
		return fmt.Errorf("bitrate cannot be specified for FLAC format")
	}
	
	// Store sanitized request in context
	c.Set("downloadRequest", req)
	return nil
}

// validateDownloadStatusRequest validates download status requests
func validateDownloadStatusRequest(c *gin.Context) error {
	var req DownloadStatusRequest
	
	// Bind URI parameters
	if err := c.ShouldBindUri(&req); err != nil {
		return fmt.Errorf("invalid download ID: %w", err)
	}
	
	// Sanitize input
	req.DownloadID = strings.TrimSpace(req.DownloadID)
	
	// Custom validation
	if err := validate.Struct(&req); err != nil {
		return formatValidationError(err)
	}
	
	// Additional validation
	if len(req.DownloadID) == 0 {
		return fmt.Errorf("download ID cannot be empty")
	}
	
	// Validate UUID format
	if _, err := uuid.Parse(req.DownloadID); err != nil {
		return fmt.Errorf("download ID must be a valid UUID")
	}
	
	// Store sanitized request in context
	c.Set("downloadStatusRequest", req)
	return nil
}

// validateCancelDownloadRequest validates download cancellation requests
func validateCancelDownloadRequest(c *gin.Context) error {
	var req CancelDownloadRequest
	
	// Bind URI parameters
	if err := c.ShouldBindUri(&req); err != nil {
		return fmt.Errorf("invalid download ID: %w", err)
	}
	
	// Sanitize input
	req.DownloadID = strings.TrimSpace(req.DownloadID)
	
	// Custom validation
	if err := validate.Struct(&req); err != nil {
		return formatValidationError(err)
	}
	
	// Additional validation
	if len(req.DownloadID) == 0 {
		return fmt.Errorf("download ID cannot be empty")
	}
	
	// Validate UUID format
	if _, err := uuid.Parse(req.DownloadID); err != nil {
		return fmt.Errorf("download ID must be a valid UUID")
	}
	
	// Store sanitized request in context
	c.Set("cancelDownloadRequest", req)
	return nil
}

// formatValidationError formats validator errors into user-friendly messages
func formatValidationError(err error) error {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		var messages []string
		
		for _, fieldError := range validationErrors {
			message := formatFieldError(fieldError)
			messages = append(messages, message)
		}
		
		return fmt.Errorf("%s", strings.Join(messages, "; "))
	}
	
	return err
}

// formatFieldError formats a single field validation error
func formatFieldError(fieldError validator.FieldError) string {
	field := fieldError.Field()
	tag := fieldError.Tag()
	param := fieldError.Param()
	
	switch tag {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters/items", field, param)
	case "max":
		return fmt.Sprintf("%s must be at most %s characters/items", field, param)
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, param)
	case "uuid4":
		return fmt.Sprintf("%s must be a valid UUID", field)
	case "alphanumspace":
		return fmt.Sprintf("%s can only contain letters, numbers, and spaces", field)
	case "nohtml":
		return fmt.Sprintf("%s cannot contain HTML tags", field)
	case "dive":
		return fmt.Sprintf("invalid item in %s", field)
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}

// ContentTypeValidationMiddleware validates request content types
func ContentTypeValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only validate content type for POST, PUT, PATCH requests
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			contentType := c.GetHeader("Content-Type")
			
			// Allow empty content type for requests without body
			if contentType == "" && c.Request.ContentLength == 0 {
				c.Next()
				return
			}
			
			// Validate content type
			if !strings.Contains(contentType, "application/json") && 
			   !strings.Contains(contentType, "application/x-www-form-urlencoded") &&
			   !strings.Contains(contentType, "multipart/form-data") {
				SendErrorResponse(c, http.StatusUnsupportedMediaType, ErrCodeUnsupportedMedia, 
					"Unsupported media type", 
					"Content-Type must be application/json, application/x-www-form-urlencoded, or multipart/form-data")
				c.Abort()
				return
			}
		}
		
		c.Next()
	}
}

// RequestSizeValidationMiddleware validates request size limits
func RequestSizeValidationMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			SendErrorResponse(c, http.StatusRequestEntityTooLarge, ErrCodeRequestTooLarge,
				"Request too large",
				fmt.Sprintf("Request body exceeds maximum size limit of %d bytes", maxSize))
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// SecurityValidationMiddleware provides additional security validations
func SecurityValidationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Validate User-Agent header (basic bot detection)
		userAgent := c.GetHeader("User-Agent")
		if userAgent == "" {
			SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest,
				"Missing User-Agent header",
				"User-Agent header is required")
			c.Abort()
			return
		}
		
		// Check for suspicious patterns in User-Agent
		suspiciousPatterns := []string{
			"sqlmap", "nikto", "nmap", "masscan", "zap", "burp",
		}
		
		userAgentLower := strings.ToLower(userAgent)
		for _, pattern := range suspiciousPatterns {
			if strings.Contains(userAgentLower, pattern) {
				SendErrorResponse(c, http.StatusForbidden, ErrCodeForbidden,
					"Suspicious request detected",
					"Request blocked by security policy")
				c.Abort()
				return
			}
		}
		
		// Validate request headers for injection attempts
		for headerName, headerValues := range c.Request.Header {
			for _, headerValue := range headerValues {
				if containsSuspiciousContent(headerValue) {
					SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest,
						"Invalid header content",
						fmt.Sprintf("Header %s contains suspicious content", headerName))
					c.Abort()
					return
				}
			}
		}
		
		c.Next()
	}
}

// containsSuspiciousContent checks for suspicious content in headers
func containsSuspiciousContent(content string) bool {
	suspiciousPatterns := []string{
		"<script", "</script>", "javascript:", "vbscript:", "onload=", "onerror=",
		"eval(", "alert(", "confirm(", "prompt(", "document.cookie",
		"union select", "drop table", "insert into", "delete from",
		"../", "..\\", "/etc/passwd", "/etc/shadow", "cmd.exe", "powershell",
	}
	
	contentLower := strings.ToLower(content)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(contentLower, pattern) {
			return true
		}
	}
	
	return false
}
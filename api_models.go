package main

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// API Request Models

// SearchRequest represents the search query parameters
type SearchRequest struct {
	Query string `form:"q" binding:"required,min=1,max=100" validate:"required,min=1,max=100"`
	Type  string `form:"type" binding:"omitempty,oneof=artist album track all" validate:"omitempty,oneof=artist album track all"`
	Limit int    `form:"limit" binding:"omitempty,min=1,max=50" validate:"omitempty,min=1,max=50"`
}

// ArtistRequest represents the artist ID parameter
type ArtistRequest struct {
	ArtistID string `uri:"artistId" binding:"required,min=1" validate:"required,min=1"`
}

// DiscographyRequest represents the discography request parameters
type DiscographyRequest struct {
	ArtistID string `uri:"artistId" binding:"required,min=1" validate:"required,min=1"`
	Limit    int    `form:"limit" binding:"omitempty,min=1,max=100" validate:"omitempty,min=1,max=100"`
	Offset   int    `form:"offset" binding:"omitempty,min=0" validate:"omitempty,min=0"`
}

// DownloadRequest represents a request to download albums
type DownloadRequest struct {
	AlbumIDs []string `json:"albumIds" binding:"required,min=1,max=10,dive,required,min=1" validate:"required,min=1,max=10,dive,required,min=1"`
	Format   string   `json:"format" binding:"omitempty,oneof=mp3 flac" validate:"omitempty,oneof=mp3 flac"`
	Bitrate  string   `json:"bitrate" binding:"omitempty,oneof=128 192 256 320" validate:"omitempty,oneof=128 192 256 320"`
}

// DownloadStatusRequest represents the download status request parameters
type DownloadStatusRequest struct {
	DownloadID string `uri:"downloadId" binding:"required,uuid4" validate:"required,uuid4"`
}

// CancelDownloadRequest represents the cancel download request parameters
type CancelDownloadRequest struct {
	DownloadID string `uri:"downloadId" binding:"required,uuid4" validate:"required,uuid4"`
}

// API Response Models

// APIResponse is the base response structure for all API responses
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *APIError   `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	RequestID string      `json:"requestId,omitempty"`
}

// APIError represents a standardized API error
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
	Field   string `json:"field,omitempty"`
}

// SearchResponse represents the search results response
type SearchResponse struct {
	Artists []APIArtist `json:"artists,omitempty"`
	Albums  []APIAlbum  `json:"albums,omitempty"`
	Tracks  []APITrack  `json:"tracks,omitempty"`
	Query   string      `json:"query"`
	Type    string      `json:"type"`
	Total   int         `json:"total"`
	Limit   int         `json:"limit"`
}

// ArtistDetailResponse represents the artist details response
type ArtistDetailResponse struct {
	Artist APIArtist `json:"artist"`
}

// DiscographyResponse represents the artist discography response
type DiscographyResponse struct {
	Artist APIArtist   `json:"artist"`
	Albums []APIAlbum  `json:"albums"`
	Total  int         `json:"total"`
	Limit  int         `json:"limit"`
	Offset int         `json:"offset"`
}

// DownloadResponse represents the response when initiating a download
type DownloadResponse struct {
	DownloadID string `json:"downloadId"`
	Status     string `json:"status"`
	Message    string `json:"message"`
	AlbumCount int    `json:"albumCount"`
}

// DownloadStatusResponse represents the current status of a download
type DownloadStatusResponse struct {
	ID              string     `json:"id"`
	AlbumIDs        []string   `json:"albumIds"`
	Status          string     `json:"status"` // pending, downloading, completed, error, cancelled
	Progress        float64    `json:"progress"` // 0-100
	Error           string     `json:"error,omitempty"`
	StartTime       time.Time  `json:"startTime"`
	EndTime         *time.Time `json:"endTime,omitempty"`
	TotalTracks     int        `json:"totalTracks"`
	CompletedTracks int        `json:"completedTracks"`
	EstimatedTime   *int       `json:"estimatedTimeSeconds,omitempty"`
}

// HealthResponse represents the health status response
type HealthResponse struct {
	Status    string                    `json:"status"`
	Timestamp string                    `json:"timestamp"`
	Version   string                    `json:"version"`
	Services  map[string]ServiceHealth  `json:"services"`
	Uptime    string                    `json:"uptime"`
}

// ServiceHealth represents the health of an individual service
type ServiceHealth struct {
	Status      string `json:"status"`
	Message     string `json:"message,omitempty"`
	LastChecked string `json:"lastChecked"`
}

// VersionResponse represents comprehensive version information
type VersionResponse struct {
	Version      string            `json:"version"`
	Name         string            `json:"name"`
	Author       string            `json:"author"`
	BuildTime    string            `json:"buildTime"`
	GoVersion    string            `json:"goVersion"`
	Platform     string            `json:"platform"`
	Commit       string            `json:"commit,omitempty"`
	Environment  string            `json:"environment"`
	Features     []string          `json:"features"`
	API          APIVersionInfo    `json:"api"`
	Dependencies map[string]string `json:"dependencies"`
}

// APIVersionInfo represents API-specific version information
type APIVersionInfo struct {
	Version    string   `json:"version"`
	Endpoints  []string `json:"endpoints"`
	Deprecated []string `json:"deprecated,omitempty"`
}

// API Data Models (sanitized versions of internal models)

// APIArtist represents an artist in API responses
type APIArtist struct {
	ID       string     `json:"id"`
	Name     string     `json:"name"`
	Picture  string     `json:"picture,omitempty"`
	Albums   []APIAlbum `json:"albums,omitempty"`
	Bio      string     `json:"bio,omitempty"`
	Country  string     `json:"country,omitempty"`
	Genres   []string   `json:"genres,omitempty"`
}

// APIAlbum represents an album in API responses
type APIAlbum struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Artist      string     `json:"artist"`
	ArtistID    string     `json:"artistId,omitempty"`
	Cover       string     `json:"cover,omitempty"`
	ReleaseDate string     `json:"releaseDate,omitempty"`
	Tracks      []APITrack `json:"tracks,omitempty"`
	Genre       string     `json:"genre,omitempty"`
	Type        string     `json:"type,omitempty"` // "album", "ep", "single"
	Label       string     `json:"label,omitempty"`
	TotalTracks int        `json:"totalTracks"`
	Duration    int        `json:"durationSeconds,omitempty"`
}

// APITrack represents a track in API responses
type APITrack struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Artist      string `json:"artist"`
	ArtistID    string `json:"artistId,omitempty"`
	AlbumID     string `json:"albumId,omitempty"`
	Album       string `json:"album,omitempty"`
	Cover       string `json:"cover,omitempty"`
	Duration    int    `json:"durationSeconds"`
	TrackNumber int    `json:"trackNumber,omitempty"`
	DiscNumber  int    `json:"discNumber,omitempty"`
	Genre       string `json:"genre,omitempty"`
	ReleaseDate string `json:"releaseDate,omitempty"`
}

// Error Codes
const (
	// Client Errors (4xx)
	ErrCodeBadRequest          = "BAD_REQUEST"
	ErrCodeUnauthorized        = "UNAUTHORIZED"
	ErrCodeForbidden           = "FORBIDDEN"
	ErrCodeNotFound            = "NOT_FOUND"
	ErrCodeMethodNotAllowed    = "METHOD_NOT_ALLOWED"
	ErrCodeConflict            = "CONFLICT"
	ErrCodeValidationFailed    = "VALIDATION_FAILED"
	ErrCodeRateLimitExceeded   = "RATE_LIMIT_EXCEEDED"
	ErrCodeRequestTooLarge     = "REQUEST_TOO_LARGE"
	ErrCodeUnsupportedMedia    = "UNSUPPORTED_MEDIA_TYPE"

	// Server Errors (5xx)
	ErrCodeInternalError       = "INTERNAL_SERVER_ERROR"
	ErrCodeServiceUnavailable  = "SERVICE_UNAVAILABLE"
	ErrCodeTimeout             = "TIMEOUT"
	ErrCodeConfigurationError  = "CONFIGURATION_ERROR"
	ErrCodeExternalAPIError    = "EXTERNAL_API_ERROR"
	ErrCodeDownloadError       = "DOWNLOAD_ERROR"
)

// Validation Functions

// Custom validator instance
var validate *validator.Validate

// InitValidator initializes the custom validator with custom validation rules
func InitValidator() {
	validate = validator.New()
	
	// Register custom validation functions
	validate.RegisterValidation("uuid4", validateUUID4)
	validate.RegisterValidation("alphanumspace", validateAlphanumSpace)
	validate.RegisterValidation("nohtml", validateNoHTML)
}

// validateUUID4 validates that a string is a valid UUID v4
func validateUUID4(fl validator.FieldLevel) bool {
	uuidRegex := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	return uuidRegex.MatchString(fl.Field().String())
}

// validateAlphanumSpace validates that a string contains only alphanumeric characters and spaces
func validateAlphanumSpace(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	if value == "" {
		return true // Allow empty strings
	}
	alphanumSpaceRegex := regexp.MustCompile(`^[a-zA-Z0-9\s]+$`)
	return alphanumSpaceRegex.MatchString(value)
}

// validateNoHTML validates that a string doesn't contain HTML tags
func validateNoHTML(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	// Look for actual HTML tags (letter after <)
	htmlRegex := regexp.MustCompile(`<[a-zA-Z][^>]*>`)
	return !htmlRegex.MatchString(value)
}

// Input Sanitization Functions

// SanitizeString removes potentially dangerous characters and trims whitespace
func SanitizeString(input string) string {
	// Remove script tags and their content first
	scriptRegex := regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`)
	sanitized := scriptRegex.ReplaceAllString(input, "")
	
	// Remove HTML tags
	htmlRegex := regexp.MustCompile(`<[^>]*>`)
	sanitized = htmlRegex.ReplaceAllString(sanitized, "")
	
	// Remove potentially dangerous characters
	dangerousChars := regexp.MustCompile(`[<>&"'\x00-\x1f\x7f-\x9f]`)
	sanitized = dangerousChars.ReplaceAllString(sanitized, "")
	
	// Trim whitespace and normalize spaces
	sanitized = strings.TrimSpace(sanitized)
	spaceRegex := regexp.MustCompile(`\s+`)
	sanitized = spaceRegex.ReplaceAllString(sanitized, " ")
	
	return sanitized
}

// SanitizeSearchRequest sanitizes a search request
func SanitizeSearchRequest(req *SearchRequest) {
	req.Query = SanitizeString(req.Query)
	req.Type = strings.ToLower(strings.TrimSpace(req.Type))
	
	// Set defaults
	if req.Type == "" {
		req.Type = "all"
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}
}

// SanitizeDownloadRequest sanitizes a download request
func SanitizeDownloadRequest(req *DownloadRequest) {
	// Sanitize album IDs
	for i, albumID := range req.AlbumIDs {
		req.AlbumIDs[i] = SanitizeString(albumID)
	}
	
	// Sanitize format and bitrate
	req.Format = strings.ToLower(strings.TrimSpace(req.Format))
	req.Bitrate = strings.TrimSpace(req.Bitrate)
	
	// Set defaults
	if req.Format == "" {
		req.Format = "mp3"
	}
	if req.Bitrate == "" {
		req.Bitrate = "320"
	}
}

// Response Helper Functions

// NewSuccessResponse creates a successful API response
func NewSuccessResponse(data interface{}) APIResponse {
	return APIResponse{
		Success:   true,
		Data:      data,
		Timestamp: time.Now().UTC(),
	}
}

// NewErrorResponse creates an error API response
func NewErrorResponse(code, message, details string) APIResponse {
	return APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now().UTC(),
	}
}

// NewValidationErrorResponse creates a validation error response
func NewValidationErrorResponse(field, message string) APIResponse {
	return APIResponse{
		Success: false,
		Error: &APIError{
			Code:    ErrCodeValidationFailed,
			Message: "Validation failed",
			Details: message,
			Field:   field,
		},
		Timestamp: time.Now().UTC(),
	}
}

// SendSuccessResponse sends a successful JSON response
func SendSuccessResponse(c *gin.Context, statusCode int, data interface{}) {
	response := NewSuccessResponse(data)
	response.RequestID = c.GetString("requestId")
	c.JSON(statusCode, response)
}

// SendErrorResponse sends an error JSON response
func SendErrorResponse(c *gin.Context, statusCode int, code, message, details string) {
	response := NewErrorResponse(code, message, details)
	response.RequestID = c.GetString("requestId")
	c.JSON(statusCode, response)
}

// SendValidationErrorResponse sends a validation error JSON response
func SendValidationErrorResponse(c *gin.Context, field, message string) {
	response := NewValidationErrorResponse(field, message)
	response.RequestID = c.GetString("requestId")
	c.JSON(400, response)
}

// Model Conversion Functions

// ConvertToAPIArtist converts internal Artist to API Artist
func ConvertToAPIArtist(artist *Artist) APIArtist {
	apiArtist := APIArtist{
		ID:      fmt.Sprintf("%v", artist.ID),
		Name:    SanitizeString(artist.Name),
		Picture: artist.Picture,
		Bio:     SanitizeString(artist.Bio),
		Country: SanitizeString(artist.Country),
	}
	
	// Convert albums
	for _, album := range artist.Albums {
		apiArtist.Albums = append(apiArtist.Albums, ConvertToAPIAlbum(&album))
	}
	
	return apiArtist
}

// ConvertToAPIAlbum converts internal Album to API Album
func ConvertToAPIAlbum(album *Album) APIAlbum {
	apiAlbum := APIAlbum{
		ID:          album.ID,
		Title:       SanitizeString(album.Title),
		Artist:      SanitizeString(album.Artist),
		Cover:       album.Cover,
		ReleaseDate: album.ReleaseDate,
		Genre:       SanitizeString(album.Genre),
		Type:        album.Type,
		Label:       fmt.Sprintf("%v", album.Label),
		TotalTracks: album.TotalTracks,
	}
	
	// Convert tracks
	for _, track := range album.Tracks {
		apiAlbum.Tracks = append(apiAlbum.Tracks, ConvertToAPITrack(&track))
	}
	
	// Calculate total duration
	totalDuration := 0
	for _, track := range apiAlbum.Tracks {
		totalDuration += track.Duration
	}
	apiAlbum.Duration = totalDuration
	
	return apiAlbum
}

// ConvertToAPITrack converts internal Track to API Track
func ConvertToAPITrack(track *Track) APITrack {
	return APITrack{
		ID:          fmt.Sprintf("%v", track.ID),
		Title:       SanitizeString(track.Title),
		Artist:      SanitizeString(track.Artist),
		ArtistID:    fmt.Sprintf("%v", track.ArtistId),
		AlbumID:     track.AlbumID,
		Album:       SanitizeString(track.Album),
		Cover:       track.Cover,
		Duration:    track.Duration,
		TrackNumber: track.TrackNumber,
		DiscNumber:  track.DiscNumber,
		Genre:       SanitizeString(track.Genre),
		ReleaseDate: track.ReleaseDate,
	}
}

// Legacy ErrorResponse type (for backward compatibility)
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// Legacy types for backward compatibility with existing tests
type HealthStatus = HealthResponse
type AppVersionInfo = VersionResponse

// Internal DownloadStatus type (used by download manager)
type DownloadStatus struct {
	ID              string     `json:"id"`
	AlbumIDs        []string   `json:"albumIds"`
	Status          string     `json:"status"` // pending, downloading, completed, error, cancelled
	Progress        float64    `json:"progress"` // 0-100
	Error           string     `json:"error,omitempty"`
	StartTime       time.Time  `json:"startTime"`
	EndTime         *time.Time `json:"endTime,omitempty"`
	TotalTracks     int        `json:"totalTracks"`
	CompletedTracks int        `json:"completedTracks"`
}

// ConvertToDownloadStatusResponse converts internal DownloadStatus to API response
func ConvertToDownloadStatusResponse(status *DownloadStatus) DownloadStatusResponse {
	response := DownloadStatusResponse{
		ID:              status.ID,
		AlbumIDs:        status.AlbumIDs,
		Status:          status.Status,
		Progress:        status.Progress,
		Error:           SanitizeString(status.Error),
		StartTime:       status.StartTime,
		EndTime:         status.EndTime,
		TotalTracks:     status.TotalTracks,
		CompletedTracks: status.CompletedTracks,
	}
	
	// Calculate estimated time if download is in progress
	if status.Status == "downloading" && status.Progress > 0 && status.Progress < 100 {
		elapsed := time.Since(status.StartTime).Seconds()
		estimatedTotal := elapsed * 100 / status.Progress
		remaining := int(estimatedTotal - elapsed)
		if remaining > 0 {
			response.EstimatedTime = &remaining
		}
	}
	
	return response
}
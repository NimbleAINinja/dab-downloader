package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

// ServerConfig holds the configuration for the web server
type ServerConfig struct {
	Host string
	Port string
	Mode string // gin mode: debug, release, test
}

// WebServer represents the HTTP server instance
type WebServer struct {
	config          *ServerConfig
	router          *gin.Engine
	server          *http.Server
	downloadManager *DownloadManager
	services        *AppServices
}

// SetServices injects the shared services into the web server
func (ws *WebServer) SetServices(services *AppServices) {
	ws.services = services
}

// NewWebServer creates a new web server instance
func NewWebServer(config *ServerConfig) *WebServer {
	// Initialize validator
	InitValidator()
	
	// Set Gin mode
	gin.SetMode(config.Mode)
	
	router := gin.New()
	
	// Add middleware in order of execution
	router.Use(loggingMiddleware())
	router.Use(gin.Recovery())
	router.Use(corsMiddleware())
	router.Use(securityHeadersMiddleware())
	router.Use(rateLimitMiddleware())
	router.Use(ContentTypeValidationMiddleware())
	router.Use(RequestSizeValidationMiddleware(10 * 1024 * 1024)) // 10MB limit
	router.Use(SecurityValidationMiddleware())
	router.Use(ValidationMiddleware())
	
	server := &http.Server{
		Addr:    fmt.Sprintf("%s:%s", config.Host, config.Port),
		Handler: router,
	}
	
	return &WebServer{
		config:          config,
		router:          router,
		server:          server,
		downloadManager: NewDownloadManager(),
		services:        nil, // Will be set via SetServices
	}
}

// corsMiddleware adds CORS headers to allow frontend communication
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}

// loggingMiddleware provides structured logging for API requests
func loggingMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s %s %d %s %s %s\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
			param.ClientIP,
			param.ErrorMessage,
		)
	})
}

// securityHeadersMiddleware adds basic security headers
func securityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")
		
		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")
		
		// XSS protection
		c.Header("X-XSS-Protection", "1; mode=block")
		
		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Content Security Policy (basic)
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'")
		
		c.Next()
	}
}

// Rate limiter instance
var limiter = rate.NewLimiter(rate.Limit(10), 20) // 10 requests per second, burst of 20

// rateLimitMiddleware implements rate limiting
func rateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, ErrorResponse{
				Error:   "Rate limit exceeded",
				Message: "Too many requests. Please try again later.",
				Code:    http.StatusTooManyRequests,
			})
			c.Abort()
			return
		}
		c.Next()
	}
}



// setupRoutes configures all the API routes
func (ws *WebServer) setupRoutes() {
	api := ws.router.Group("/api")
	{
		// Health check endpoint
		api.GET("/health", ws.healthHandler)
		
		// Version endpoint
		api.GET("/version", ws.versionHandler)
		
		// Search endpoints
		api.GET("/search", ws.searchHandler)
		api.GET("/artist/:artistId", ws.getArtistHandler)
		api.GET("/discography/:artistId", ws.getDiscographyHandler)
		
		// Download endpoints
		api.POST("/download", ws.downloadHandler)
		api.GET("/download/status/:downloadId", ws.getDownloadStatusHandler)
		api.DELETE("/download/:downloadId", ws.cancelDownloadHandler)
	}
}



// Server start time for uptime calculation
var serverStartTime = time.Now()

// healthHandler returns the health status of the service with comprehensive checks
func (ws *WebServer) healthHandler(c *gin.Context) {
	services := make(map[string]ServiceHealth)
	overallStatus := "healthy"
	
	// Check DAB API connectivity
	dabStatus := ws.checkDabAPIHealth()
	services["dab_api"] = dabStatus
	if dabStatus.Status != "healthy" {
		overallStatus = "degraded"
	}
	
	// Check download manager
	downloadStatus := ws.checkDownloadManagerHealth()
	services["download_manager"] = downloadStatus
	if downloadStatus.Status != "healthy" {
		overallStatus = "degraded"
	}
	
	// Check file system access
	fsStatus := ws.checkFileSystemHealth()
	services["file_system"] = fsStatus
	if fsStatus.Status != "healthy" {
		overallStatus = "degraded"
	}
	
	// Check configuration
	configStatus := ws.checkConfigurationHealth()
	services["configuration"] = configStatus
	if configStatus.Status != "healthy" {
		overallStatus = "degraded"
	}
	
	// Calculate uptime
	uptime := time.Since(serverStartTime)
	
	health := HealthResponse{
		Status:    overallStatus,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Version:   toolVersion,
		Services:  services,
		Uptime:    uptime.String(),
	}
	
	// Return appropriate HTTP status code
	statusCode := http.StatusOK
	if overallStatus == "degraded" {
		statusCode = http.StatusServiceUnavailable
	}
	
	SendSuccessResponse(c, statusCode, health)
}

// checkDabAPIHealth checks if the DAB API is accessible
func (ws *WebServer) checkDabAPIHealth() ServiceHealth {
	if ws.services == nil {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     "Application services not initialized",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	config := ws.services.Config
	
	// Create a quick health check request with short timeout
	client := &http.Client{Timeout: 5 * time.Second}
	
	// Try to make a simple request to the DAB API
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	
	req, err := http.NewRequestWithContext(ctx, "GET", config.APIURL+"/health", nil)
	if err != nil {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     "Failed to create health check request",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	resp, err := client.Do(req)
	if err != nil {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     fmt.Sprintf("DAB API unreachable: %v", err),
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	defer resp.Body.Close()
	
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return ServiceHealth{
			Status:      "healthy",
			Message:     "DAB API is accessible",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	return ServiceHealth{
		Status:      "unhealthy",
		Message:     fmt.Sprintf("DAB API returned status %d", resp.StatusCode),
		LastChecked: time.Now().UTC().Format(time.RFC3339),
	}
}

// checkDownloadManagerHealth checks the download manager status
func (ws *WebServer) checkDownloadManagerHealth() ServiceHealth {
	ws.downloadManager.mutex.RLock()
	activeDownloads := 0
	for _, download := range ws.downloadManager.downloads {
		if download.Status == "downloading" || download.Status == "pending" {
			activeDownloads++
		}
	}
	totalDownloads := len(ws.downloadManager.downloads)
	ws.downloadManager.mutex.RUnlock()
	
	return ServiceHealth{
		Status:      "healthy",
		Message:     fmt.Sprintf("Active downloads: %d, Total downloads: %d", activeDownloads, totalDownloads),
		LastChecked: time.Now().UTC().Format(time.RFC3339),
	}
}

// checkFileSystemHealth checks if the download directory is accessible
func (ws *WebServer) checkFileSystemHealth() ServiceHealth {
	if ws.services == nil {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     "Application services not initialized",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	config := ws.services.Config
	
	// Check if download directory exists and is writable
	if _, err := os.Stat(config.DownloadLocation); os.IsNotExist(err) {
		// Try to create the directory
		if err := os.MkdirAll(config.DownloadLocation, 0755); err != nil {
			return ServiceHealth{
				Status:      "unhealthy",
				Message:     fmt.Sprintf("Download directory not accessible: %v", err),
				LastChecked: time.Now().UTC().Format(time.RFC3339),
			}
		}
	}
	
	// Test write permissions by creating a temporary file
	testFile := fmt.Sprintf("%s/.health_check_%d", config.DownloadLocation, time.Now().Unix())
	if err := os.WriteFile(testFile, []byte("health check"), 0644); err != nil {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     fmt.Sprintf("Download directory not writable: %v", err),
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	// Clean up test file
	os.Remove(testFile)
	
	return ServiceHealth{
		Status:      "healthy",
		Message:     fmt.Sprintf("Download directory accessible: %s", config.DownloadLocation),
		LastChecked: time.Now().UTC().Format(time.RFC3339),
	}
}

// checkConfigurationHealth checks if the configuration is valid
func (ws *WebServer) checkConfigurationHealth() ServiceHealth {
	if ws.services == nil {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     "Application services not initialized",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	config := ws.services.Config
	
	// Validate required configuration fields
	if config.APIURL == "" {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     "API URL not configured",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	if config.DownloadLocation == "" {
		return ServiceHealth{
			Status:      "unhealthy",
			Message:     "Download location not configured",
			LastChecked: time.Now().UTC().Format(time.RFC3339),
		}
	}
	
	return ServiceHealth{
		Status:      "healthy",
		Message:     "Configuration is valid",
		LastChecked: time.Now().UTC().Format(time.RFC3339),
	}
}



// versionHandler returns comprehensive application version information
func (ws *WebServer) versionHandler(c *gin.Context) {
	
	// Define available API endpoints
	endpoints := []string{
		"GET /api/health",
		"GET /api/version",
		"GET /api/search",
		"GET /api/artist/:artistId",
		"GET /api/discography/:artistId",
		"POST /api/download",
		"GET /api/download/status/:downloadId",
		"DELETE /api/download/:downloadId",
	}
	
	// Define supported features
	features := []string{
		"Artist Search",
		"Album Discovery",
		"Batch Downloads",
		"Progress Tracking",
		"Download Cancellation",
		"Health Monitoring",
		"Rate Limiting",
		"CORS Support",
	}
	
	// Define key dependencies (these would typically come from go.mod)
	dependencies := map[string]string{
		"gin-gonic/gin": "v1.9.x",
		"google/uuid":   "v1.3.x",
		"golang.org/x/time": "v0.3.x",
	}
	
	// Determine environment
	environment := "production"
	if gin.Mode() == gin.DebugMode {
		environment = "development"
	} else if gin.Mode() == gin.TestMode {
		environment = "test"
	}
	
	versionInfo := VersionResponse{
		Version:     toolVersion,
		Name:        "dab-downloader",
		Author:      authorName,
		BuildTime:   serverStartTime.Format(time.RFC3339),
		GoVersion:   runtime.Version(),
		Platform:    fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH),
		Environment: environment,
		Features:    features,
		API: APIVersionInfo{
			Version:   "v1",
			Endpoints: endpoints,
		},
		Dependencies: dependencies,
	}
	
	SendSuccessResponse(c, http.StatusOK, versionInfo)
}



// DownloadManager manages concurrent downloads
type DownloadManager struct {
	downloads map[string]*DownloadStatus
	mutex     sync.RWMutex
	cancelFuncs map[string]context.CancelFunc
}

// NewDownloadManager creates a new download manager
func NewDownloadManager() *DownloadManager {
	return &DownloadManager{
		downloads:   make(map[string]*DownloadStatus),
		cancelFuncs: make(map[string]context.CancelFunc),
	}
}

// AddDownload adds a new download to the manager
func (dm *DownloadManager) AddDownload(downloadID string, albumIDs []string) *DownloadStatus {
	dm.mutex.Lock()
	defer dm.mutex.Unlock()
	
	status := &DownloadStatus{
		ID:              downloadID,
		AlbumIDs:        albumIDs,
		Status:          "pending",
		Progress:        0,
		StartTime:       time.Now(),
		TotalTracks:     0,
		CompletedTracks: 0,
	}
	
	dm.downloads[downloadID] = status
	return status
}

// GetDownload retrieves a download status by ID
func (dm *DownloadManager) GetDownload(downloadID string) (*DownloadStatus, bool) {
	dm.mutex.RLock()
	defer dm.mutex.RUnlock()
	
	status, exists := dm.downloads[downloadID]
	return status, exists
}

// UpdateDownload updates a download's status
func (dm *DownloadManager) UpdateDownload(downloadID string, status string, progress float64, completedTracks int, totalTracks int, err error) {
	dm.mutex.Lock()
	defer dm.mutex.Unlock()
	
	download, exists := dm.downloads[downloadID]
	if !exists {
		return
	}
	
	download.Status = status
	download.Progress = progress
	download.CompletedTracks = completedTracks
	download.TotalTracks = totalTracks
	
	if err != nil {
		download.Error = err.Error()
	}
	
	if status == "completed" || status == "error" || status == "cancelled" {
		now := time.Now()
		download.EndTime = &now
	}
}

// CancelDownload cancels a download
func (dm *DownloadManager) CancelDownload(downloadID string) bool {
	dm.mutex.Lock()
	defer dm.mutex.Unlock()
	
	download, exists := dm.downloads[downloadID]
	if !exists {
		return false
	}
	
	// Cancel the context if it exists
	if cancelFunc, exists := dm.cancelFuncs[downloadID]; exists {
		cancelFunc()
		delete(dm.cancelFuncs, downloadID)
	}
	
	// Update status
	download.Status = "cancelled"
	now := time.Now()
	download.EndTime = &now
	
	return true
}

// SetCancelFunc sets the cancel function for a download
func (dm *DownloadManager) SetCancelFunc(downloadID string, cancelFunc context.CancelFunc) {
	dm.mutex.Lock()
	defer dm.mutex.Unlock()
	
	dm.cancelFuncs[downloadID] = cancelFunc
}

// Search endpoint handlers

// searchHandler handles GET /api/search requests
func (ws *WebServer) searchHandler(c *gin.Context) {
	// Get validated request from context
	req, exists := c.Get("searchRequest")
	if !exists {
		SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest, "Invalid request", "Request validation failed")
		return
	}
	
	searchReq := req.(SearchRequest)

	// Use shared services
	if ws.services == nil {
		SendErrorResponse(c, http.StatusInternalServerError, ErrCodeConfigurationError,
			"Service error", "Application services not initialized")
		return
	}

	// Perform search
	ctx := c.Request.Context()
	results, err := ws.services.DabAPI.Search(ctx, searchReq.Query, searchReq.Type, searchReq.Limit, false)
	if err != nil {
		SendErrorResponse(c, http.StatusInternalServerError, ErrCodeExternalAPIError,
			"Search failed", err.Error())
		return
	}

	// Convert to API models
	var apiArtists []APIArtist
	var apiAlbums []APIAlbum
	var apiTracks []APITrack
	
	for _, artist := range results.Artists {
		apiArtists = append(apiArtists, ConvertToAPIArtist(&artist))
	}
	
	for _, album := range results.Albums {
		apiAlbums = append(apiAlbums, ConvertToAPIAlbum(&album))
	}
	
	for _, track := range results.Tracks {
		apiTracks = append(apiTracks, ConvertToAPITrack(&track))
	}

	// Calculate total results
	total := len(apiArtists) + len(apiAlbums) + len(apiTracks)

	// Build response
	response := SearchResponse{
		Artists: apiArtists,
		Albums:  apiAlbums,
		Tracks:  apiTracks,
		Query:   searchReq.Query,
		Type:    searchReq.Type,
		Total:   total,
		Limit:   searchReq.Limit,
	}

	SendSuccessResponse(c, http.StatusOK, response)
}

// getArtistHandler handles GET /api/artist/:artistId requests
func (ws *WebServer) getArtistHandler(c *gin.Context) {
	// Get validated request from context
	req, exists := c.Get("artistRequest")
	if !exists {
		SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest, "Invalid request", "Request validation failed")
		return
	}
	
	artistReq := req.(ArtistRequest)

	// Use shared services
	if ws.services == nil {
		SendErrorResponse(c, http.StatusInternalServerError, ErrCodeConfigurationError,
			"Service error", "Application services not initialized")
		return
	}

	// Get artist details
	ctx := c.Request.Context()
	artist, err := ws.services.DabAPI.GetArtist(ctx, artistReq.ArtistID, ws.services.Config, false)
	if err != nil {
		SendErrorResponse(c, http.StatusNotFound, ErrCodeNotFound,
			"Artist not found", err.Error())
		return
	}

	// Convert to API model
	apiArtist := ConvertToAPIArtist(artist)

	// Build response
	response := ArtistDetailResponse{
		Artist: apiArtist,
	}

	SendSuccessResponse(c, http.StatusOK, response)
}

// getDiscographyHandler handles GET /api/discography/:artistId requests
func (ws *WebServer) getDiscographyHandler(c *gin.Context) {
	// Get validated request from context
	req, exists := c.Get("discographyRequest")
	if !exists {
		SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest, "Invalid request", "Request validation failed")
		return
	}
	
	discographyReq := req.(DiscographyRequest)

	// Use shared services
	if ws.services == nil {
		SendErrorResponse(c, http.StatusInternalServerError, ErrCodeConfigurationError,
			"Service error", "Application services not initialized")
		return
	}

	// Get artist discography
	ctx := c.Request.Context()
	artist, err := ws.services.DabAPI.GetArtist(ctx, discographyReq.ArtistID, ws.services.Config, false)
	if err != nil {
		SendErrorResponse(c, http.StatusNotFound, ErrCodeNotFound,
			"Artist not found", err.Error())
		return
	}

	// Convert to API models
	apiArtist := ConvertToAPIArtist(artist)
	
	// Apply pagination to albums
	albums := apiArtist.Albums
	total := len(albums)
	
	// Apply offset and limit
	start := discographyReq.Offset
	end := start + discographyReq.Limit
	
	if start > total {
		albums = []APIAlbum{}
	} else {
		if end > total {
			end = total
		}
		albums = albums[start:end]
	}

	// Build response
	response := DiscographyResponse{
		Artist: APIArtist{
			ID:      apiArtist.ID,
			Name:    apiArtist.Name,
			Picture: apiArtist.Picture,
			Bio:     apiArtist.Bio,
			Country: apiArtist.Country,
			Genres:  apiArtist.Genres,
		},
		Albums: albums,
		Total:  total,
		Limit:  discographyReq.Limit,
		Offset: discographyReq.Offset,
	}

	SendSuccessResponse(c, http.StatusOK, response)
}

// Download endpoint handlers

// downloadHandler handles POST /api/download requests
func (ws *WebServer) downloadHandler(c *gin.Context) {
	// Get validated request from context
	req, exists := c.Get("downloadRequest")
	if !exists {
		SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest, "Invalid request", "Request validation failed")
		return
	}
	
	downloadReq := req.(DownloadRequest)

	// Generate unique download ID
	downloadID := uuid.New().String()

	// Add download to manager
	status := ws.downloadManager.AddDownload(downloadID, downloadReq.AlbumIDs)

	// Start download in background
	go ws.processDownload(downloadID, downloadReq.AlbumIDs, downloadReq.Format, downloadReq.Bitrate)

	// Return response
	response := DownloadResponse{
		DownloadID: downloadID,
		Status:     status.Status,
		Message:    fmt.Sprintf("Download initiated for %d album(s)", len(downloadReq.AlbumIDs)),
		AlbumCount: len(downloadReq.AlbumIDs),
	}

	SendSuccessResponse(c, http.StatusOK, response)
}

// getDownloadStatusHandler handles GET /api/download/status/:downloadId requests
func (ws *WebServer) getDownloadStatusHandler(c *gin.Context) {
	// Get validated request from context
	req, exists := c.Get("downloadStatusRequest")
	if !exists {
		SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest, "Invalid request", "Request validation failed")
		return
	}
	
	statusReq := req.(DownloadStatusRequest)

	status, exists := ws.downloadManager.GetDownload(statusReq.DownloadID)
	if !exists {
		SendErrorResponse(c, http.StatusNotFound, ErrCodeNotFound,
			"Download not found", fmt.Sprintf("Download with ID %s not found", statusReq.DownloadID))
		return
	}

	// Convert to API response model
	response := ConvertToDownloadStatusResponse(status)

	SendSuccessResponse(c, http.StatusOK, response)
}

// cancelDownloadHandler handles DELETE /api/download/:downloadId requests
func (ws *WebServer) cancelDownloadHandler(c *gin.Context) {
	// Get validated request from context
	req, exists := c.Get("cancelDownloadRequest")
	if !exists {
		SendErrorResponse(c, http.StatusBadRequest, ErrCodeBadRequest, "Invalid request", "Request validation failed")
		return
	}
	
	cancelReq := req.(CancelDownloadRequest)

	success := ws.downloadManager.CancelDownload(cancelReq.DownloadID)
	if !success {
		SendErrorResponse(c, http.StatusNotFound, ErrCodeNotFound,
			"Download not found", fmt.Sprintf("Download with ID %s not found", cancelReq.DownloadID))
		return
	}

	response := map[string]interface{}{
		"message":    "Download cancelled successfully",
		"downloadId": cancelReq.DownloadID,
	}

	SendSuccessResponse(c, http.StatusOK, response)
}

// processDownload handles the actual download process in the background
func (ws *WebServer) processDownload(downloadID string, albumIDs []string, format, bitrate string) {
	// Create cancellable context
	ctx, cancel := context.WithCancel(context.Background())
	ws.downloadManager.SetCancelFunc(downloadID, cancel)

	// Use shared services
	if ws.services == nil {
		ws.downloadManager.UpdateDownload(downloadID, "error", 0, 0, 0, fmt.Errorf("application services not initialized"))
		return
	}
	
	config := ws.services.Config
	api := ws.services.DabAPI

	// Create warning collector
	warningCollector := NewWarningCollector(config.WarningBehavior != "silent")

	// Update status to downloading
	ws.downloadManager.UpdateDownload(downloadID, "downloading", 0, 0, 0, nil)

	var totalTracks int
	var completedTracks int
	var hasError bool
	var lastError error

	// Process each album
	for albumIndex, albumID := range albumIDs {
		// Check if download was cancelled
		select {
		case <-ctx.Done():
			ws.downloadManager.UpdateDownload(downloadID, "cancelled", 0, completedTracks, totalTracks, nil)
			return
		default:
		}

		// Download the album
		stats, err := api.DownloadAlbum(ctx, albumID, config, false, nil, warningCollector)
		if err != nil {
			hasError = true
			lastError = err
			// Continue with other albums even if one fails
			continue
		}

		if stats != nil {
			totalTracks += stats.SuccessCount + stats.SkippedCount + stats.FailedCount
			completedTracks += stats.SuccessCount + stats.SkippedCount
			
			if stats.FailedCount > 0 {
				hasError = true
				if len(stats.FailedItems) > 0 {
					lastError = fmt.Errorf("failed to download %d tracks: %s", stats.FailedCount, stats.FailedItems[0])
				}
			}
		}

		// Update progress
		progress := float64(albumIndex+1) / float64(len(albumIDs)) * 100
		ws.downloadManager.UpdateDownload(downloadID, "downloading", progress, completedTracks, totalTracks, nil)
	}

	// Final status update
	if hasError {
		ws.downloadManager.UpdateDownload(downloadID, "error", 100, completedTracks, totalTracks, lastError)
	} else {
		ws.downloadManager.UpdateDownload(downloadID, "completed", 100, completedTracks, totalTracks, nil)
	}
}

// Start starts the web server with graceful shutdown handling
func (ws *WebServer) Start() error {
	// Setup routes
	ws.setupRoutes()
	
	// Channel to listen for interrupt signal to trigger shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	
	// Start server in a goroutine
	go func() {
		colorInfo.Printf("🌐 Starting web server on %s:%s\n", ws.config.Host, ws.config.Port)
		colorInfo.Printf("🔗 API endpoints available at: http://%s:%s/api\n", ws.config.Host, ws.config.Port)
		
		if err := ws.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()
	
	// Wait for interrupt signal to gracefully shutdown the server
	<-quit
	colorInfo.Println("🛑 Shutting down server...")
	
	// Create a deadline for shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	// Attempt graceful shutdown
	if err := ws.server.Shutdown(ctx); err != nil {
		colorError.Printf("❌ Server forced to shutdown: %v\n", err)
		return err
	}
	
	colorSuccess.Println("✅ Server exited gracefully")
	return nil
}

// Stop stops the web server
func (ws *WebServer) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return ws.server.Shutdown(ctx)
}
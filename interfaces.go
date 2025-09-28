package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

// ApplicationMode represents the mode the application is running in
type ApplicationMode interface {
	// Initialize sets up the application mode with the provided services
	Initialize(services *AppServices) error
	
	// Run starts the application mode
	Run(args []string) error
	
	// Shutdown gracefully shuts down the application mode
	Shutdown() error
	
	// GetMode returns the mode identifier
	GetMode() ServiceMode
}

// DownloadManagerInterface defines the contract for download management
type DownloadManagerInterface interface {
	// StartDownload initiates a download and returns a download ID
	StartDownload(ctx context.Context, request DownloadRequest) (string, error)
	
	// GetDownloadStatus returns the status of a download
	GetDownloadStatus(downloadID string) (*DownloadStatus, error)
	
	// CancelDownload cancels an active download
	CancelDownload(downloadID string) error
	
	// ListDownloads returns all downloads
	ListDownloads() []*DownloadStatus
}

// ConfigManager interface defines the contract for configuration management
type ConfigManager interface {
	// LoadConfig loads configuration from storage
	LoadConfig() (*Config, error)
	
	// SaveConfig saves configuration to storage
	SaveConfig(config *Config) error
	
	// ValidateConfig validates configuration
	ValidateConfig(config *Config) error
	
	// GetConfigPath returns the path to the configuration file
	GetConfigPath() string
}

// APIClient interface defines the contract for DAB API interactions
type APIClient interface {
	// Search performs a search query
	Search(ctx context.Context, query, searchType string, limit int, debug bool) (*SearchResults, error)
	
	// GetAlbum retrieves album information
	GetAlbum(ctx context.Context, albumID string) (*Album, error)
	
	// GetArtist retrieves artist information
	GetArtist(ctx context.Context, artistID string, config *Config, debug bool) (*Artist, error)
	
	// DownloadAlbum downloads an album
	DownloadAlbum(ctx context.Context, albumID string, config *Config, debug bool, pool interface{}, warningCollector *WarningCollector) (*DownloadStats, error)
}

// FileSystemManager interface defines the contract for file system operations
type FileSystemManager interface {
	// EnsureDirectoryExists creates a directory if it doesn't exist
	EnsureDirectoryExists(path string) error
	
	// GetDownloadPath returns the full path for a download
	GetDownloadPath(artist, album, track string) string
	
	// FileExists checks if a file exists
	FileExists(path string) bool
	
	// GetFileSize returns the size of a file
	GetFileSize(path string) (int64, error)
	
	// ValidateDownloadLocation checks if the download location is accessible
	ValidateDownloadLocation(path string) error
}

// Logger interface defines the contract for logging
type Logger interface {
	// Info logs an info message
	Info(message string, args ...interface{})
	
	// Warning logs a warning message
	Warning(message string, args ...interface{})
	
	// Error logs an error message
	Error(message string, args ...interface{})
	
	// Debug logs a debug message
	Debug(message string, args ...interface{})
	
	// Success logs a success message
	Success(message string, args ...interface{})
}

// CLIMode implements ApplicationMode for CLI operations
type CLIMode struct {
	services *AppServices
	logger   Logger
}

// NewCLIMode creates a new CLI mode instance
func NewCLIMode() *CLIMode {
	return &CLIMode{
		logger: NewConsoleLogger(),
	}
}

// Initialize sets up the CLI mode
func (c *CLIMode) Initialize(services *AppServices) error {
	c.services = services
	return nil
}

// Run executes CLI commands
func (c *CLIMode) Run(args []string) error {
	// This would integrate with the existing cobra command structure
	// For now, we'll delegate to the existing rootCmd.Execute()
	return rootCmd.Execute()
}

// Shutdown gracefully shuts down CLI mode
func (c *CLIMode) Shutdown() error {
	// CLI mode doesn't need special shutdown handling
	return nil
}

// GetMode returns the CLI mode identifier
func (c *CLIMode) GetMode() ServiceMode {
	return ModeCLI
}

// ServerMode implements ApplicationMode for web server operations
type ServerMode struct {
	services  *AppServices
	webServer *WebServer
	logger    Logger
}

// NewServerMode creates a new server mode instance
func NewServerMode(config *ServerConfig) *ServerMode {
	return &ServerMode{
		webServer: NewWebServer(config),
		logger:    NewConsoleLogger(),
	}
}

// Initialize sets up the server mode
func (s *ServerMode) Initialize(services *AppServices) error {
	s.services = services
	
	// Inject services into the web server
	s.webServer.SetServices(services)
	
	return nil
}

// Run starts the web server
func (s *ServerMode) Run(args []string) error {
	s.logger.Info("Starting DAB Downloader Web Server")
	return s.webServer.Start()
}

// Shutdown gracefully shuts down the server
func (s *ServerMode) Shutdown() error {
	s.logger.Info("Shutting down DAB Downloader Web Server")
	return s.webServer.Stop()
}

// GetMode returns the server mode identifier
func (s *ServerMode) GetMode() ServiceMode {
	return ModeServer
}

// ConsoleLogger implements Logger for console output
type ConsoleLogger struct{}

// NewConsoleLogger creates a new console logger
func NewConsoleLogger() *ConsoleLogger {
	return &ConsoleLogger{}
}

// Info logs an info message
func (l *ConsoleLogger) Info(message string, args ...interface{}) {
	colorInfo.Printf("ℹ️ "+message+"\n", args...)
}

// Warning logs a warning message
func (l *ConsoleLogger) Warning(message string, args ...interface{}) {
	colorWarning.Printf("⚠️ "+message+"\n", args...)
}

// Error logs an error message
func (l *ConsoleLogger) Error(message string, args ...interface{}) {
	colorError.Printf("❌ "+message+"\n", args...)
}

// Debug logs a debug message
func (l *ConsoleLogger) Debug(message string, args ...interface{}) {
	// Only log debug messages if debug mode is enabled
	// This could be controlled by a global debug flag
	fmt.Printf("🐛 DEBUG: "+message+"\n", args...)
}

// Success logs a success message
func (l *ConsoleLogger) Success(message string, args ...interface{}) {
	colorSuccess.Printf("✅ "+message+"\n", args...)
}

// FileSystemManager implementation
type DefaultFileSystemManager struct {
	config *Config
}

// NewDefaultFileSystemManager creates a new file system manager
func NewDefaultFileSystemManager(config *Config) *DefaultFileSystemManager {
	return &DefaultFileSystemManager{config: config}
}

// EnsureDirectoryExists creates a directory if it doesn't exist
func (fsm *DefaultFileSystemManager) EnsureDirectoryExists(path string) error {
	return CreateDirIfNotExists(path)
}

// GetDownloadPath returns the full path for a download
func (fsm *DefaultFileSystemManager) GetDownloadPath(artist, album, track string) string {
	artistDir := filepath.Join(fsm.config.DownloadLocation, SanitizeFileName(artist))
	albumDir := filepath.Join(artistDir, SanitizeFileName(album))
	trackFileName := SanitizeFileName(track) + ".flac"
	return filepath.Join(albumDir, trackFileName)
}

// FileExists checks if a file exists
func (fsm *DefaultFileSystemManager) FileExists(path string) bool {
	return FileExists(path)
}

// GetFileSize returns the size of a file
func (fsm *DefaultFileSystemManager) GetFileSize(path string) (int64, error) {
	info, err := os.Stat(path)
	if err != nil {
		return 0, err
	}
	return info.Size(), nil
}

// ValidateDownloadLocation checks if the download location is accessible
func (fsm *DefaultFileSystemManager) ValidateDownloadLocation(path string) error {
	// Check if directory exists, create if it doesn't
	if err := fsm.EnsureDirectoryExists(path); err != nil {
		return fmt.Errorf("cannot create download directory: %w", err)
	}
	
	// Test write permissions
	testFile := filepath.Join(path, ".write_test")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		return fmt.Errorf("download directory is not writable: %w", err)
	}
	
	// Clean up test file
	os.Remove(testFile)
	
	return nil
}
package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
)

// ServiceMode represents the application mode
type ServiceMode string

const (
	ModeCLI    ServiceMode = "cli"
	ModeServer ServiceMode = "server"
)

// AppServices holds all shared services used by both CLI and server modes
type AppServices struct {
	Config          *Config
	DabAPI          *DabAPI
	DownloadService *DownloadService
	ConfigService   *ConfigService
	Mode            ServiceMode
	mutex           sync.RWMutex
}

// NewAppServices creates a new instance of shared services
func NewAppServices(mode ServiceMode) (*AppServices, error) {
	services := &AppServices{
		Mode: mode,
	}
	
	// Initialize configuration service
	configService, err := NewConfigService()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize config service: %w", err)
	}
	services.ConfigService = configService
	
	// Load configuration
	config, err := configService.LoadConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load configuration: %w", err)
	}
	services.Config = config
	
	// Initialize DAB API client
	client := &http.Client{Timeout: requestTimeout}
	if config.InsecureSkipVerify {
		client.Transport = &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		}
	}
	
	services.DabAPI = NewDabAPI(config.APIURL, config.DownloadLocation, client)
	
	// Initialize download service
	services.DownloadService = NewDownloadService(services.DabAPI, config)
	
	return services, nil
}

// UpdateConfig updates the configuration and reinitializes dependent services
func (s *AppServices) UpdateConfig(newConfig *Config) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	s.Config = newConfig
	
	// Reinitialize DAB API with new config
	client := &http.Client{Timeout: requestTimeout}
	s.DabAPI = NewDabAPI(newConfig.APIURL, newConfig.DownloadLocation, client)
	
	// Reinitialize download service
	s.DownloadService = NewDownloadService(s.DabAPI, newConfig)
	
	return nil
}

// GetConfig returns a copy of the current configuration
func (s *AppServices) GetConfig() *Config {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	// Return a copy to prevent external modifications
	configCopy := *s.Config
	return &configCopy
}

// ConfigService handles configuration management for both CLI and server modes
type ConfigService struct {
	configPath string
	mutex      sync.RWMutex
}

// NewConfigService creates a new configuration service
func NewConfigService() (*ConfigService, error) {
	configPath := filepath.Join("config", "config.json")
	
	return &ConfigService{
		configPath: configPath,
	}, nil
}

// LoadConfig loads configuration from file or creates default config
func (cs *ConfigService) LoadConfig() (*Config, error) {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()
	
	config := &Config{
		APIURL:           "https://dabmusic.xyz",
		DownloadLocation: getDefaultDownloadLocation(),
		Parallelism:      5,
		UpdateRepo:       "PrathxmOp/dab-downloader",
		VerifyDownloads:  true,
		MaxRetryAttempts: defaultMaxRetries,
		WarningBehavior:  "summary",
		Format:           "flac",
		Bitrate:          "320",
	}
	
	// Try to load existing config
	if FileExists(cs.configPath) {
		if err := LoadConfig(cs.configPath, config); err != nil {
			return nil, fmt.Errorf("failed to load config from %s: %w", cs.configPath, err)
		}
	}
	
	// Set defaults for missing fields
	if config.Format == "" {
		config.Format = "flac"
	}
	if config.Bitrate == "" {
		config.Bitrate = "320"
	}
	if config.WarningBehavior == "" {
		config.WarningBehavior = "summary"
	}
	
	return config, nil
}

// SaveConfig saves configuration to file
func (cs *ConfigService) SaveConfig(config *Config) error {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()
	
	return SaveConfig(cs.configPath, config)
}

// ValidateConfig validates configuration settings
func (cs *ConfigService) ValidateConfig(config *Config) error {
	if config.APIURL == "" {
		return fmt.Errorf("API URL is required")
	}
	
	if config.DownloadLocation == "" {
		return fmt.Errorf("download location is required")
	}
	
	if config.Parallelism <= 0 {
		return fmt.Errorf("parallelism must be greater than 0")
	}
	
	if config.WarningBehavior != "immediate" && config.WarningBehavior != "summary" && config.WarningBehavior != "silent" {
		return fmt.Errorf("warning behavior must be 'immediate', 'summary', or 'silent'")
	}
	
	return nil
}

// DownloadService provides download functionality for both CLI and server modes
type DownloadService struct {
	api    *DabAPI
	config *Config
	mutex  sync.RWMutex
}

// NewDownloadService creates a new download service
func NewDownloadService(api *DabAPI, config *Config) *DownloadService {
	return &DownloadService{
		api:    api,
		config: config,
	}
}

// DownloadAlbumRequest represents a download request
type DownloadAlbumRequest struct {
	AlbumID         string
	Format          string
	Bitrate         string
	Debug           bool
	WarningCollector *WarningCollector
}

// DownloadAlbumResult represents the result of an album download
type DownloadAlbumResult struct {
	AlbumID string
	Stats   *DownloadStats
	Error   error
}

// DownloadAlbum downloads a single album
func (ds *DownloadService) DownloadAlbum(ctx context.Context, req DownloadAlbumRequest) (*DownloadStats, error) {
	ds.mutex.RLock()
	config := ds.config
	api := ds.api
	ds.mutex.RUnlock()
	
	// Use provided format/bitrate or fall back to config defaults
	format := req.Format
	if format == "" {
		format = config.Format
	}
	
	bitrate := req.Bitrate
	if bitrate == "" {
		bitrate = config.Bitrate
	}
	
	// Create a temporary config with the requested format/bitrate
	tempConfig := *config
	tempConfig.Format = format
	tempConfig.Bitrate = bitrate
	
	return api.DownloadAlbum(ctx, req.AlbumID, &tempConfig, req.Debug, nil, req.WarningCollector)
}

// DownloadMultipleAlbums downloads multiple albums concurrently
func (ds *DownloadService) DownloadMultipleAlbums(ctx context.Context, requests []DownloadAlbumRequest) ([]DownloadAlbumResult, error) {
	results := make([]DownloadAlbumResult, len(requests))
	
	// Use a semaphore to limit concurrent downloads
	sem := make(chan struct{}, ds.config.Parallelism)
	var wg sync.WaitGroup
	
	for i, req := range requests {
		wg.Add(1)
		go func(index int, request DownloadAlbumRequest) {
			defer wg.Done()
			
			// Acquire semaphore
			sem <- struct{}{}
			defer func() { <-sem }()
			
			stats, err := ds.DownloadAlbum(ctx, request)
			results[index] = DownloadAlbumResult{
				AlbumID: request.AlbumID,
				Stats:   stats,
				Error:   err,
			}
		}(i, req)
	}
	
	wg.Wait()
	return results, nil
}

// SearchService provides search functionality
type SearchService struct {
	api *DabAPI
}

// NewSearchService creates a new search service
func NewSearchService(api *DabAPI) *SearchService {
	return &SearchService{api: api}
}

// ServiceSearchRequest represents a search request for the service layer
type ServiceSearchRequest struct {
	Query string
	Type  string
	Limit int
	Debug bool
}

// Search performs a search using the DAB API
func (ss *SearchService) Search(ctx context.Context, req ServiceSearchRequest) (*SearchResults, error) {
	return ss.api.Search(ctx, req.Query, req.Type, req.Limit, req.Debug)
}

// Helper function to get default download location
func getDefaultDownloadLocation() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return filepath.Join(".", "Music") // Fallback to current directory
	}
	return filepath.Join(homeDir, "Music")
}

// UpdateConfig updates the configuration for the download service
func (ds *DownloadService) UpdateConfig(config *Config) {
	ds.mutex.Lock()
	defer ds.mutex.Unlock()
	ds.config = config
}
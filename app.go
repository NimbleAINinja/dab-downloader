package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

// Application represents the main application that can run in different modes
type Application struct {
	mode     ApplicationMode
	services *AppServices
}

// NewApplication creates a new application instance
func NewApplication() *Application {
	return &Application{}
}

// InitializeCLIMode initializes the application in CLI mode
func (app *Application) InitializeCLIMode() error {
	// Initialize shared services for CLI mode
	services, err := NewAppServices(ModeCLI)
	if err != nil {
		return fmt.Errorf("failed to initialize CLI services: %w", err)
	}
	
	// Create CLI mode
	cliMode := NewCLIMode()
	if err := cliMode.Initialize(services); err != nil {
		return fmt.Errorf("failed to initialize CLI mode: %w", err)
	}
	
	app.services = services
	app.mode = cliMode
	
	return nil
}

// InitializeServerMode initializes the application in server mode
func (app *Application) InitializeServerMode(serverConfig *ServerConfig) error {
	// Initialize shared services for server mode
	services, err := NewAppServices(ModeServer)
	if err != nil {
		return fmt.Errorf("failed to initialize server services: %w", err)
	}
	
	// Create server mode
	serverMode := NewServerMode(serverConfig)
	if err := serverMode.Initialize(services); err != nil {
		return fmt.Errorf("failed to initialize server mode: %w", err)
	}
	
	app.services = services
	app.mode = serverMode
	
	return nil
}

// Run starts the application in the configured mode
func (app *Application) Run(args []string) error {
	if app.mode == nil {
		return fmt.Errorf("application mode not initialized")
	}
	
	// Set up signal handling for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	
	// Start the application mode in a goroutine
	errChan := make(chan error, 1)
	go func() {
		errChan <- app.mode.Run(args)
	}()
	
	// Wait for either completion or signal
	select {
	case err := <-errChan:
		return err
	case sig := <-sigChan:
		fmt.Printf("\nReceived signal %v, shutting down gracefully...\n", sig)
		return app.Shutdown()
	}
}

// Shutdown gracefully shuts down the application
func (app *Application) Shutdown() error {
	if app.mode != nil {
		return app.mode.Shutdown()
	}
	return nil
}

// GetServices returns the shared services
func (app *Application) GetServices() *AppServices {
	return app.services
}

// GetMode returns the current application mode
func (app *Application) GetMode() ApplicationMode {
	return app.mode
}

// UpdateConfiguration updates the application configuration
func (app *Application) UpdateConfiguration(newConfig *Config) error {
	if app.services == nil {
		return fmt.Errorf("services not initialized")
	}
	
	// Validate the new configuration
	if err := app.services.ConfigService.ValidateConfig(newConfig); err != nil {
		return fmt.Errorf("invalid configuration: %w", err)
	}
	
	// Save the configuration
	if err := app.services.ConfigService.SaveConfig(newConfig); err != nil {
		return fmt.Errorf("failed to save configuration: %w", err)
	}
	
	// Update services with new configuration
	if err := app.services.UpdateConfig(newConfig); err != nil {
		return fmt.Errorf("failed to update services: %w", err)
	}
	
	return nil
}

// GetConfiguration returns the current configuration
func (app *Application) GetConfiguration() *Config {
	if app.services == nil {
		return nil
	}
	return app.services.GetConfig()
}

// ValidateEnvironment checks if the environment is suitable for the application
func (app *Application) ValidateEnvironment() error {
	if app.services == nil {
		return fmt.Errorf("services not initialized")
	}
	
	config := app.services.GetConfig()
	
	// Validate download location
	fsManager := NewDefaultFileSystemManager(config)
	if err := fsManager.ValidateDownloadLocation(config.DownloadLocation); err != nil {
		return fmt.Errorf("download location validation failed: %w", err)
	}
	
	// Additional environment checks can be added here
	// For example: checking for required external tools like ffmpeg
	
	return nil
}

// GetApplicationInfo returns information about the application
func (app *Application) GetApplicationInfo() map[string]interface{} {
	info := map[string]interface{}{
		"version": toolVersion,
		"author":  authorName,
	}
	
	if app.mode != nil {
		info["mode"] = string(app.mode.GetMode())
	}
	
	if app.services != nil {
		config := app.services.GetConfig()
		info["config"] = map[string]interface{}{
			"apiURL":           config.APIURL,
			"downloadLocation": config.DownloadLocation,
			"parallelism":      config.Parallelism,
			"format":           config.Format,
			"bitrate":          config.Bitrate,
		}
	}
	
	return info
}
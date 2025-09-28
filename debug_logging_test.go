package main

import (
	"bytes"
	"log"
	"os"
	"strings"
	"testing"
	"time"
)

// TestDebugLoggingSuppression tests that HTTP retry messages are suppressed when debug is false
func TestDebugLoggingSuppression(t *testing.T) {
	// Capture log output
	var buf bytes.Buffer
	log.SetOutput(&buf)
	defer log.SetOutput(os.Stderr) // Restore original output
	
	// Test function that always fails with a retryable error
	failingFunc := func() error {
		return &HTTPError{
			StatusCode: 503,
			Status:     "Service Unavailable",
			Message:    "Test error",
		}
	}
	
	// Test with debug = false (should suppress logs)
	buf.Reset()
	err := RetryWithBackoffForHTTPWithDebug(2, 10*time.Millisecond, 100*time.Millisecond, failingFunc, false)
	
	// Should have an error but no log output
	if err == nil {
		t.Error("Expected error from failing function")
	}
	
	logOutput := buf.String()
	if strings.Contains(logOutput, "HTTP request failed") {
		t.Errorf("Expected no log output with debug=false, but got: %s", logOutput)
	}
	
	// Test with debug = true (should show logs)
	buf.Reset()
	err = RetryWithBackoffForHTTPWithDebug(2, 10*time.Millisecond, 100*time.Millisecond, failingFunc, true)
	
	// Should have an error and log output
	if err == nil {
		t.Error("Expected error from failing function")
	}
	
	logOutput = buf.String()
	if !strings.Contains(logOutput, "HTTP request failed") {
		t.Errorf("Expected log output with debug=true, but got: %s", logOutput)
	}
	
	// Should contain retry attempt information
	if !strings.Contains(logOutput, "attempt 1/2") {
		t.Errorf("Expected retry attempt information in log output, but got: %s", logOutput)
	}
}

// TestMusicBrainzClientDebugMode tests that the MusicBrainz client respects debug mode
func TestMusicBrainzClientDebugMode(t *testing.T) {
	// Test client creation with debug mode
	client := NewMusicBrainzClientWithDebug(true)
	if !client.debug {
		t.Error("Expected debug mode to be enabled")
	}
	
	// Test setting debug mode
	client.SetDebug(false)
	if client.debug {
		t.Error("Expected debug mode to be disabled")
	}
	
	client.SetDebug(true)
	if !client.debug {
		t.Error("Expected debug mode to be enabled")
	}
}

// TestBackwardCompatibility tests that the original RetryWithBackoffForHTTP function still works
func TestBackwardCompatibility(t *testing.T) {
	// Capture log output
	var buf bytes.Buffer
	log.SetOutput(&buf)
	defer log.SetOutput(os.Stderr)
	
	// Test function that always fails with a retryable error
	failingFunc := func() error {
		return &HTTPError{
			StatusCode: 503,
			Status:     "Service Unavailable", 
			Message:    "Test error",
		}
	}
	
	// The original function should default to debug=false (no logging)
	buf.Reset()
	err := RetryWithBackoffForHTTP(2, 10*time.Millisecond, 100*time.Millisecond, failingFunc)
	
	if err == nil {
		t.Error("Expected error from failing function")
	}
	
	logOutput := buf.String()
	if strings.Contains(logOutput, "HTTP request failed") {
		t.Errorf("Expected no log output from original function, but got: %s", logOutput)
	}
}
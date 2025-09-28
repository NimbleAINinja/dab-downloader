// +build ignore

// This is a demonstration script showing how debug logging suppression works
// Run with: go run debug_suppression_demo.go

package main

import (
	"fmt"
	"log"
	"os"
	"time"
)

func main() {
	fmt.Println("=== Debug Logging Suppression Demonstration ===\n")
	
	// Create a function that simulates MusicBrainz rate limiting
	simulateRateLimit := func() error {
		return &HTTPError{
			StatusCode: 503,
			Status:     "Service Unavailable",
			Message:    `{"error": "Your requests are exceeding the allowable rate limit. Please see http://wiki.musicbrainz.org/XMLWebService for more information."}`,
		}
	}
	
	fmt.Println("1. Normal operation (debug = false) - should be silent:")
	fmt.Println("   Simulating 3 retry attempts...")
	
	// Capture original log output
	originalOutput := log.Writer()
	
	// Redirect log to discard for demonstration
	log.SetOutput(os.Stdout)
	
	// Test with debug = false (should be silent)
	err := RetryWithBackoffForHTTPWithDebug(3, 50*time.Millisecond, 200*time.Millisecond, simulateRateLimit, false)
	
	fmt.Printf("   Result: %v\n", err)
	fmt.Println("   ^ Notice: No retry messages displayed during operation\n")
	
	fmt.Println("2. Debug mode (debug = true) - should show retry messages:")
	fmt.Println("   Simulating 3 retry attempts...")
	
	// Test with debug = true (should show messages)
	err = RetryWithBackoffForHTTPWithDebug(3, 50*time.Millisecond, 200*time.Millisecond, simulateRateLimit, true)
	
	fmt.Printf("   Result: %v\n", err)
	fmt.Println("   ^ Notice: Retry messages were displayed above\n")
	
	// Restore original log output
	log.SetOutput(originalOutput)
	
	fmt.Println("3. MusicBrainz Client Debug Mode:")
	
	// Demonstrate MusicBrainz client debug mode
	client := NewMusicBrainzClient()
	fmt.Printf("   Default debug mode: %t\n", client.debug)
	
	client.SetDebug(true)
	fmt.Printf("   After SetDebug(true): %t\n", client.debug)
	
	client.SetDebug(false)
	fmt.Printf("   After SetDebug(false): %t\n", client.debug)
	
	// Create client with debug mode
	debugClient := NewMusicBrainzClientWithDebug(true)
	fmt.Printf("   NewMusicBrainzClientWithDebug(true): %t\n", debugClient.debug)
	
	fmt.Println("\n4. Backward Compatibility:")
	fmt.Println("   Original RetryWithBackoffForHTTP function (should be silent):")
	
	log.SetOutput(os.Stdout)
	err = RetryWithBackoffForHTTP(2, 50*time.Millisecond, 200*time.Millisecond, simulateRateLimit)
	log.SetOutput(originalOutput)
	
	fmt.Printf("   Result: %v\n", err)
	fmt.Println("   ^ Notice: Original function defaults to silent operation")
	
	fmt.Println("\n=== Demonstration Complete ===")
	fmt.Println("Key Benefits:")
	fmt.Println("- Clean download progress without retry noise")
	fmt.Println("- Full debug visibility when needed with --debug flag")
	fmt.Println("- Backward compatibility with existing code")
	fmt.Println("- Same retry logic and error handling")
}
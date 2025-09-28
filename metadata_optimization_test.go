package main

import (
	"testing"
)

// TestAlbumMetadataCache tests the caching functionality for MusicBrainz release metadata
func TestAlbumMetadataCache(t *testing.T) {
	// Clear cache before test
	ClearAlbumCache()
	
	// Test data
	artist := "Test Artist"
	album := "Test Album"
	
	// Initially cache should be empty
	count, _ := GetCacheStats()
	if count != 0 {
		t.Errorf("Expected empty cache, got %d items", count)
	}
	
	// Test cache miss
	cached := albumCache.GetCachedRelease(artist, album)
	if cached != nil {
		t.Error("Expected cache miss, but got a result")
	}
	
	// Create mock release data
	mockRelease := &MusicBrainzRelease{
		ID:    "test-release-id",
		Title: album,
		ArtistCredit: []struct {
			Artist struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"artist"`
		}{
			{
				Artist: struct {
					ID   string `json:"id"`
					Name string `json:"name"`
				}{
					ID:   "test-artist-id",
					Name: artist,
				},
			},
		},
		ReleaseGroup: ReleaseGroup{
			ID: "test-release-group-id",
		},
	}
	
	// Store in cache
	albumCache.SetCachedRelease(artist, album, mockRelease)
	
	// Verify cache hit
	cached = albumCache.GetCachedRelease(artist, album)
	if cached == nil {
		t.Error("Expected cache hit, but got nil")
	}
	
	if cached.ID != mockRelease.ID {
		t.Errorf("Expected cached ID %s, got %s", mockRelease.ID, cached.ID)
	}
	
	// Verify cache stats
	count, keys := GetCacheStats()
	if count != 1 {
		t.Errorf("Expected 1 cached item, got %d", count)
	}
	
	expectedKey := getCacheKey(artist, album)
	found := false
	for _, key := range keys {
		if key == expectedKey {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("Expected to find key %s in cache keys %v", expectedKey, keys)
	}
	
	// Test cache with different album
	cached2 := albumCache.GetCachedRelease(artist, "Different Album")
	if cached2 != nil {
		t.Error("Expected cache miss for different album, but got a result")
	}
	
	// Clear cache
	ClearAlbumCache()
	count, _ = GetCacheStats()
	if count != 0 {
		t.Errorf("Expected empty cache after clear, got %d items", count)
	}
}

// TestCacheKeyGeneration tests the cache key generation function
func TestCacheKeyGeneration(t *testing.T) {
	tests := []struct {
		artist   string
		album    string
		expected string
	}{
		{"Artist", "Album", "Artist|Album"},
		{"", "", "|"},
		{"Artist With Spaces", "Album With Spaces", "Artist With Spaces|Album With Spaces"},
		{"Artist|With|Pipes", "Album", "Artist|With|Pipes|Album"},
	}
	
	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := getCacheKey(tt.artist, tt.album)
			if result != tt.expected {
				t.Errorf("Expected cache key %s, got %s", tt.expected, result)
			}
		})
	}
}

// BenchmarkCacheOperations benchmarks cache operations to ensure they're efficient
func BenchmarkCacheOperations(t *testing.B) {
	ClearAlbumCache()
	
	mockRelease := &MusicBrainzRelease{
		ID:    "benchmark-release-id",
		Title: "Benchmark Album",
	}
	
	t.ResetTimer()
	
	for i := 0; i < t.N; i++ {
		artist := "Benchmark Artist"
		album := "Benchmark Album"
		
		// Set and get operations
		albumCache.SetCachedRelease(artist, album, mockRelease)
		_ = albumCache.GetCachedRelease(artist, album)
	}
}

// TestWarningClearingOnSuccess tests that release warnings are cleared when metadata is successfully found
func TestWarningClearingOnSuccess(t *testing.T) {
	// Clear cache before test
	ClearAlbumCache()
	
	// Create a warning collector
	warningCollector := NewWarningCollector(true)
	
	// Test data
	artist := "Test Artist"
	album := "Test Album"
	
	// Initially should have no warnings
	if warningCollector.HasWarnings() {
		t.Error("Expected no warnings initially")
	}
	
	// Simulate a failed release lookup by adding a warning
	warningCollector.AddMusicBrainzReleaseWarning(artist, album, "Test error")
	
	// Verify warning was added
	if !warningCollector.HasWarnings() {
		t.Error("Expected warning to be added")
	}
	
	if warningCollector.GetWarningCount() != 1 {
		t.Errorf("Expected 1 warning, got %d", warningCollector.GetWarningCount())
	}
	
	// Verify it's the right type of warning
	warnings := warningCollector.GetWarningsByType()
	if len(warnings[MusicBrainzReleaseWarning]) != 1 {
		t.Errorf("Expected 1 MusicBrainz release warning, got %d", len(warnings[MusicBrainzReleaseWarning]))
	}
	
	// Now simulate successful metadata retrieval by caching release data
	mockRelease := &MusicBrainzRelease{
		ID:    "test-release-id",
		Title: album,
		ArtistCredit: []struct {
			Artist struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"artist"`
		}{
			{
				Artist: struct {
					ID   string `json:"id"`
					Name string `json:"name"`
				}{
					ID:   "test-artist-id",
					Name: artist,
				},
			},
		},
		ReleaseGroup: ReleaseGroup{
			ID: "test-release-group-id",
		},
	}
	
	// Cache the release and clear the warning (simulating what addReleaseMetadata does)
	albumCache.SetCachedRelease(artist, album, mockRelease)
	warningCollector.RemoveMusicBrainzReleaseWarning(artist, album)
	
	// Verify warning was cleared
	if warningCollector.HasWarnings() {
		t.Error("Expected warning to be cleared after successful metadata retrieval")
	}
	
	if warningCollector.GetWarningCount() != 0 {
		t.Errorf("Expected 0 warnings after clearing, got %d", warningCollector.GetWarningCount())
	}
}

// TestWarningRemovalSelectivity tests that only specific warnings are removed
func TestWarningRemovalSelectivity(t *testing.T) {
	// Create a warning collector
	warningCollector := NewWarningCollector(true)
	
	// Add multiple different warnings
	warningCollector.AddMusicBrainzReleaseWarning("Artist1", "Album1", "Error1")
	warningCollector.AddMusicBrainzReleaseWarning("Artist2", "Album2", "Error2")
	warningCollector.AddMusicBrainzTrackWarning("Artist1", "Track1", "Track Error")
	
	// Verify all warnings were added
	if warningCollector.GetWarningCount() != 3 {
		t.Errorf("Expected 3 warnings, got %d", warningCollector.GetWarningCount())
	}
	
	// Remove only one specific release warning
	warningCollector.RemoveMusicBrainzReleaseWarning("Artist1", "Album1")
	
	// Verify only the specific warning was removed
	if warningCollector.GetWarningCount() != 2 {
		t.Errorf("Expected 2 warnings after removal, got %d", warningCollector.GetWarningCount())
	}
	
	warnings := warningCollector.GetWarningsByType()
	
	// Should still have one release warning and one track warning
	if len(warnings[MusicBrainzReleaseWarning]) != 1 {
		t.Errorf("Expected 1 remaining release warning, got %d", len(warnings[MusicBrainzReleaseWarning]))
	}
	
	if len(warnings[MusicBrainzTrackWarning]) != 1 {
		t.Errorf("Expected 1 track warning, got %d", len(warnings[MusicBrainzTrackWarning]))
	}
	
	// Verify the remaining release warning is for the correct album
	remainingWarning := warnings[MusicBrainzReleaseWarning][0]
	expectedContext := "Artist2 - Album2"
	if remainingWarning.Context != expectedContext {
		t.Errorf("Expected remaining warning context %s, got %s", expectedContext, remainingWarning.Context)
	}
}
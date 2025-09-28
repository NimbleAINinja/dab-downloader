package main

import (
	"reflect"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestInitValidator(t *testing.T) {
	// Test that validator initializes without error
	InitValidator()
	assert.NotNil(t, validate)
}

func TestValidateUUID4(t *testing.T) {
	InitValidator()
	
	tests := []struct {
		name     string
		uuid     string
		expected bool
	}{
		{
			name:     "valid UUID v4",
			uuid:     "550e8400-e29b-41d4-a716-446655440000",
			expected: true,
		},
		{
			name:     "valid UUID v4 with lowercase",
			uuid:     "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
			expected: false, // This is UUID v1, not v4
		},
		{
			name:     "invalid UUID format",
			uuid:     "not-a-uuid",
			expected: false,
		},
		{
			name:     "empty string",
			uuid:     "",
			expected: false,
		},
		{
			name:     "UUID v4 with uppercase",
			uuid:     "550E8400-E29B-41D4-A716-446655440000",
			expected: false, // Our regex expects lowercase
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a mock field level for testing
			mockField := &mockFieldLevel{value: tt.uuid}
			result := validateUUID4(mockField)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateAlphanumSpace(t *testing.T) {
	InitValidator()
	
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "valid alphanumeric with spaces",
			input:    "Hello World 123",
			expected: true,
		},
		{
			name:     "valid alphanumeric only",
			input:    "HelloWorld123",
			expected: true,
		},
		{
			name:     "invalid with special characters",
			input:    "Hello@World",
			expected: false,
		},
		{
			name:     "invalid with punctuation",
			input:    "Hello, World!",
			expected: false,
		},
		{
			name:     "empty string",
			input:    "",
			expected: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockField := &mockFieldLevel{value: tt.input}
			result := validateAlphanumSpace(mockField)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateNoHTML(t *testing.T) {
	InitValidator()
	
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "valid text without HTML",
			input:    "This is plain text",
			expected: true,
		},
		{
			name:     "invalid with HTML tags",
			input:    "<script>alert('xss')</script>",
			expected: false,
		},
		{
			name:     "invalid with simple HTML",
			input:    "<p>Hello World</p>",
			expected: false,
		},
		{
			name:     "valid with angle brackets in text",
			input:    "2 < 3 and 5 > 4",
			expected: true, // These aren't HTML tags
		},
		{
			name:     "empty string",
			input:    "",
			expected: true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockField := &mockFieldLevel{value: tt.input}
			result := validateNoHTML(mockField)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "clean string",
			input:    "Hello World",
			expected: "Hello World",
		},
		{
			name:     "string with HTML tags",
			input:    "<p>Hello <b>World</b></p>",
			expected: "Hello World",
		},
		{
			name:     "string with script tags",
			input:    "Hello <script>alert('xss')</script> World",
			expected: "Hello World",
		},
		{
			name:     "string with dangerous characters",
			input:    "Hello<>&\"' World",
			expected: "Hello World",
		},
		{
			name:     "string with extra whitespace",
			input:    "  Hello   World  ",
			expected: "Hello World",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "string with control characters",
			input:    "Hello\x00\x1f World\x7f",
			expected: "Hello World",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeString(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSanitizeSearchRequest(t *testing.T) {
	tests := []struct {
		name     string
		input    SearchRequest
		expected SearchRequest
	}{
		{
			name: "clean request",
			input: SearchRequest{
				Query: "Beatles",
				Type:  "artist",
				Limit: 10,
			},
			expected: SearchRequest{
				Query: "Beatles",
				Type:  "artist",
				Limit: 10,
			},
		},
		{
			name: "request with HTML in query",
			input: SearchRequest{
				Query: "<p>Beatles</p>",
				Type:  "ARTIST",
				Limit: 0,
			},
			expected: SearchRequest{
				Query: "Beatles",
				Type:  "artist",
				Limit: 10,
			},
		},
		{
			name: "request with empty type",
			input: SearchRequest{
				Query: "Beatles",
				Type:  "",
				Limit: 5,
			},
			expected: SearchRequest{
				Query: "Beatles",
				Type:  "all",
				Limit: 5,
			},
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			SanitizeSearchRequest(&tt.input)
			assert.Equal(t, tt.expected, tt.input)
		})
	}
}

func TestSanitizeDownloadRequest(t *testing.T) {
	tests := []struct {
		name     string
		input    DownloadRequest
		expected DownloadRequest
	}{
		{
			name: "clean request",
			input: DownloadRequest{
				AlbumIDs: []string{"album1", "album2"},
				Format:   "mp3",
				Bitrate:  "320",
			},
			expected: DownloadRequest{
				AlbumIDs: []string{"album1", "album2"},
				Format:   "mp3",
				Bitrate:  "320",
			},
		},
		{
			name: "request with HTML in album IDs",
			input: DownloadRequest{
				AlbumIDs: []string{"<b>album1</b>", "album2"},
				Format:   "MP3",
				Bitrate:  " 192 ",
			},
			expected: DownloadRequest{
				AlbumIDs: []string{"album1", "album2"},
				Format:   "mp3",
				Bitrate:  "192",
			},
		},
		{
			name: "request with empty format and bitrate",
			input: DownloadRequest{
				AlbumIDs: []string{"album1"},
				Format:   "",
				Bitrate:  "",
			},
			expected: DownloadRequest{
				AlbumIDs: []string{"album1"},
				Format:   "mp3",
				Bitrate:  "320",
			},
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			SanitizeDownloadRequest(&tt.input)
			assert.Equal(t, tt.expected, tt.input)
		})
	}
}

func TestNewSuccessResponse(t *testing.T) {
	data := map[string]string{"test": "data"}
	response := NewSuccessResponse(data)
	
	assert.True(t, response.Success)
	assert.Equal(t, data, response.Data)
	assert.Nil(t, response.Error)
	assert.WithinDuration(t, time.Now(), response.Timestamp, time.Second)
}

func TestNewErrorResponse(t *testing.T) {
	code := "TEST_ERROR"
	message := "Test error message"
	details := "Test error details"
	
	response := NewErrorResponse(code, message, details)
	
	assert.False(t, response.Success)
	assert.Nil(t, response.Data)
	assert.NotNil(t, response.Error)
	assert.Equal(t, code, response.Error.Code)
	assert.Equal(t, message, response.Error.Message)
	assert.Equal(t, details, response.Error.Details)
	assert.WithinDuration(t, time.Now(), response.Timestamp, time.Second)
}

func TestNewValidationErrorResponse(t *testing.T) {
	field := "testField"
	message := "Test validation error"
	
	response := NewValidationErrorResponse(field, message)
	
	assert.False(t, response.Success)
	assert.Nil(t, response.Data)
	assert.NotNil(t, response.Error)
	assert.Equal(t, ErrCodeValidationFailed, response.Error.Code)
	assert.Equal(t, "Validation failed", response.Error.Message)
	assert.Equal(t, message, response.Error.Details)
	assert.Equal(t, field, response.Error.Field)
}

func TestConvertToAPIArtist(t *testing.T) {
	artist := &Artist{
		ID:      "123",
		Name:    "Test Artist",
		Picture: "http://example.com/picture.jpg",
		Bio:     "Test bio",
		Country: "US",
		Albums: []Album{
			{
				ID:    "album1",
				Title: "Test Album",
			},
		},
	}
	
	apiArtist := ConvertToAPIArtist(artist)
	
	assert.Equal(t, "123", apiArtist.ID)
	assert.Equal(t, "Test Artist", apiArtist.Name)
	assert.Equal(t, "http://example.com/picture.jpg", apiArtist.Picture)
	assert.Equal(t, "Test bio", apiArtist.Bio)
	assert.Equal(t, "US", apiArtist.Country)
	assert.Len(t, apiArtist.Albums, 1)
	assert.Equal(t, "album1", apiArtist.Albums[0].ID)
}

func TestConvertToAPIAlbum(t *testing.T) {
	album := &Album{
		ID:          "album1",
		Title:       "Test Album",
		Artist:      "Test Artist",
		Cover:       "http://example.com/cover.jpg",
		ReleaseDate: "2023-01-01",
		Genre:       "Rock",
		Type:        "album",
		Label:       "Test Label",
		TotalTracks: 10,
		Tracks: []Track{
			{
				ID:       "track1",
				Title:    "Test Track",
				Duration: 180,
			},
		},
	}
	
	apiAlbum := ConvertToAPIAlbum(album)
	
	assert.Equal(t, "album1", apiAlbum.ID)
	assert.Equal(t, "Test Album", apiAlbum.Title)
	assert.Equal(t, "Test Artist", apiAlbum.Artist)
	assert.Equal(t, "http://example.com/cover.jpg", apiAlbum.Cover)
	assert.Equal(t, "2023-01-01", apiAlbum.ReleaseDate)
	assert.Equal(t, "Rock", apiAlbum.Genre)
	assert.Equal(t, "album", apiAlbum.Type)
	assert.Equal(t, "Test Label", apiAlbum.Label)
	assert.Equal(t, 10, apiAlbum.TotalTracks)
	assert.Len(t, apiAlbum.Tracks, 1)
	assert.Equal(t, 180, apiAlbum.Duration) // Total duration from tracks
}

func TestConvertToAPITrack(t *testing.T) {
	track := &Track{
		ID:          "track1",
		Title:       "Test Track",
		Artist:      "Test Artist",
		ArtistId:    "artist1",
		AlbumID:     "album1",
		Album:       "Test Album",
		Cover:       "http://example.com/cover.jpg",
		Duration:    180,
		TrackNumber: 1,
		DiscNumber:  1,
		Genre:       "Rock",
		ReleaseDate: "2023-01-01",
	}
	
	apiTrack := ConvertToAPITrack(track)
	
	assert.Equal(t, "track1", apiTrack.ID)
	assert.Equal(t, "Test Track", apiTrack.Title)
	assert.Equal(t, "Test Artist", apiTrack.Artist)
	assert.Equal(t, "artist1", apiTrack.ArtistID)
	assert.Equal(t, "album1", apiTrack.AlbumID)
	assert.Equal(t, "Test Album", apiTrack.Album)
	assert.Equal(t, "http://example.com/cover.jpg", apiTrack.Cover)
	assert.Equal(t, 180, apiTrack.Duration)
	assert.Equal(t, 1, apiTrack.TrackNumber)
	assert.Equal(t, 1, apiTrack.DiscNumber)
	assert.Equal(t, "Rock", apiTrack.Genre)
	assert.Equal(t, "2023-01-01", apiTrack.ReleaseDate)
}

func TestConvertToDownloadStatusResponse(t *testing.T) {
	startTime := time.Now().Add(-5 * time.Minute)
	endTime := time.Now()
	
	status := &DownloadStatus{
		ID:              "download1",
		AlbumIDs:        []string{"album1", "album2"},
		Status:          "completed",
		Progress:        100.0,
		Error:           "",
		StartTime:       startTime,
		EndTime:         &endTime,
		TotalTracks:     20,
		CompletedTracks: 20,
	}
	
	response := ConvertToDownloadStatusResponse(status)
	
	assert.Equal(t, "download1", response.ID)
	assert.Equal(t, []string{"album1", "album2"}, response.AlbumIDs)
	assert.Equal(t, "completed", response.Status)
	assert.Equal(t, 100.0, response.Progress)
	assert.Equal(t, "", response.Error)
	assert.Equal(t, startTime, response.StartTime)
	assert.Equal(t, &endTime, response.EndTime)
	assert.Equal(t, 20, response.TotalTracks)
	assert.Equal(t, 20, response.CompletedTracks)
	assert.Nil(t, response.EstimatedTime) // Should be nil for completed downloads
}

func TestConvertToDownloadStatusResponseWithEstimatedTime(t *testing.T) {
	startTime := time.Now().Add(-2 * time.Minute) // Started 2 minutes ago
	
	status := &DownloadStatus{
		ID:              "download1",
		AlbumIDs:        []string{"album1"},
		Status:          "downloading",
		Progress:        50.0, // 50% complete
		Error:           "",
		StartTime:       startTime,
		EndTime:         nil,
		TotalTracks:     10,
		CompletedTracks: 5,
	}
	
	response := ConvertToDownloadStatusResponse(status)
	
	assert.Equal(t, "downloading", response.Status)
	assert.Equal(t, 50.0, response.Progress)
	assert.NotNil(t, response.EstimatedTime)
	// Should estimate about 2 more minutes (since 50% took 2 minutes)
	assert.Greater(t, *response.EstimatedTime, 60)  // At least 1 minute
	assert.Less(t, *response.EstimatedTime, 180)    // Less than 3 minutes
}

// Mock field level for testing custom validators
type mockFieldLevel struct {
	value string
}

func (m *mockFieldLevel) Top() reflect.Value {
	return reflect.ValueOf(nil)
}

func (m *mockFieldLevel) Parent() reflect.Value {
	return reflect.ValueOf(nil)
}

func (m *mockFieldLevel) Field() reflect.Value {
	return reflect.ValueOf(m.value)
}

func (m *mockFieldLevel) FieldName() string {
	return "testField"
}

func (m *mockFieldLevel) StructFieldName() string {
	return "TestField"
}

func (m *mockFieldLevel) Param() string {
	return ""
}

func (m *mockFieldLevel) GetTag() string {
	return ""
}

func (m *mockFieldLevel) ExtractType(field reflect.Value) (reflect.Value, reflect.Kind, bool) {
	return reflect.ValueOf(nil), reflect.Invalid, false
}

func (m *mockFieldLevel) GetStructFieldOK() (reflect.Value, reflect.Kind, bool) {
	return reflect.ValueOf(nil), reflect.Invalid, false
}

func (m *mockFieldLevel) GetStructFieldOKAdvanced(val reflect.Value, namespace string) (reflect.Value, reflect.Kind, bool) {
	return reflect.ValueOf(nil), reflect.Invalid, false
}

func (m *mockFieldLevel) GetStructFieldOK2() (reflect.Value, reflect.Kind, bool, bool) {
	return reflect.ValueOf(nil), reflect.Invalid, false, false
}

func (m *mockFieldLevel) GetStructFieldOKAdvanced2(val reflect.Value, namespace string) (reflect.Value, reflect.Kind, bool, bool) {
	return reflect.ValueOf(nil), reflect.Invalid, false, false
}
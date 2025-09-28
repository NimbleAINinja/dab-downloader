package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestDownloadEndpoints(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a test server
	config := &ServerConfig{
		Host: "localhost",
		Port: "8080",
		Mode: gin.TestMode,
	}
	server := NewWebServer(config)
	server.setupRoutes()

	t.Run("POST /api/download - valid request", func(t *testing.T) {
		// Create a valid download request
		downloadReq := DownloadRequest{
			AlbumIDs: []string{"album1", "album2"},
		}
		reqBody, _ := json.Marshal(downloadReq)

		// Create HTTP request
		req, _ := http.NewRequest("POST", "/api/download", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Perform request
		server.router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var response DownloadResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.NotEmpty(t, response.DownloadID)
		assert.Equal(t, "pending", response.Status)
		assert.Contains(t, response.Message, "Download initiated for 2 album(s)")
	})

	t.Run("POST /api/download - empty album list", func(t *testing.T) {
		// Create an invalid download request
		downloadReq := DownloadRequest{
			AlbumIDs: []string{},
		}
		reqBody, _ := json.Marshal(downloadReq)

		// Create HTTP request
		req, _ := http.NewRequest("POST", "/api/download", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")

		// Create response recorder
		w := httptest.NewRecorder()

		// Perform request
		server.router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "No albums specified", response.Error)
	})

	t.Run("GET /api/download/status/:downloadId - existing download", func(t *testing.T) {
		// First create a download
		downloadReq := DownloadRequest{
			AlbumIDs: []string{"album1"},
		}
		reqBody, _ := json.Marshal(downloadReq)

		req, _ := http.NewRequest("POST", "/api/download", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		var downloadResponse DownloadResponse
		json.Unmarshal(w.Body.Bytes(), &downloadResponse)

		// Now check the status
		req, _ = http.NewRequest("GET", "/api/download/status/"+downloadResponse.DownloadID, nil)
		w = httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var status DownloadStatus
		err := json.Unmarshal(w.Body.Bytes(), &status)
		assert.NoError(t, err)
		assert.Equal(t, downloadResponse.DownloadID, status.ID)
		assert.Equal(t, []string{"album1"}, status.AlbumIDs)
		assert.Contains(t, []string{"pending", "downloading"}, status.Status)
	})

	t.Run("GET /api/download/status/:downloadId - non-existent download", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/download/status/non-existent-id", nil)
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusNotFound, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Download not found", response.Error)
	})

	t.Run("DELETE /api/download/:downloadId - existing download", func(t *testing.T) {
		// First create a download
		downloadReq := DownloadRequest{
			AlbumIDs: []string{"album1"},
		}
		reqBody, _ := json.Marshal(downloadReq)

		req, _ := http.NewRequest("POST", "/api/download", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		var downloadResponse DownloadResponse
		json.Unmarshal(w.Body.Bytes(), &downloadResponse)

		// Now cancel the download
		req, _ = http.NewRequest("DELETE", "/api/download/"+downloadResponse.DownloadID, nil)
		w = httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Download cancelled successfully", response["message"])
		assert.Equal(t, downloadResponse.DownloadID, response["downloadId"])

		// Verify the download status is cancelled
		req, _ = http.NewRequest("GET", "/api/download/status/"+downloadResponse.DownloadID, nil)
		w = httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		var status DownloadStatus
		json.Unmarshal(w.Body.Bytes(), &status)
		assert.Equal(t, "cancelled", status.Status)
		assert.NotNil(t, status.EndTime)
	})

	t.Run("DELETE /api/download/:downloadId - non-existent download", func(t *testing.T) {
		req, _ := http.NewRequest("DELETE", "/api/download/non-existent-id", nil)
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)

		// Assert response
		assert.Equal(t, http.StatusNotFound, w.Code)

		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Download not found", response.Error)
	})
}

func TestDownloadManager(t *testing.T) {
	dm := NewDownloadManager()

	t.Run("AddDownload", func(t *testing.T) {
		albumIDs := []string{"album1", "album2"}
		status := dm.AddDownload("test-id", albumIDs)

		assert.Equal(t, "test-id", status.ID)
		assert.Equal(t, albumIDs, status.AlbumIDs)
		assert.Equal(t, "pending", status.Status)
		assert.Equal(t, float64(0), status.Progress)
		assert.False(t, status.StartTime.IsZero())
	})

	t.Run("GetDownload", func(t *testing.T) {
		albumIDs := []string{"album1"}
		dm.AddDownload("get-test-id", albumIDs)

		status, exists := dm.GetDownload("get-test-id")
		assert.True(t, exists)
		assert.Equal(t, "get-test-id", status.ID)

		_, exists = dm.GetDownload("non-existent")
		assert.False(t, exists)
	})

	t.Run("UpdateDownload", func(t *testing.T) {
		albumIDs := []string{"album1"}
		dm.AddDownload("update-test-id", albumIDs)

		dm.UpdateDownload("update-test-id", "downloading", 50.0, 5, 10, nil)

		status, _ := dm.GetDownload("update-test-id")
		assert.Equal(t, "downloading", status.Status)
		assert.Equal(t, 50.0, status.Progress)
		assert.Equal(t, 5, status.CompletedTracks)
		assert.Equal(t, 10, status.TotalTracks)
		assert.Empty(t, status.Error)
		assert.Nil(t, status.EndTime)

		// Test with error
		testErr := assert.AnError
		dm.UpdateDownload("update-test-id", "error", 100.0, 5, 10, testErr)

		status, _ = dm.GetDownload("update-test-id")
		assert.Equal(t, "error", status.Status)
		assert.Equal(t, testErr.Error(), status.Error)
		assert.NotNil(t, status.EndTime)
	})

	t.Run("CancelDownload", func(t *testing.T) {
		albumIDs := []string{"album1"}
		dm.AddDownload("cancel-test-id", albumIDs)

		success := dm.CancelDownload("cancel-test-id")
		assert.True(t, success)

		status, _ := dm.GetDownload("cancel-test-id")
		assert.Equal(t, "cancelled", status.Status)
		assert.NotNil(t, status.EndTime)

		// Test cancelling non-existent download
		success = dm.CancelDownload("non-existent")
		assert.False(t, success)
	})
}

import { AppProvider, useAppContext, useSearchState, useSelectionState, useDownloadState } from '../contexts/AppContext';
import NotificationSystem from './NotificationSystem';
import type { Artist, Album } from '../types';

// ============================================================================
// Example Component Using Global State
// ============================================================================

function AppStateDemo() {
  const { actions } = useAppContext();
  const searchState = useSearchState();
  const selectionState = useSelectionState();
  const downloadState = useDownloadState();

  // Mock data for demonstration
  const mockArtist: Artist = {
    id: 'artist-1',
    name: 'Example Artist',
    picture: 'https://via.placeholder.com/150'
  };

  const mockAlbums: Album[] = [
    {
      id: 'album-1',
      title: 'First Album',
      artist: 'Example Artist',
      cover: 'https://via.placeholder.com/200',
      releaseDate: '2023-01-01',
      tracks: []
    },
    {
      id: 'album-2',
      title: 'Second Album',
      artist: 'Example Artist',
      cover: 'https://via.placeholder.com/200',
      releaseDate: '2023-06-01',
      tracks: []
    }
  ];

  const handleSearch = () => {
    actions.startSearch('Example Artist');
    
    // Simulate API call
    setTimeout(() => {
      actions.searchSuccess({
        artists: [mockArtist],
        albums: mockAlbums,
        tracks: []
      }, 'Example Artist');
      
      actions.showSuccessNotification('Search Complete', 'Found 1 artist and 2 albums');
    }, 1000);
  };

  const handleSelectArtist = () => {
    actions.selectArtist(mockArtist);
    actions.setAlbums(mockAlbums);
    actions.showInfoNotification('Artist Selected', `Selected ${mockArtist.name}`);
  };

  const handleToggleAlbum = (albumId: string) => {
    actions.toggleAlbumSelection(albumId);
  };

  const handleSelectAll = () => {
    if (selectionState.selectAllState === 'all') {
      actions.deselectAllAlbums();
    } else {
      actions.selectAllAlbums();
    }
  };

  const handleDownload = () => {
    const selectedAlbumIds = Array.from(selectionState.selectedAlbums);
    if (selectedAlbumIds.length === 0) {
      actions.showWarningNotification('No Selection', 'Please select at least one album to download');
      return;
    }

    const downloadId = `download-${Date.now()}`;
    actions.startDownload(downloadId, selectedAlbumIds);
    actions.showInfoNotification('Download Started', `Started downloading ${selectedAlbumIds.length} album(s)`);

    // Simulate download progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      actions.updateDownload(downloadId, { 
        status: 'downloading', 
        progress 
      });

      if (progress >= 100) {
        clearInterval(interval);
        actions.completeDownload(downloadId);
        actions.showSuccessNotification('Download Complete', 'All albums downloaded successfully');
      }
    }, 500);
  };

  const handleError = () => {
    actions.showErrorNotification('Test Error', 'This is a test error notification');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Global State Management Demo
      </h1>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Search State</h2>
        <div className="space-y-4">
          <button
            onClick={handleSearch}
            disabled={searchState.isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {searchState.isSearching ? 'Searching...' : 'Search for Artist'}
          </button>
          
          <div className="text-sm text-gray-600">
            <p>Artists found: {searchState.searchResults.artists.length}</p>
            <p>Albums found: {searchState.searchResults.albums.length}</p>
            <p>Selected artist: {searchState.selectedArtist?.name || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Artist Selection */}
      {searchState.searchResults.artists.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Artist Selection</h2>
          <button
            onClick={handleSelectArtist}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Select Artist & Load Albums
          </button>
        </div>
      )}

      {/* Album Selection */}
      {searchState.albums.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Album Selection</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Selected: {selectionState.selectedAlbums.size} / {searchState.albums.length}
              </span>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                {selectionState.selectAllState === 'all' ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchState.albums.map((album) => (
                <div
                  key={album.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectionState.selectedAlbums.has(album.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggleAlbum(album.id)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectionState.selectedAlbums.has(album.id)}
                      onChange={() => handleToggleAlbum(album.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <h3 className="font-medium">{album.title}</h3>
                      <p className="text-sm text-gray-500">{album.artist}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Section */}
      {selectionState.selectedAlbums.size > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Download Management</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Download Selected Albums
            </button>

            <div className="text-sm text-gray-600">
              <p>Active downloads: {downloadState.activeDownloads}</p>
              <p>Completed downloads: {downloadState.completedDownloads}</p>
              <p>Failed downloads: {downloadState.failedDownloads}</p>
            </div>

            {/* Download Progress */}
            {downloadState.downloads.size > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Download Progress:</h3>
                {Array.from(downloadState.downloads.values()).map((download) => (
                  <div key={download.id} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{download.albumTitle}</span>
                      <span className="text-sm text-gray-500">{download.status}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {download.progress}% complete
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Testing */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Notification System</h2>
        <div className="space-x-2">
          <button
            onClick={() => actions.showSuccessNotification('Success!', 'This is a success message')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Success
          </button>
          <button
            onClick={handleError}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Error
          </button>
          <button
            onClick={() => actions.showWarningNotification('Warning!', 'This is a warning message')}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Warning
          </button>
          <button
            onClick={() => actions.showInfoNotification('Info', 'This is an info message')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Info
          </button>
          <button
            onClick={() => actions.clearNotifications()}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Example Component with Provider
// ============================================================================

export default function AppContextExample() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100">
        <AppStateDemo />
        <NotificationSystem position="top-right" />
      </div>
    </AppProvider>
  );
}
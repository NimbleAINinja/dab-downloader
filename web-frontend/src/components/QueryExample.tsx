// Example component demonstrating React Query hooks usage
// This component shows how to use the custom hooks for search, albums, and downloads

import { useState } from 'react';
import type { Album } from '../types';
import { 
  useSearchArtists, 
  useArtistAlbums, 
  useAlbumSelection,
  useBatchDownload,
  useDownloadsList 
} from '../hooks';

/**
 * Example component showcasing React Query integration
 * Demonstrates search, album fetching, selection, and download functionality
 */
export function QueryExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');

  // Search functionality
  const { 
    data: artists = [], 
    isLoading: isSearching, 
    error: searchError 
  } = useSearchArtists(searchQuery, {
    enabled: searchQuery.length >= 2,
  });

  // Album fetching
  const { 
    data: albums = [], 
    isLoading: isLoadingAlbums, 
    error: albumsError 
  } = useArtistAlbums(selectedArtistId, {
    enabled: !!selectedArtistId,
  }) as { data: Album[]; isLoading: boolean; error: any };

  // Album selection management
  const {
    selectedAlbums,
    selectedCount,
    toggleAlbumSelection,
    selectAllAlbums,
    clearSelection,
    getSelectionState,
  } = useAlbumSelection();

  // Download functionality
  const { downloadSelectedAlbums, isLoading: isDownloading } = useBatchDownload();
  const { downloads } = useDownloadsList();

  // Get selection state for UI feedback
  const selectionState = getSelectionState(albums.map(album => album.id));

  const handleDownload = async () => {
    const selectedAlbumsData = albums.filter(album => selectedAlbums.has(album.id));
    
    if (selectedAlbumsData.length === 0) {
      alert('Please select at least one album to download');
      return;
    }

    try {
      await downloadSelectedAlbums(selectedAlbumsData);
      alert(`Started downloading ${selectedAlbumsData.length} albums`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to start download');
    }
  };

  const handleSelectAll = () => {
    if (selectionState === 'all') {
      clearSelection();
    } else {
      selectAllAlbums(albums.map(album => album.id));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">React Query Integration Example</h1>
      
      {/* Search Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Artists</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for artists..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {isSearching && (
          <p className="mt-2 text-gray-600">Searching...</p>
        )}
        
        {searchError && (
          <p className="mt-2 text-red-600">
            Search error: {searchError instanceof Error ? searchError.message : 'Unknown error'}
          </p>
        )}
        
        {artists.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Search Results:</h3>
            <div className="space-y-2">
              {artists.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => setSelectedArtistId(String(artist.id))}
                  className={`block w-full text-left p-3 rounded-lg border transition-colors ${
                    String(artist.id) === selectedArtistId
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{artist.name}</div>
                  {artist.picture && (
                    <img 
                      src={artist.picture} 
                      alt={artist.name}
                      className="w-12 h-12 rounded-full mt-2"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Albums Section */}
      {selectedArtistId && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Albums</h2>
          
          {isLoadingAlbums && (
            <p className="text-gray-600">Loading albums...</p>
          )}
          
          {albumsError && (
            <p className="text-red-600">
              Albums error: {albumsError instanceof Error ? albumsError.message : 'Unknown error'}
            </p>
          )}
          
          {albums.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">
                  {albums.length} albums found, {selectedCount} selected
                </p>
                <div className="space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {selectionState === 'all' ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={selectedCount === 0 || isDownloading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDownloading ? 'Starting Download...' : `Download Selected (${selectedCount})`}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedAlbums.has(album.id)
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedAlbums.has(album.id)}
                        onChange={() => toggleAlbumSelection(album.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        {album.cover && (
                          <img
                            src={album.cover}
                            alt={album.title}
                            className="w-16 h-16 rounded-lg object-cover mb-2"
                          />
                        )}
                        <h3 className="font-medium text-gray-900">{album.title}</h3>
                        <p className="text-sm text-gray-600">{album.artist}</p>
                        <p className="text-xs text-gray-500">
                          {album.totalTracks || album.tracks?.length || 0} tracks
                        </p>
                        {album.releaseDate && (
                          <p className="text-xs text-gray-500">
                            {new Date(album.releaseDate).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Downloads Section */}
      {downloads.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Downloads</h2>
          <div className="space-y-3">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{download.albumTitle}</h3>
                    <p className="text-sm text-gray-600">{download.artistName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      download.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : download.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : download.status === 'downloading'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {download.status}
                  </span>
                </div>
                
                {download.status === 'downloading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${download.progress}%` }}
                    />
                  </div>
                )}
                
                {download.progress > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {download.progress}% complete
                    {download.completedTracks && download.totalTracks && (
                      <span className="ml-2">
                        ({download.completedTracks}/{download.totalTracks} tracks)
                      </span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default QueryExample;
import React, { useState, useCallback } from 'react';
import { AlbumGrid } from './AlbumGrid';
import type { Album } from '../types';

// Mock album data for demonstration
const mockAlbums: Album[] = [
  {
    id: '1',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    cover: 'https://via.placeholder.com/300x300/1f2937/ffffff?text=DSOTM',
    releaseDate: '1973-03-01',
    tracks: [],
    year: '1973',
    totalTracks: 10,
    genre: 'Progressive Rock',
  },
  {
    id: '2',
    title: 'Abbey Road',
    artist: 'The Beatles',
    cover: 'https://via.placeholder.com/300x300/dc2626/ffffff?text=Abbey+Road',
    releaseDate: '1969-09-26',
    tracks: [],
    year: '1969',
    totalTracks: 17,
    genre: 'Rock',
  },
  {
    id: '3',
    title: 'Thriller',
    artist: 'Michael Jackson',
    cover: 'https://via.placeholder.com/300x300/7c3aed/ffffff?text=Thriller',
    releaseDate: '1982-11-30',
    tracks: [],
    year: '1982',
    totalTracks: 9,
    genre: 'Pop',
  },
  {
    id: '4',
    title: 'Back in Black',
    artist: 'AC/DC',
    cover: 'https://via.placeholder.com/300x300/000000/ffffff?text=Back+in+Black',
    releaseDate: '1980-07-25',
    tracks: [],
    year: '1980',
    totalTracks: 10,
    genre: 'Hard Rock',
  },
  {
    id: '5',
    title: 'The Wall',
    artist: 'Pink Floyd',
    cover: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=The+Wall',
    releaseDate: '1979-11-30',
    tracks: [],
    year: '1979',
    totalTracks: 26,
    genre: 'Progressive Rock',
  },
  {
    id: '6',
    title: 'Led Zeppelin IV',
    artist: 'Led Zeppelin',
    cover: 'https://via.placeholder.com/300x300/92400e/ffffff?text=LZ+IV',
    releaseDate: '1971-11-08',
    tracks: [],
    year: '1971',
    totalTracks: 8,
    genre: 'Hard Rock',
  },
];

export const AlbumGridExample: React.FC = () => {
  const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>(mockAlbums);
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Handle individual album selection
  const handleAlbumSelect = useCallback((albumId: string, selected: boolean) => {
    setSelectedAlbums(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(albumId);
      } else {
        newSet.delete(albumId);
      }
      return newSet;
    });
  }, []);

  // Handle select all/deselect all
  const handleSelectAll = useCallback(() => {
    if (selectedAlbums.size === albums.length) {
      // All selected, deselect all
      setSelectedAlbums(new Set());
    } else {
      // Not all selected, select all
      setSelectedAlbums(new Set(albums.map(album => album.id)));
    }
  }, [selectedAlbums.size, albums]);

  // Simulate loading state
  const handleSimulateLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  // Simulate error state
  const handleSimulateError = useCallback(() => {
    setError('Failed to load albums. Please check your connection and try again.');
    setAlbums([]);
  }, []);

  // Simulate empty state
  const handleSimulateEmpty = useCallback(() => {
    setError(null);
    setAlbums([]);
  }, []);

  // Reset to normal state
  const handleReset = useCallback(() => {
    setError(null);
    setAlbums(mockAlbums);
    setSelectedAlbums(new Set());
    setIsLoading(false);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AlbumGrid Component Example</h1>
        <p className="text-gray-600 mb-6">
          This example demonstrates the AlbumGrid component with various states and interactions.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <label htmlFor="grid-size" className="text-sm font-medium text-gray-700">
              Grid Size:
            </label>
            <select
              id="grid-size"
              value={gridSize}
              onChange={(e) => setGridSize(e.target.value as 'small' | 'medium' | 'large')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSimulateLoading}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              Simulate Loading
            </button>
            <button
              onClick={handleSimulateError}
              className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
            >
              Simulate Error
            </button>
            <button
              onClick={handleSimulateEmpty}
              className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
            >
              Simulate Empty
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Selection Info */}
        {selectedAlbums.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>{selectedAlbums.size}</strong> album{selectedAlbums.size !== 1 ? 's' : ''} selected:
              {' '}
              {Array.from(selectedAlbums)
                .map(id => albums.find(album => album.id === id)?.title)
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* AlbumGrid Component */}
      <AlbumGrid
        albums={albums}
        selectedAlbums={selectedAlbums}
        onAlbumSelect={handleAlbumSelect}
        onSelectAll={handleSelectAll}
        isLoading={isLoading}
        error={error}
        gridSize={gridSize}
        showSelectAll={true}
        emptyMessage="No albums to display. Try resetting or searching for music."
      />

      {/* Usage Code Example */}
      <div className="mt-12 p-6 bg-gray-900 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">Usage Example</h2>
        <pre className="text-green-400 text-sm overflow-x-auto">
{`import { AlbumGrid } from './components/AlbumGrid';

const MyComponent = () => {
  const [selectedAlbums, setSelectedAlbums] = useState(new Set());
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAlbumSelect = (albumId, selected) => {
    setSelectedAlbums(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(albumId);
      } else {
        newSet.delete(albumId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAlbums.size === albums.length) {
      setSelectedAlbums(new Set());
    } else {
      setSelectedAlbums(new Set(albums.map(album => album.id)));
    }
  };

  return (
    <AlbumGrid
      albums={albums}
      selectedAlbums={selectedAlbums}
      onAlbumSelect={handleAlbumSelect}
      onSelectAll={handleSelectAll}
      isLoading={isLoading}
      gridSize="medium"
    />
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default AlbumGridExample;
import React, { useState } from 'react';
import AlbumCard from './AlbumCard';
import type { Album } from '../types';

// Example album data
const exampleAlbums: Album[] = [
  {
    id: '1',
    title: 'Abbey Road',
    artist: 'The Beatles',
    cover: 'https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg',
    releaseDate: '1969-09-26',
    tracks: [],
    totalTracks: 17,
    year: '1969',
    genre: 'Rock',
  },
  {
    id: '2',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    cover: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
    releaseDate: '1973-03-01',
    tracks: [],
    totalTracks: 10,
    year: '1973',
    genre: 'Progressive Rock',
  },
  {
    id: '3',
    title: 'Thriller',
    artist: 'Michael Jackson',
    cover: 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
    releaseDate: '1982-11-30',
    tracks: [],
    totalTracks: 9,
    year: '1982',
    genre: 'Pop',
  },
  {
    id: '4',
    title: 'Back in Black',
    artist: 'AC/DC',
    cover: '', // Test placeholder
    releaseDate: '1980-07-25',
    tracks: [],
    totalTracks: 10,
    year: '1980',
    genre: 'Hard Rock',
  },
];

export const AlbumCardExample: React.FC = () => {
  const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set());

  const handleAlbumSelect = (albumId: string, selected: boolean) => {
    const newSelection = new Set(selectedAlbums);
    if (selected) {
      newSelection.add(albumId);
    } else {
      newSelection.delete(albumId);
    }
    setSelectedAlbums(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedAlbums.size === exampleAlbums.length) {
      setSelectedAlbums(new Set());
    } else {
      setSelectedAlbums(new Set(exampleAlbums.map(album => album.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedAlbums(new Set());
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AlbumCard Component Example</h1>
        <p className="text-gray-600 mb-8">
          Interactive album cards with selection, lazy loading, and accessibility features.
        </p>

        {/* Controls */}
        <div className="mb-8 flex flex-wrap gap-4 items-center">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {selectedAlbums.size === exampleAlbums.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleClearSelection}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={selectedAlbums.size === 0}
          >
            Clear Selection
          </button>
          <span className="text-gray-600">
            {selectedAlbums.size} of {exampleAlbums.length} albums selected
          </span>
        </div>

        {/* Size Examples */}
        <div className="space-y-12">
          {/* Small Size */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Small Size</h2>
            <div className="flex flex-wrap gap-4">
              {exampleAlbums.slice(0, 2).map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isSelected={selectedAlbums.has(album.id)}
                  onSelect={handleAlbumSelect}
                  size="small"
                />
              ))}
            </div>
          </section>

          {/* Medium Size (Default) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Medium Size (Default)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {exampleAlbums.map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isSelected={selectedAlbums.has(album.id)}
                  onSelect={handleAlbumSelect}
                  size="medium"
                />
              ))}
            </div>
          </section>

          {/* Large Size */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Large Size</h2>
            <div className="flex flex-wrap gap-6">
              {exampleAlbums.slice(0, 2).map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isSelected={selectedAlbums.has(album.id)}
                  onSelect={handleAlbumSelect}
                  size="large"
                />
              ))}
            </div>
          </section>

          {/* Without Artist */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Without Artist Name</h2>
            <div className="flex flex-wrap gap-6">
              {exampleAlbums.slice(0, 2).map((album) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  isSelected={selectedAlbums.has(album.id)}
                  onSelect={handleAlbumSelect}
                  showArtist={false}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Instructions</h3>
          <ul className="space-y-2 text-gray-600">
            <li>• Click on any album card to select/deselect it</li>
            <li>• Use keyboard navigation: Tab to focus, Enter/Space to select</li>
            <li>• Album artwork loads lazily with placeholder fallbacks</li>
            <li>• Supports three sizes: small, medium (default), and large</li>
            <li>• Artist name can be hidden with showArtist=false</li>
            <li>• Fully accessible with ARIA labels and keyboard support</li>
          </ul>
        </div>

        {/* Selected Albums Display */}
        {selectedAlbums.size > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Selected Albums</h3>
            <div className="space-y-2">
              {Array.from(selectedAlbums).map((albumId) => {
                const album = exampleAlbums.find(a => a.id === albumId);
                return album ? (
                  <div key={albumId} className="text-blue-800">
                    {album.title} by {album.artist} ({album.year})
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlbumCardExample;
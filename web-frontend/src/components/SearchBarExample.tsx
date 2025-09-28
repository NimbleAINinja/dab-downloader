import React, { useState } from 'react';
import SearchBar from './SearchBar';
import type { Artist } from '../types';

/**
 * Example component demonstrating SearchBar usage
 * This shows how to integrate the SearchBar with search results display
 */
export const SearchBarExample: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');

  const handleSearch = (query: string) => {
    setCurrentQuery(query);
    console.log('Searching for:', query);
  };

  const handleResults = (results: Artist[]) => {
    setSearchResults(results);
    console.log('Search results:', results);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        DAB Music Search
      </h1>
      
      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          onResults={handleResults}
          placeholder="Search for your favorite artists..."
          autoFocus
        />
      </div>

      {/* Current Query Display */}
      {currentQuery && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Searching for: <span className="font-medium">{currentQuery}</span>
          </p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Search Results ({searchResults.length})
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((artist) => (
              <div
                key={artist.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                {artist.picture && (
                  <img
                    src={artist.picture}
                    alt={`${artist.name} profile`}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                  />
                )}
                <h3 className="text-lg font-medium text-gray-900 text-center">
                  {artist.name}
                </h3>
                {artist.albums && artist.albums.length > 0 && (
                  <p className="text-sm text-gray-500 text-center mt-1">
                    {artist.albums.length} albums
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {currentQuery && searchResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No artists found for "{currentQuery}". Try a different search term.
          </p>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          SearchBar Features
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• <strong>Debounced Search:</strong> Automatically searches 300ms after you stop typing</li>
          <li>• <strong>Keyboard Shortcuts:</strong> Press Enter to search immediately, Escape to clear</li>
          <li>• <strong>Search History:</strong> Click the search box to see your recent searches</li>
          <li>• <strong>Loading States:</strong> Visual feedback while searching</li>
          <li>• <strong>Error Handling:</strong> Clear error messages when searches fail</li>
          <li>• <strong>Accessibility:</strong> Full keyboard navigation and screen reader support</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchBarExample;
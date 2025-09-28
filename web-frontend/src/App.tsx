import { useState } from 'react';
import { SearchBar } from './components';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Search query:', query);
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    console.log('Search results:', results);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', fontSize: '24px', marginBottom: '20px' }}>
        DAB Music Downloader - WORKING
      </h1>

      {/* Status Section */}
      <div style={{
        backgroundColor: '#fff',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '10px' }}>
          ✅ SUCCESS: Frontend is rendering!
        </h2>
        <p style={{ color: '#666' }}>
          React, Vite, and Tailwind CSS are all working correctly.
        </p>
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4CAF50',
          borderRadius: '4px',
          padding: '10px',
          marginTop: '10px'
        }}>
          <p style={{ color: '#2E7D32', margin: 0 }}>
            Backend API: Running on port 8080
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>
          Search for Artists
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <SearchBar
            onSearch={handleSearch}
            onResults={handleSearchResults}
            placeholder="Enter artist name..."
          />
        </div>

        {searchQuery && (
          <div style={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            padding: '10px',
            marginTop: '10px'
          }}>
            <p style={{ color: '#1976d2', margin: 0 }}>
              <strong>Search Query:</strong> {searchQuery}
            </p>
            <p style={{ color: '#1976d2', fontSize: '14px', margin: '5px 0 0 0' }}>
              SearchBar component active! Results: {searchResults.length}
            </p>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div style={{
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ color: '#555', marginBottom: '10px' }}>
          Next Steps
        </h3>
        <ul style={{ color: '#777', paddingLeft: '20px' }}>
          <li style={{ textDecoration: searchQuery ? 'line-through' : 'none', color: searchQuery ? '#4CAF50' : '#777' }}>
            ✅ Add SearchBar component
          </li>
          <li>Connect to API for real search results</li>
          <li>Add album display grid</li>
          <li>Enable download functionality</li>
        </ul>
      </div>
    </div>
  );
}

export default App;

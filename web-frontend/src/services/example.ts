// Example usage of the DAB API Client
// This file demonstrates how to use the DabApiClient service

import { getDabApiClient, DabApiError } from './DabApiClient';

/**
 * Example: Search for artists and get their albums
 */
export async function searchAndGetAlbumsExample() {
  const client = getDabApiClient();

  try {
    // Test connection first
    console.log('Testing API connection...');
    const isConnected = await client.testConnection();
    
    if (!isConnected) {
      console.error('Failed to connect to DAB API');
      return;
    }

    console.log('✓ Connected to DAB API');

    // Search for artists
    console.log('Searching for "Arctic Monkeys"...');
    const artists = await client.searchArtists('Arctic Monkeys', { limit: 5 });
    
    console.log(`Found ${artists.length} artists:`);
    artists.forEach((artist, index) => {
      console.log(`  ${index + 1}. ${artist.name} (ID: ${artist.id})`);
    });

    if (artists.length > 0) {
      // Get albums for the first artist
      const firstArtist = artists[0];
      console.log(`\nGetting albums for "${firstArtist.name}"...`);
      
      const albums = await client.getArtistAlbums(String(firstArtist.id), { limit: 10 });
      
      console.log(`Found ${albums.length} albums:`);
      albums.forEach((album, index) => {
        console.log(`  ${index + 1}. ${album.title} (${album.totalTracks || album.tracks?.length || 0} tracks)`);
      });
    }

  } catch (error) {
    if (error instanceof DabApiError) {
      console.error('DAB API Error:', error.getUserFriendlyMessage());
      console.error('Error type:', error.getType());
      console.error('Is retryable:', error.isRetryable());
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Example: Error handling with retry logic
 */
export async function errorHandlingExample() {
  const client = getDabApiClient();

  try {
    // This will likely fail if the API is not running
    const artists = await client.searchArtists('Test Artist');
    console.log('Search successful:', artists);
    
  } catch (error) {
    if (error instanceof DabApiError) {
      console.log('Caught DAB API Error:');
      console.log('- Message:', error.message);
      console.log('- User-friendly message:', error.getUserFriendlyMessage());
      console.log('- Type:', error.getType());
      console.log('- Code:', error.getCode());
      console.log('- Retryable:', error.isRetryable());
      console.log('- Timestamp:', error.errorState.timestamp);
      
      if (error.errorState.details) {
        console.log('- Details:', error.errorState.details);
      }
      
      if (error.errorState.context) {
        console.log('- Context:', error.errorState.context);
      }
    }
  }
}

/**
 * Example: Custom client configuration
 */
export function customConfigExample() {
  // Create a client with custom configuration
  const customClient = new (require('./DabApiClient').DabApiClient)({
    baseURL: 'http://localhost:3000', // Custom API URL
    timeout: 10000, // 10 second timeout
    maxRetries: 5, // More retries
    retryDelay: 2000, // 2 second base delay
    userAgent: 'MyCustomApp/1.0'
  });

  console.log('Custom client configuration:', customClient.getConfig());
  
  // Update base URL dynamically
  customClient.updateBaseURL('http://api.example.com');
  console.log('Updated base URL:', customClient.getConfig().baseURL);
  
  return customClient;
}

// Uncomment to run examples (for development/testing)
// searchAndGetAlbumsExample();
// errorHandlingExample();
// customConfigExample();
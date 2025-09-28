// React Query configuration and setup
// Provides centralized query client configuration with caching and retry strategies

import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';

/**
 * Default options for React Query
 * Configured for optimal caching and retry behavior
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes before considering it stale
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Keep data in cache for 10 minutes after component unmounts
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Retry failed requests up to 3 times
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    
    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Don't refetch on window focus by default (can be overridden per query)
    refetchOnWindowFocus: false,
    
    // Don't refetch on reconnect by default (can be overridden per query)
    refetchOnReconnect: true,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    
    // Exponential backoff for mutation retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },
};

/**
 * Create and configure the React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions,
});

/**
 * Query keys for consistent cache management
 * Using hierarchical structure for easy invalidation
 */
export const queryKeys = {
  // Search-related queries
  search: {
    all: ['search'] as const,
    artists: (query: string) => ['search', 'artists', query] as const,
    albums: (query: string) => ['search', 'albums', query] as const,
    tracks: (query: string) => ['search', 'tracks', query] as const,
  },
  
  // Artist-related queries
  artists: {
    all: ['artists'] as const,
    detail: (id: string) => ['artists', 'detail', id] as const,
    albums: (id: string) => ['artists', 'albums', id] as const,
  },
  
  // Album-related queries
  albums: {
    all: ['albums'] as const,
    detail: (id: string) => ['albums', 'detail', id] as const,
    tracks: (id: string) => ['albums', 'tracks', id] as const,
  },
  
  // Download-related queries
  downloads: {
    all: ['downloads'] as const,
    status: (id: string) => ['downloads', 'status', id] as const,
    list: () => ['downloads', 'list'] as const,
  },
  
  // Health check
  health: ['health'] as const,
} as const;

/**
 * Utility function to invalidate related queries
 */
export const invalidateQueries = {
  /**
   * Invalidate all search queries
   */
  search: () => queryClient.invalidateQueries({ queryKey: queryKeys.search.all }),
  
  /**
   * Invalidate artist-related queries
   */
  artist: (artistId?: string) => {
    if (artistId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.detail(artistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.albums(artistId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.artists.all });
    }
  },
  
  /**
   * Invalidate album-related queries
   */
  album: (albumId?: string) => {
    if (albumId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums.detail(albumId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.albums.tracks(albumId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums.all });
    }
  },
  
  /**
   * Invalidate download-related queries
   */
  downloads: (downloadId?: string) => {
    if (downloadId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.downloads.status(downloadId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.downloads.all });
    }
  },
  
  /**
   * Invalidate all queries (nuclear option)
   */
  all: () => queryClient.invalidateQueries(),
};

/**
 * Utility function to prefetch queries
 */
export const prefetchQueries = {
  /**
   * Prefetch artist albums when hovering over artist
   */
  artistAlbums: (artistId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.artists.albums(artistId),
      queryFn: async () => {
        const { getDabApiClient } = await import('./DabApiClient');
        const client = getDabApiClient();
        return client.getArtistAlbums(artistId);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },
  
  /**
   * Prefetch artist details
   */
  artistDetail: (artistId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.artists.detail(artistId),
      queryFn: async () => {
        const { getDabApiClient } = await import('./DabApiClient');
        const client = getDabApiClient();
        return client.getArtist(artistId);
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },
};

/**
 * Error handling utilities for React Query
 */
export const queryErrorHandlers = {
  /**
   * Default error handler for queries
   */
  onError: (error: any) => {
    console.error('[React Query] Query error:', error);
    
    // You can add global error handling here
    // For example, showing toast notifications or logging to external service
  },
  
  /**
   * Default error handler for mutations
   */
  onMutationError: (error: any) => {
    console.error('[React Query] Mutation error:', error);
    
    // You can add global mutation error handling here
  },
};

/**
 * Development tools configuration
 * DevTools are imported in main.tsx where they're actually used
 */

export default queryClient;
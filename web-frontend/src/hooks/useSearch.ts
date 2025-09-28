// Custom React Query hooks for search functionality
// Provides search capabilities with caching, debouncing, and error handling

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { getDabApiClient } from '../services/DabApiClient';
import { queryKeys } from '../services/queryClient';
import type { Artist, SearchResults } from '../types';

/**
 * Hook for searching artists with debouncing and caching
 * @param query - Search query string
 * @param options - Additional query options
 */
export function useSearchArtists(
  query: string,
  options: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes for search results
    refetchOnWindowFocus = false,
  } = options;

  // Only search if query is not empty and has at least 2 characters
  const shouldSearch = enabled && query.trim().length >= 2;

  return useQuery({
    queryKey: queryKeys.search.artists(query.trim()),
    queryFn: async (): Promise<Artist[]> => {
      const client = getDabApiClient();
      return client.searchArtists(query.trim());
    },
    enabled: shouldSearch,
    staleTime,
    refetchOnWindowFocus,
    // Keep previous data while fetching new results for better UX
    placeholderData: (previousData) => previousData,
    // Retry less aggressively for search queries
    retry: 1,
    retryDelay: 1000,
  });
}

/**
 * Hook for getting search suggestions based on partial query
 * Uses a shorter stale time for more responsive suggestions
 */
export function useSearchSuggestions(
  query: string,
  options: {
    enabled?: boolean;
    limit?: number;
  } = {}
) {
  const {
    enabled = true,
    limit = 5,
  } = options;

  // Only get suggestions for queries with at least 1 character
  const shouldGetSuggestions = enabled && query.trim().length >= 1;

  return useQuery({
    queryKey: [...queryKeys.search.artists(query.trim()), 'suggestions', limit],
    queryFn: async (): Promise<Artist[]> => {
      const client = getDabApiClient();
      const results = await client.searchArtists(query.trim(), { limit });
      return results.slice(0, limit);
    },
    enabled: shouldGetSuggestions,
    staleTime: 30 * 1000, // 30 seconds for suggestions
    refetchOnWindowFocus: false,
    // Keep previous data for smooth transitions
    placeholderData: (previousData) => previousData,
    // Don't retry suggestions as aggressively
    retry: false,
  });
}

/**
 * Hook for comprehensive search across all content types
 * @param query - Search query string
 * @param searchType - Type of content to search for
 */
export function useSearch(
  query: string,
  searchType: 'artist' | 'album' | 'track' | 'all' = 'artist',
  options: {
    enabled?: boolean;
    limit?: number;
  } = {}
) {
  const {
    enabled = true,
    limit = 20,
  } = options;

  const shouldSearch = enabled && query.trim().length >= 2;

  return useQuery({
    queryKey: [
      ...queryKeys.search.all,
      searchType,
      query.trim(),
      limit,
    ],
    queryFn: async (): Promise<SearchResults> => {
      const client = getDabApiClient();
      
      // For now, we only support artist search based on the API client
      // This can be extended when other search types are implemented
      if (searchType === 'artist' || searchType === 'all') {
        const artists = await client.searchArtists(query.trim(), { limit });
        return {
          artists,
          albums: [],
          tracks: [],
        };
      }
      
      // Return empty results for unsupported search types
      return {
        artists: [],
        albums: [],
        tracks: [],
      };
    },
    enabled: shouldSearch,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    retry: 1,
  });
}

/**
 * Hook for managing search history and recent searches
 * Uses local storage to persist search history
 */
export function useSearchHistory(maxItems: number = 10) {
  const queryClient = useQueryClient();
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dab-search-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    try {
      setSearchHistory(currentHistory => {
        const updated = [
          query.trim(),
          ...currentHistory.filter((item: string) => item !== query.trim()),
        ].slice(0, maxItems);

        localStorage.setItem('dab-search-history', JSON.stringify(updated));
        return updated;
      });
      
      // Invalidate any queries that might depend on search history
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem('dab-search-history');
      setSearchHistory([]);
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  };

  const removeFromHistory = (query: string) => {
    try {
      setSearchHistory(currentHistory => {
        const updated = currentHistory.filter((item: string) => item !== query);
        localStorage.setItem('dab-search-history', JSON.stringify(updated));
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    } catch (error) {
      console.warn('Failed to remove from search history:', error);
    }
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
}

/**
 * Hook for prefetching artist albums when user hovers over search results
 * Improves perceived performance by preloading likely next requests
 */
export function usePrefetchArtistAlbums() {
  const queryClient = useQueryClient();

  const prefetchArtistAlbums = async (artistId: string) => {
    // Only prefetch if we don't already have fresh data
    const existingData = queryClient.getQueryData(queryKeys.artists.albums(artistId));
    if (existingData) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.artists.albums(artistId),
        queryFn: async () => {
          const client = getDabApiClient();
          return client.getArtistAlbums(artistId);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    } catch (error) {
      // Silently fail prefetch attempts
      console.debug('Failed to prefetch artist albums:', error);
    }
  };

  return { prefetchArtistAlbums };
}

/**
 * Hook for getting cached search results without triggering new requests
 * Useful for displaying recent results or suggestions
 */
export function useCachedSearchResults(query: string) {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!query.trim()) return null;

    const cachedData = queryClient.getQueryData(
      queryKeys.search.artists(query.trim())
    );

    return cachedData as Artist[] | undefined;
  }, [query, queryClient]);
}
// Custom React Query hooks for album functionality
// Provides album fetching, caching, and management capabilities

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDabApiClient } from '../services/DabApiClient';
import { queryKeys } from '../services/queryClient';
import type { Album, Artist } from '../types';

/**
 * Hook for fetching albums for a specific artist
 * @param artistId - The artist ID to fetch albums for
 * @param options - Additional query options
 */
export function useArtistAlbums(
  artistId: string,
  options: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = false,
  } = options;

  const shouldFetch = Boolean(enabled && artistId && artistId.trim().length > 0);

  return useQuery({
    queryKey: queryKeys.artists.albums(artistId),
    queryFn: async (): Promise<Album[]> => {
      const client = getDabApiClient();
      return client.getArtistAlbums(artistId);
    },
    enabled: shouldFetch,
    staleTime,
    refetchOnWindowFocus,
    // Keep previous data while loading new artist's albums
    placeholderData: (previousData: Album[] | undefined) => previousData,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook for fetching detailed information about a specific artist
 * @param artistId - The artist ID to fetch details for
 */
export function useArtistDetail(
  artistId: string,
  options: {
    enabled?: boolean;
    includeAlbums?: boolean;
  } = {}
) {
  const {
    enabled = true,
    includeAlbums = false,
  } = options;

  const shouldFetch = Boolean(enabled && artistId && artistId.trim().length > 0);

  return useQuery({
    queryKey: queryKeys.artists.detail(artistId),
    queryFn: async (): Promise<Artist> => {
      const client = getDabApiClient();
      return client.getArtist(artistId, { includeAlbums });
    },
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000, // 10 minutes - artist details change less frequently
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook for managing album selection state with optimistic updates
 * Provides utilities for selecting/deselecting albums and bulk operations
 */
export function useAlbumSelection(initialSelection: Set<string> = new Set()) {
  const queryClient = useQueryClient();

  // Use a query to manage selection state so it can be shared across components
  const selectionQuery = useQuery({
    queryKey: ['album-selection'],
    queryFn: () => initialSelection,
    staleTime: Infinity, // Never consider stale
    gcTime: Infinity, // Never garbage collect
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const selectedAlbums = selectionQuery.data || new Set<string>();

  const toggleAlbumSelection = (albumId: string) => {
    const newSelection = new Set(selectedAlbums);
    
    if (newSelection.has(albumId)) {
      newSelection.delete(albumId);
    } else {
      newSelection.add(albumId);
    }

    // Optimistically update the selection
    queryClient.setQueryData(['album-selection'], newSelection);
  };

  const selectAlbum = (albumId: string) => {
    const newSelection = new Set(selectedAlbums);
    newSelection.add(albumId);
    queryClient.setQueryData(['album-selection'], newSelection);
  };

  const deselectAlbum = (albumId: string) => {
    const newSelection = new Set(selectedAlbums);
    newSelection.delete(albumId);
    queryClient.setQueryData(['album-selection'], newSelection);
  };

  const selectAllAlbums = (albumIds: string[]) => {
    const newSelection = new Set([...selectedAlbums, ...albumIds]);
    queryClient.setQueryData(['album-selection'], newSelection);
  };

  const deselectAllAlbums = (albumIds?: string[]) => {
    if (albumIds) {
      const newSelection = new Set(selectedAlbums);
      albumIds.forEach(id => newSelection.delete(id));
      queryClient.setQueryData(['album-selection'], newSelection);
    } else {
      queryClient.setQueryData(['album-selection'], new Set<string>());
    }
  };

  const clearSelection = () => {
    queryClient.setQueryData(['album-selection'], new Set<string>());
  };

  const isAlbumSelected = (albumId: string) => {
    return selectedAlbums.has(albumId);
  };

  const getSelectionState = (availableAlbumIds: string[]) => {
    const selectedCount = availableAlbumIds.filter(id => selectedAlbums.has(id)).length;
    const totalCount = availableAlbumIds.length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === totalCount) return 'all';
    return 'some';
  };

  return {
    selectedAlbums,
    selectedCount: selectedAlbums.size,
    toggleAlbumSelection,
    selectAlbum,
    deselectAlbum,
    selectAllAlbums,
    deselectAllAlbums,
    clearSelection,
    isAlbumSelected,
    getSelectionState,
    isLoading: selectionQuery.isLoading,
  };
}

/**
 * Hook for getting selected albums with their full data
 * Combines selection state with album data from cache
 */
export function useSelectedAlbumsData(artistId?: string) {
  const queryClient = useQueryClient();
  const { selectedAlbums } = useAlbumSelection();

  return useMemo(() => {
    if (!artistId || selectedAlbums.size === 0) {
      return [];
    }

    // Get cached album data
    const cachedAlbums = queryClient.getQueryData(
      queryKeys.artists.albums(artistId)
    ) as Album[] | undefined;

    if (!cachedAlbums) {
      return [];
    }

    // Filter to only selected albums
    return cachedAlbums.filter(album => selectedAlbums.has(album.id));
  }, [selectedAlbums, artistId, queryClient]);
}

/**
 * Hook for prefetching album details when user hovers over album cards
 * Improves perceived performance for album interactions
 */
export function usePrefetchAlbumDetails() {
  const queryClient = useQueryClient();

  const prefetchAlbumDetails = async (albumId: string) => {
    // Check if we already have fresh data
    const existingData = queryClient.getQueryData(queryKeys.albums.detail(albumId));
    if (existingData) return;

    try {
      // Note: This would require an API endpoint for individual album details
      // For now, we'll skip this since the current API doesn't have this endpoint
      console.debug('Album detail prefetch not implemented - API endpoint needed');
    } catch (error) {
      console.debug('Failed to prefetch album details:', error);
    }
  };

  return { prefetchAlbumDetails };
}

/**
 * Hook for filtering and sorting albums
 * Provides client-side filtering and sorting capabilities
 */
export function useAlbumFilters(albums: Album[] = []) {
  const filterAlbums = useMemo(() => {
    return {
      byType: (type: string) => albums.filter(album => album.type === type),
      byYear: (year: string) => albums.filter(album => album.year === year),
      byGenre: (genre: string) => albums.filter(album => album.genre === genre),
      search: (query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return albums.filter(album => 
          album.title.toLowerCase().includes(lowercaseQuery) ||
          album.artist.toLowerCase().includes(lowercaseQuery)
        );
      },
    };
  }, [albums]);

  const sortAlbums = useMemo(() => {
    return {
      byTitle: (ascending = true) => 
        [...albums].sort((a, b) => 
          ascending 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title)
        ),
      byReleaseDate: (ascending = false) => 
        [...albums].sort((a, b) => {
          const dateA = new Date(a.releaseDate).getTime();
          const dateB = new Date(b.releaseDate).getTime();
          return ascending ? dateA - dateB : dateB - dateA;
        }),
      byTrackCount: (ascending = false) =>
        [...albums].sort((a, b) => 
          ascending 
            ? (a.totalTracks || 0) - (b.totalTracks || 0)
            : (b.totalTracks || 0) - (a.totalTracks || 0)
        ),
    };
  }, [albums]);

  const getUniqueValues = useMemo(() => {
    return {
      types: [...new Set(albums.map(album => album.type).filter(Boolean))],
      years: [...new Set(albums.map(album => album.year).filter(Boolean))].sort(),
      genres: [...new Set(albums.map(album => album.genre).filter(Boolean))].sort(),
    };
  }, [albums]);

  return {
    filterAlbums,
    sortAlbums,
    getUniqueValues,
  };
}

/**
 * Hook for getting album statistics and metadata
 * Provides useful statistics about a collection of albums
 */
export function useAlbumStats(albums: Album[] = []) {
  return useMemo(() => {
    const totalTracks = albums.reduce((sum, album) => sum + (album.totalTracks || 0), 0);
    const totalDiscs = albums.reduce((sum, album) => sum + (album.totalDiscs || 1), 0);
    
    const releaseYears = albums
      .map(album => album.year)
      .filter(Boolean)
      .map(year => parseInt(year!, 10))
      .filter(year => !isNaN(year));

    const earliestYear = releaseYears.length > 0 ? Math.min(...releaseYears) : null;
    const latestYear = releaseYears.length > 0 ? Math.max(...releaseYears) : null;

    const albumTypes = albums.reduce((acc, album) => {
      const type = album.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlbums: albums.length,
      totalTracks,
      totalDiscs,
      earliestYear,
      latestYear,
      yearSpan: earliestYear && latestYear ? latestYear - earliestYear : 0,
      albumTypes,
      averageTracksPerAlbum: albums.length > 0 ? Math.round(totalTracks / albums.length) : 0,
    };
  }, [albums]);
}
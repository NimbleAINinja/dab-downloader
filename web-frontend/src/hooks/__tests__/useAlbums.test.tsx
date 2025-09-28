import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import {
  useArtistAlbums,
  useArtistDetail,
  useAlbumSelection,
  useSelectedAlbumsData,
  usePrefetchAlbumDetails,
  useAlbumFilters,
  useAlbumStats,
} from '../useAlbums';
import { getDabApiClient } from '../../services/DabApiClient';
import type { Album, Artist } from '../../types';

// Mock the API client
vi.mock('../../services/DabApiClient');

const mockGetDabApiClient = vi.mocked(getDabApiClient);

// Mock data
const mockAlbums: Album[] = [
  {
    id: '1',
    title: 'Test Album 1',
    artist: 'Test Artist',
    artistId: 'artist-1',
    cover: 'https://example.com/cover1.jpg',
    totalTracks: 10,
    releaseDate: '2023-01-01',
    type: 'album',
    year: '2023',
    genre: 'Rock',
  },
  {
    id: '2',
    title: 'Test Album 2',
    artist: 'Test Artist',
    artistId: 'artist-1',
    cover: 'https://example.com/cover2.jpg',
    totalTracks: 8,
    releaseDate: '2022-06-15',
    type: 'single',
    year: '2022',
    genre: 'Pop',
  },
];

const mockArtist: Artist = {
  id: 'artist-1',
  name: 'Test Artist',
  picture: 'https://example.com/artist.jpg',
};

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useArtistAlbums', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      getArtistAlbums: vi.fn(),
    };
    mockGetDabApiClient.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch artist albums successfully', async () => {
    mockApiClient.getArtistAlbums.mockResolvedValue(mockAlbums);

    const { result } = renderHook(
      () => useArtistAlbums('artist-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAlbums);
    expect(mockApiClient.getArtistAlbums).toHaveBeenCalledWith('artist-1');
  });

  it('should not fetch when artistId is empty', () => {
    const { result } = renderHook(
      () => useArtistAlbums(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.getArtistAlbums).not.toHaveBeenCalled();
  });

  it('should not fetch when enabled is false', () => {
    const { result } = renderHook(
      () => useArtistAlbums('artist-1', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.getArtistAlbums).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockApiClient.getArtistAlbums.mockRejectedValue(error);

    const { result } = renderHook(
      () => useArtistAlbums('artist-1'),
      { wrapper: createWrapper() }
    );

    // Wait for loading to start
    await waitFor(() => {
      expect(result.current.isLoading || result.current.isError).toBe(true);
    });

    // Then wait for error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 3000 });

    expect(result.current.error).toEqual(error);
  });

  it('should use custom options', async () => {
    mockApiClient.getArtistAlbums.mockResolvedValue(mockAlbums);

    const { result } = renderHook(
      () => useArtistAlbums('artist-1', { 
        staleTime: 10000,
        refetchOnWindowFocus: true 
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAlbums);
  });
});

describe('useArtistDetail', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      getArtist: vi.fn(),
    };
    mockGetDabApiClient.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch artist details successfully', async () => {
    mockApiClient.getArtist.mockResolvedValue(mockArtist);

    const { result } = renderHook(
      () => useArtistDetail('artist-1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockArtist);
    expect(mockApiClient.getArtist).toHaveBeenCalledWith('artist-1', { includeAlbums: false });
  });

  it('should include albums when requested', async () => {
    mockApiClient.getArtist.mockResolvedValue(mockArtist);

    const { result } = renderHook(
      () => useArtistDetail('artist-1', { includeAlbums: true }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.getArtist).toHaveBeenCalledWith('artist-1', { includeAlbums: true });
  });

  it('should not fetch when artistId is empty', () => {
    const { result } = renderHook(
      () => useArtistDetail(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.getArtist).not.toHaveBeenCalled();
  });
});

describe('useAlbumSelection', () => {
  it('should initialize with empty selection', () => {
    const { result } = renderHook(
      () => useAlbumSelection(),
      { wrapper: createWrapper() }
    );

    expect(result.current.selectedAlbums.size).toBe(0);
    expect(result.current.selectedCount).toBe(0);
  });

  it('should initialize with provided selection', async () => {
    const initialSelection = new Set(['1', '2']);
    
    const { result } = renderHook(
      () => useAlbumSelection(initialSelection),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.selectedAlbums.size).toBe(2);
    });

    expect(result.current.selectedCount).toBe(2);
    expect(result.current.isAlbumSelected('1')).toBe(true);
    expect(result.current.isAlbumSelected('2')).toBe(true);
  });

  it('should toggle album selection', async () => {
    const { result } = renderHook(
      () => useAlbumSelection(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.selectedAlbums).toBeDefined();
    });

    // Select album
    result.current.selectAlbum('1');

    await waitFor(() => {
      expect(result.current.isAlbumSelected('1')).toBe(true);
    });

    // Deselect album
    result.current.deselectAlbum('1');

    await waitFor(() => {
      expect(result.current.isAlbumSelected('1')).toBe(false);
    });
  });

  it('should select all albums', async () => {
    const { result } = renderHook(
      () => useAlbumSelection(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.selectedAlbums).toBeDefined();
    });

    result.current.selectAllAlbums(['1', '2', '3']);

    await waitFor(() => {
      expect(result.current.selectedCount).toBe(3);
    });

    expect(result.current.isAlbumSelected('1')).toBe(true);
    expect(result.current.isAlbumSelected('2')).toBe(true);
    expect(result.current.isAlbumSelected('3')).toBe(true);
  });

  it('should deselect all albums', async () => {
    const initialSelection = new Set(['1', '2', '3']);
    
    const { result } = renderHook(
      () => useAlbumSelection(initialSelection),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.selectedCount).toBe(3);
    });

    result.current.deselectAllAlbums();

    await waitFor(() => {
      expect(result.current.selectedCount).toBe(0);
    });
  });

  it('should get correct selection state', async () => {
    const { result } = renderHook(
      () => useAlbumSelection(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.selectedAlbums).toBeDefined();
    });

    const availableAlbums = ['1', '2', '3'];

    // No selection
    expect(result.current.getSelectionState(availableAlbums)).toBe('none');

    // Partial selection
    result.current.selectAlbum('1');
    await waitFor(() => {
      expect(result.current.getSelectionState(availableAlbums)).toBe('some');
    });

    // Full selection
    result.current.selectAllAlbums(availableAlbums);
    await waitFor(() => {
      expect(result.current.getSelectionState(availableAlbums)).toBe('all');
    });
  });
});

describe('useSelectedAlbumsData', () => {
  it('should return empty array when no albums selected', () => {
    const { result } = renderHook(
      () => useSelectedAlbumsData('artist-1'),
      { wrapper: createWrapper() }
    );

    expect(result.current).toEqual([]);
  });

  it('should return empty array when no artistId provided', () => {
    const { result } = renderHook(
      () => useSelectedAlbumsData(),
      { wrapper: createWrapper() }
    );

    expect(result.current).toEqual([]);
  });
});

describe('usePrefetchAlbumDetails', () => {
  it('should provide prefetch function', () => {
    const { result } = renderHook(
      () => usePrefetchAlbumDetails(),
      { wrapper: createWrapper() }
    );

    expect(typeof result.current.prefetchAlbumDetails).toBe('function');
  });

  it('should handle prefetch call without errors', async () => {
    const { result } = renderHook(
      () => usePrefetchAlbumDetails(),
      { wrapper: createWrapper() }
    );

    // Should not throw
    await expect(result.current.prefetchAlbumDetails('album-1')).resolves.toBeUndefined();
  });
});

describe('useAlbumFilters', () => {
  it('should provide filter functions', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    expect(typeof result.current.filterAlbums.byType).toBe('function');
    expect(typeof result.current.filterAlbums.byYear).toBe('function');
    expect(typeof result.current.filterAlbums.byGenre).toBe('function');
    expect(typeof result.current.filterAlbums.search).toBe('function');
  });

  it('should filter albums by type', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const albumTypeResults = result.current.filterAlbums.byType('album');
    expect(albumTypeResults).toHaveLength(1);
    expect(albumTypeResults[0].title).toBe('Test Album 1');

    const singleTypeResults = result.current.filterAlbums.byType('single');
    expect(singleTypeResults).toHaveLength(1);
    expect(singleTypeResults[0].title).toBe('Test Album 2');
  });

  it('should filter albums by year', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const year2023Results = result.current.filterAlbums.byYear('2023');
    expect(year2023Results).toHaveLength(1);
    expect(year2023Results[0].title).toBe('Test Album 1');
  });

  it('should filter albums by genre', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const rockResults = result.current.filterAlbums.byGenre('Rock');
    expect(rockResults).toHaveLength(1);
    expect(rockResults[0].title).toBe('Test Album 1');
  });

  it('should search albums by title and artist', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const titleResults = result.current.filterAlbums.search('Album 1');
    expect(titleResults).toHaveLength(1);
    expect(titleResults[0].title).toBe('Test Album 1');

    const artistResults = result.current.filterAlbums.search('Test Artist');
    expect(artistResults).toHaveLength(2);
  });

  it('should provide sort functions', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    expect(typeof result.current.sortAlbums.byTitle).toBe('function');
    expect(typeof result.current.sortAlbums.byReleaseDate).toBe('function');
    expect(typeof result.current.sortAlbums.byTrackCount).toBe('function');
  });

  it('should sort albums by title', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const sortedAsc = result.current.sortAlbums.byTitle(true);
    expect(sortedAsc[0].title).toBe('Test Album 1');
    expect(sortedAsc[1].title).toBe('Test Album 2');

    const sortedDesc = result.current.sortAlbums.byTitle(false);
    expect(sortedDesc[0].title).toBe('Test Album 2');
    expect(sortedDesc[1].title).toBe('Test Album 1');
  });

  it('should sort albums by release date', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const sortedDesc = result.current.sortAlbums.byReleaseDate(false);
    expect(sortedDesc[0].title).toBe('Test Album 1'); // 2023
    expect(sortedDesc[1].title).toBe('Test Album 2'); // 2022
  });

  it('should sort albums by track count', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    const sortedDesc = result.current.sortAlbums.byTrackCount(false);
    expect(sortedDesc[0].totalTracks).toBe(10);
    expect(sortedDesc[1].totalTracks).toBe(8);
  });

  it('should get unique values', () => {
    const { result } = renderHook(
      () => useAlbumFilters(mockAlbums),
      { wrapper: createWrapper() }
    );

    expect(result.current.getUniqueValues.types).toEqual(['album', 'single']);
    expect(result.current.getUniqueValues.years).toEqual(['2022', '2023']);
    expect(result.current.getUniqueValues.genres).toEqual(['Pop', 'Rock']);
  });
});

describe('useAlbumStats', () => {
  it('should calculate correct statistics', () => {
    const { result } = renderHook(
      () => useAlbumStats(mockAlbums),
      { wrapper: createWrapper() }
    );

    expect(result.current.totalAlbums).toBe(2);
    expect(result.current.totalTracks).toBe(18);
    expect(result.current.totalDiscs).toBe(2);
    expect(result.current.earliestYear).toBe(2022);
    expect(result.current.latestYear).toBe(2023);
    expect(result.current.yearSpan).toBe(1);
    expect(result.current.averageTracksPerAlbum).toBe(9);
  });

  it('should handle empty album list', () => {
    const { result } = renderHook(
      () => useAlbumStats([]),
      { wrapper: createWrapper() }
    );

    expect(result.current.totalAlbums).toBe(0);
    expect(result.current.totalTracks).toBe(0);
    expect(result.current.totalDiscs).toBe(0);
    expect(result.current.earliestYear).toBe(null);
    expect(result.current.latestYear).toBe(null);
    expect(result.current.yearSpan).toBe(0);
    expect(result.current.averageTracksPerAlbum).toBe(0);
  });

  it('should count album types correctly', () => {
    const { result } = renderHook(
      () => useAlbumStats(mockAlbums),
      { wrapper: createWrapper() }
    );

    expect(result.current.albumTypes).toEqual({
      album: 1,
      single: 1,
    });
  });
});
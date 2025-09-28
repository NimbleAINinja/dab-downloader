import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import {
  useDownloadAlbums,
  useDownloadStatus,
  useCancelDownload,
  useDownloadsList,
  useDownloadStats,
  useBatchDownload,
  useDownloadQueue,
} from '../useDownloads';
import { getDabApiClient } from '../../services/DabApiClient';
import type { DownloadStatus, DownloadResponse, Album } from '../../types';

// Mock the API client
vi.mock('../../services/DabApiClient');

const mockGetDabApiClient = vi.mocked(getDabApiClient);

// Mock data
const mockDownloadResponse: DownloadResponse = {
  downloadId: 'download-123',
  status: 'initiated',
  message: 'Download started successfully',
};

const mockDownloadStatus: DownloadStatus = {
  id: 'download-123',
  albumId: 'album-1',
  albumTitle: 'Test Album',
  artistName: 'Test Artist',
  status: 'downloading',
  progress: 50,
  totalTracks: 10,
  completedTracks: 5,
  startTime: new Date('2023-01-01T10:00:00Z'),
};

const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'Test Album 1',
    artist: 'Test Artist',
    artistId: 'artist-1',
    cover: 'https://example.com/cover1.jpg',
    totalTracks: 10,
    releaseDate: '2023-01-01',
  },
  {
    id: 'album-2',
    title: 'Test Album 2',
    artist: 'Test Artist',
    artistId: 'artist-1',
    cover: 'https://example.com/cover2.jpg',
    totalTracks: 8,
    releaseDate: '2022-06-15',
  },
];

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useDownloadAlbums', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      downloadAlbum: vi.fn(),
    };
    mockGetDabApiClient.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initiate download successfully', async () => {
    mockApiClient.downloadAlbum.mockResolvedValue(mockDownloadResponse);

    const { result } = renderHook(
      () => useDownloadAlbums(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync({
        albumIds: ['album-1', 'album-2'],
      });
    });

    expect(mockApiClient.downloadAlbum).toHaveBeenCalledWith(
      ['album-1', 'album-2'],
      {
        format: 'flac',
        bitrate: 'lossless',
        saveAlbumArt: true,
        verifyDownloads: true,
      }
    );
  });

  it('should use custom download options', async () => {
    mockApiClient.downloadAlbum.mockResolvedValue(mockDownloadResponse);

    const { result } = renderHook(
      () => useDownloadAlbums(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync({
        albumIds: ['album-1'],
        format: 'mp3',
        bitrate: '320',
        saveAlbumArt: false,
        verifyDownloads: false,
      });
    });

    expect(mockApiClient.downloadAlbum).toHaveBeenCalledWith(
      ['album-1'],
      {
        format: 'mp3',
        bitrate: '320',
        saveAlbumArt: false,
        verifyDownloads: false,
      }
    );
  });

  it('should handle download errors', async () => {
    const error = new Error('Download failed');
    mockApiClient.downloadAlbum.mockRejectedValue(error);

    const { result } = renderHook(
      () => useDownloadAlbums(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({
          albumIds: ['album-1'],
        });
      } catch (e) {
        expect(e).toEqual(error);
      }
    });

    expect(result.current.error).toEqual(error);
  });

  it('should call success callback', async () => {
    mockApiClient.downloadAlbum.mockResolvedValue(mockDownloadResponse);
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useDownloadAlbums({ onSuccess }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync({
        albumIds: ['album-1'],
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(
      mockDownloadResponse,
      { albumIds: ['album-1'] }
    );
  });

  it('should call error callback', async () => {
    const error = new Error('Download failed');
    mockApiClient.downloadAlbum.mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(
      () => useDownloadAlbums({ onError }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({
          albumIds: ['album-1'],
        });
      } catch (e) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(
      error,
      { albumIds: ['album-1'] }
    );
  });
});

describe('useDownloadStatus', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      getDownloadStatus: vi.fn(),
    };
    mockGetDabApiClient.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch download status successfully', async () => {
    mockApiClient.getDownloadStatus.mockResolvedValue(mockDownloadStatus);

    const { result } = renderHook(
      () => useDownloadStatus('download-123'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDownloadStatus);
    expect(mockApiClient.getDownloadStatus).toHaveBeenCalledWith('download-123');
  });

  it('should not fetch when downloadId is empty', () => {
    const { result } = renderHook(
      () => useDownloadStatus(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.getDownloadStatus).not.toHaveBeenCalled();
  });

  it('should not fetch when enabled is false', () => {
    const { result } = renderHook(
      () => useDownloadStatus('download-123', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.getDownloadStatus).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const error = new Error('Status fetch failed');
    mockApiClient.getDownloadStatus.mockRejectedValue(error);

    const { result } = renderHook(
      () => useDownloadStatus('download-123'),
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

  it('should use custom refetch interval', async () => {
    mockApiClient.getDownloadStatus.mockResolvedValue(mockDownloadStatus);

    const { result } = renderHook(
      () => useDownloadStatus('download-123', { refetchInterval: 5000 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDownloadStatus);
  });
});

describe('useCancelDownload', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      cancelDownload: vi.fn(),
    };
    mockGetDabApiClient.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should cancel download successfully', async () => {
    mockApiClient.cancelDownload.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useCancelDownload(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync('download-123');
    });

    expect(mockApiClient.cancelDownload).toHaveBeenCalledWith('download-123');
  });

  it('should handle cancel errors', async () => {
    const error = new Error('Cancel failed');
    mockApiClient.cancelDownload.mockRejectedValue(error);

    const { result } = renderHook(
      () => useCancelDownload(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync('download-123');
      } catch (e) {
        expect(e).toEqual(error);
      }
    });

    expect(result.current.error).toEqual(error);
  });

  it('should call success callback', async () => {
    mockApiClient.cancelDownload.mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useCancelDownload({ onSuccess }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync('download-123');
    });

    expect(onSuccess).toHaveBeenCalledWith('download-123');
  });

  it('should call error callback', async () => {
    const error = new Error('Cancel failed');
    mockApiClient.cancelDownload.mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(
      () => useCancelDownload({ onError }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync('download-123');
      } catch (e) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(error, 'download-123');
  });
});

describe('useDownloadsList', () => {
  it('should return empty downloads list initially', async () => {
    const { result } = renderHook(
      () => useDownloadsList(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.downloads).toEqual([]);
    });
  });

  it('should filter downloads by status', async () => {
    const { result } = renderHook(
      () => useDownloadsList({ filter: 'active' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.downloads).toEqual([]);
    });
  });

  it('should sort downloads by different criteria', async () => {
    const { result } = renderHook(
      () => useDownloadsList({ 
        sortBy: 'albumTitle',
        sortOrder: 'asc'
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.downloads).toEqual([]);
    });
  });
});

describe('useDownloadStats', () => {
  it('should calculate download statistics', () => {
    const { result } = renderHook(
      () => useDownloadStats(),
      { wrapper: createWrapper() }
    );

    expect(result.current.total).toBe(0);
    expect(result.current.completed).toBe(0);
    expect(result.current.failed).toBe(0);
    expect(result.current.cancelled).toBe(0);
    expect(result.current.active).toBe(0);
    expect(result.current.averageProgress).toBe(0);
    expect(result.current.successRate).toBe(0);
  });
});

describe('useBatchDownload', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      downloadAlbum: vi.fn(),
    };
    mockGetDabApiClient.mockReturnValue(mockApiClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should download selected albums', async () => {
    mockApiClient.downloadAlbum.mockResolvedValue(mockDownloadResponse);

    const { result } = renderHook(
      () => useBatchDownload(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.downloadSelectedAlbums(mockAlbums);
    });

    expect(mockApiClient.downloadAlbum).toHaveBeenCalledWith(
      ['album-1', 'album-2'],
      {
        format: 'flac',
        bitrate: 'lossless',
        saveAlbumArt: true,
        verifyDownloads: true,
      }
    );
  });

  it('should throw error when no albums selected', async () => {
    const { result } = renderHook(
      () => useBatchDownload(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.downloadSelectedAlbums([]);
      } catch (error) {
        expect(error).toEqual(new Error('No albums selected for download'));
      }
    });
  });

  it('should use custom download options', async () => {
    mockApiClient.downloadAlbum.mockResolvedValue(mockDownloadResponse);

    const { result } = renderHook(
      () => useBatchDownload(),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.downloadSelectedAlbums(mockAlbums, {
        format: 'mp3',
        bitrate: '320',
      });
    });

    expect(mockApiClient.downloadAlbum).toHaveBeenCalledWith(
      ['album-1', 'album-2'],
      {
        format: 'mp3',
        bitrate: '320',
        saveAlbumArt: true,
        verifyDownloads: true,
      }
    );
  });

  it('should handle download errors', async () => {
    const error = new Error('Batch download failed');
    mockApiClient.downloadAlbum.mockRejectedValue(error);

    const { result } = renderHook(
      () => useBatchDownload(),
      { wrapper: createWrapper() }
    );

    let caughtError: Error | null = null;
    await act(async () => {
      try {
        await result.current.downloadSelectedAlbums(mockAlbums);
      } catch (e) {
        caughtError = e as Error;
      }
    });

    expect(caughtError).toEqual(error);
    expect(result.current.error).toEqual(error);
  });

  it('should reset error state', async () => {
    const error = new Error('Batch download failed');
    mockApiClient.downloadAlbum.mockRejectedValue(error);

    const { result } = renderHook(
      () => useBatchDownload(),
      { wrapper: createWrapper() }
    );

    // First trigger an error
    await act(async () => {
      try {
        await result.current.downloadSelectedAlbums(mockAlbums);
      } catch (e) {
        // Expected to throw
      }
    });

    // Wait for error state to be set
    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });

    // Reset the error
    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBe(null);
  });
});

describe('useDownloadQueue', () => {
  it('should return queue statistics', () => {
    const { result } = renderHook(
      () => useDownloadQueue(3),
      { wrapper: createWrapper() }
    );

    expect(result.current.activeCount).toBe(0);
    expect(result.current.pendingCount).toBe(0);
    expect(result.current.canStartMore).toBe(true);
    expect(result.current.nextInQueue).toBe(null);
  });

  it('should use custom max concurrent downloads', () => {
    const { result } = renderHook(
      () => useDownloadQueue(5),
      { wrapper: createWrapper() }
    );

    expect(result.current.canStartMore).toBe(true);
  });
});
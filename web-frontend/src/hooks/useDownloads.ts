// Custom React Query hooks for download functionality
// Provides download management, progress tracking, and status monitoring

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { getDabApiClient } from '../services/DabApiClient';
import { queryKeys } from '../services/queryClient';
import type { DownloadStatus, DownloadResponse, Album } from '../types';

/**
 * Hook for initiating album downloads with optimistic updates
 * @param options - Configuration options for the download mutation
 */
export function useDownloadAlbums(options: {
  onSuccess?: (data: DownloadResponse, variables: { albumIds: string[] }) => void;
  onError?: (error: any, variables: { albumIds: string[] }) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      albumIds, 
      format = 'flac', 
      bitrate = 'lossless',
      saveAlbumArt = true,
      verifyDownloads = true 
    }: {
      albumIds: string[];
      format?: 'flac' | 'mp3' | 'aac' | 'ogg';
      bitrate?: '128' | '192' | '256' | '320' | 'lossless';
      saveAlbumArt?: boolean;
      verifyDownloads?: boolean;
    }) => {
      const client = getDabApiClient();
      return client.downloadAlbum(albumIds, {
        format,
        bitrate,
        saveAlbumArt,
        verifyDownloads,
      });
    },
    onMutate: async ({ albumIds }) => {
      // Cancel any outgoing refetches for download status
      await queryClient.cancelQueries({ queryKey: queryKeys.downloads.all });

      // Snapshot the previous download list
      const previousDownloads = queryClient.getQueryData(queryKeys.downloads.list());

      // Optimistically add pending downloads
      const optimisticDownloads = albumIds.map((albumId, index) => ({
        id: `temp-${Date.now()}-${index}`,
        albumId,
        albumTitle: 'Loading...',
        artistName: 'Loading...',
        status: 'pending' as const,
        progress: 0,
        totalTracks: 0,
        completedTracks: 0,
        startTime: new Date(),
      }));

      // Update the downloads list optimistically
      queryClient.setQueryData(queryKeys.downloads.list(), (old: DownloadStatus[] = []) => [
        ...optimisticDownloads,
        ...old,
      ]);

      return { previousDownloads, optimisticDownloads };
    },
    onSuccess: (data, variables) => {
      // Update the optimistic downloads with real download ID
      queryClient.setQueryData(queryKeys.downloads.list(), (old: DownloadStatus[] = []) => {
        return old.map(download => {
          if (download.id.startsWith('temp-')) {
            return {
              ...download,
              id: data.downloadId,
              status: data.status as DownloadStatus['status'],
            };
          }
          return download;
        });
      });

      // Start polling for download status
      queryClient.invalidateQueries({ queryKey: queryKeys.downloads.status(data.downloadId) });

      options.onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      // Revert optimistic updates on error
      if (context?.previousDownloads) {
        queryClient.setQueryData(queryKeys.downloads.list(), context.previousDownloads);
      }

      options.onError?.(error, variables);
    },
    onSettled: () => {
      // Always refetch downloads list after mutation settles
      queryClient.invalidateQueries({ queryKey: queryKeys.downloads.list() });
    },
  });
}

/**
 * Hook for tracking download status with real-time updates
 * @param downloadId - The download ID to track
 * @param options - Configuration options
 */
export function useDownloadStatus(
  downloadId: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    stopOnComplete?: boolean;
  } = {}
) {
  const {
    enabled = true,
    refetchInterval = 2000, // Poll every 2 seconds
    stopOnComplete = true,
  } = options;

  const shouldTrack = Boolean(enabled && downloadId && downloadId.trim().length > 0);

  return useQuery({
    queryKey: queryKeys.downloads.status(downloadId),
    queryFn: async (): Promise<DownloadStatus> => {
      const client = getDabApiClient();
      return client.getDownloadStatus(downloadId);
    },
    enabled: shouldTrack,
    refetchInterval: (query) => {
      // Stop polling if download is complete and stopOnComplete is true
      const data = query.state.data as DownloadStatus | undefined;
      if (stopOnComplete && data?.status && ['completed', 'failed', 'cancelled'].includes(data.status)) {
        return false;
      }
      return refetchInterval;
    },
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider stale for real-time updates
    retry: (failureCount, error: any) => {
      // Don't retry if download doesn't exist (404)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook for cancelling downloads with optimistic updates
 */
export function useCancelDownload(options: {
  onSuccess?: (downloadId: string) => void;
  onError?: (error: any, downloadId: string) => void;
} = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (downloadId: string) => {
      const client = getDabApiClient();
      await client.cancelDownload(downloadId);
      return downloadId;
    },
    onMutate: async (downloadId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.downloads.status(downloadId) });

      // Snapshot the previous status
      const previousStatus = queryClient.getQueryData(queryKeys.downloads.status(downloadId));

      // Optimistically update status to cancelled
      queryClient.setQueryData(queryKeys.downloads.status(downloadId), (old: DownloadStatus | undefined) => {
        if (!old) return old;
        return {
          ...old,
          status: 'cancelled' as const,
          endTime: new Date(),
        };
      });

      // Also update in the downloads list
      queryClient.setQueryData(queryKeys.downloads.list(), (old: DownloadStatus[] = []) => {
        return old.map(download => 
          download.id === downloadId 
            ? { ...download, status: 'cancelled' as const, endTime: new Date() }
            : download
        );
      });

      return { previousStatus };
    },
    onSuccess: (downloadId) => {
      // Stop polling for this download
      queryClient.removeQueries({ queryKey: queryKeys.downloads.status(downloadId) });
      
      options.onSuccess?.(downloadId);
    },
    onError: (error, downloadId, context) => {
      // Revert optimistic updates
      if (context?.previousStatus) {
        queryClient.setQueryData(queryKeys.downloads.status(downloadId), context.previousStatus);
      }

      // Revert in downloads list
      queryClient.invalidateQueries({ queryKey: queryKeys.downloads.list() });

      options.onError?.(error, downloadId);
    },
  });
}

/**
 * Hook for managing the downloads list with filtering and sorting
 */
export function useDownloadsList(options: {
  filter?: 'all' | 'active' | 'completed' | 'failed';
  sortBy?: 'startTime' | 'progress' | 'albumTitle';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const {
    filter = 'all',
    sortBy = 'startTime',
    sortOrder = 'desc',
  } = options;

  // This would typically fetch from a backend endpoint
  // For now, we'll use a local query to manage the downloads list
  const downloadsQuery = useQuery({
    queryKey: queryKeys.downloads.list(),
    queryFn: (): DownloadStatus[] => {
      // In a real app, this would fetch from the backend
      // For now, return empty array as downloads are managed through mutations
      return [];
    },
    staleTime: 1000, // 1 second
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const filteredAndSortedDownloads = useMemo(() => {
    const downloads = downloadsQuery.data || [];

    // Apply filter
    let filtered = downloads;
    switch (filter) {
      case 'active':
        filtered = downloads.filter(d => ['pending', 'queued', 'downloading'].includes(d.status));
        break;
      case 'completed':
        filtered = downloads.filter(d => d.status === 'completed');
        break;
      case 'failed':
        filtered = downloads.filter(d => d.status === 'failed');
        break;
      default:
        filtered = downloads;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'startTime':
          comparison = (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'albumTitle':
          comparison = a.albumTitle.localeCompare(b.albumTitle);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [downloadsQuery.data, filter, sortBy, sortOrder]);

  return {
    downloads: filteredAndSortedDownloads,
    isLoading: downloadsQuery.isLoading,
    error: downloadsQuery.error,
    refetch: downloadsQuery.refetch,
  };
}

/**
 * Hook for download statistics and metrics
 */
export function useDownloadStats() {
  const { downloads } = useDownloadsList();

  return useMemo(() => {
    const stats = downloads.reduce(
      (acc, download) => {
        acc.total++;
        
        switch (download.status) {
          case 'completed':
            acc.completed++;
            break;
          case 'failed':
            acc.failed++;
            break;
          case 'cancelled':
            acc.cancelled++;
            break;
          case 'downloading':
          case 'queued':
          case 'pending':
            acc.active++;
            break;
        }

        acc.totalProgress += download.progress;
        
        return acc;
      },
      {
        total: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        active: 0,
        totalProgress: 0,
      }
    );

    return {
      ...stats,
      averageProgress: stats.total > 0 ? stats.totalProgress / stats.total : 0,
      successRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    };
  }, [downloads]);
}

/**
 * Hook for batch download operations
 * Handles multiple downloads with proper error handling and progress tracking
 */
export function useBatchDownload() {
  const downloadMutation = useDownloadAlbums();
  const queryClient = useQueryClient();

  const downloadSelectedAlbums = useCallback(async (
    albums: Album[],
    options: {
      format?: 'flac' | 'mp3' | 'aac' | 'ogg';
      bitrate?: '128' | '192' | '256' | '320' | 'lossless';
      saveAlbumArt?: boolean;
      verifyDownloads?: boolean;
    } = {}
  ) => {
    if (albums.length === 0) {
      throw new Error('No albums selected for download');
    }

    const albumIds = albums.map(album => album.id);

    // Update the downloads list with album metadata for better UX
    queryClient.setQueryData(queryKeys.downloads.list(), (old: DownloadStatus[] = []) => {
      const newDownloads = albums.map((album, index) => ({
        id: `temp-${Date.now()}-${index}`,
        albumId: album.id,
        albumTitle: album.title,
        artistName: album.artist,
        status: 'pending' as const,
        progress: 0,
        totalTracks: album.totalTracks || 0,
        completedTracks: 0,
        startTime: new Date(),
      }));

      return [...newDownloads, ...old];
    });

    return downloadMutation.mutateAsync({
      albumIds,
      ...options,
    });
  }, [downloadMutation, queryClient]);

  return {
    downloadSelectedAlbums,
    isLoading: downloadMutation.isPending,
    error: downloadMutation.error,
    reset: downloadMutation.reset,
  };
}

/**
 * Hook for managing download queue and concurrency
 * Provides utilities for managing download queue and limiting concurrent downloads
 */
export function useDownloadQueue(maxConcurrent: number = 3) {
  const { downloads } = useDownloadsList();

  const queueStats = useMemo(() => {
    const active = downloads.filter(d => ['downloading', 'queued'].includes(d.status));
    const pending = downloads.filter(d => d.status === 'pending');
    const canStartMore = active.length < maxConcurrent;

    return {
      activeCount: active.length,
      pendingCount: pending.length,
      canStartMore,
      nextInQueue: pending[0] || null,
    };
  }, [downloads, maxConcurrent]);

  return queueStats;
}
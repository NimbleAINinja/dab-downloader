import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppProvider, useAppContext, type AppState } from '../AppContext';
import type { Artist, Album, SearchResults, ErrorState } from '../../types';

// ============================================================================
// Test Utilities
// ============================================================================

const createWrapper = (initialState?: Partial<AppState>) => {
  return ({ children }: { children: ReactNode }) => (
    <AppProvider initialState={initialState}>
      {children}
    </AppProvider>
  );
};

const mockArtist: Artist = {
  id: 'artist-1',
  name: 'Test Artist',
  picture: 'https://example.com/artist.jpg'
};

const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'Test Album 1',
    artist: 'Test Artist',
    cover: 'https://example.com/album1.jpg',
    releaseDate: '2023-01-01',
    tracks: []
  },
  {
    id: 'album-2',
    title: 'Test Album 2',
    artist: 'Test Artist',
    cover: 'https://example.com/album2.jpg',
    releaseDate: '2023-02-01',
    tracks: []
  }
];

const mockSearchResults: SearchResults = {
  artists: [mockArtist],
  albums: mockAlbums,
  tracks: []
};

const mockError: ErrorState = {
  type: 'api',
  message: 'Test error message',
  retryable: true,
  timestamp: new Date()
};

// ============================================================================
// Context Hook Tests
// ============================================================================

describe('useAppContext', () => {
  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAppContext());
    }).toThrow('useAppContext must be used within an AppProvider');
  });

  it('should provide context when used within provider', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    expect(result.current).toBeDefined();
    expect(result.current.state).toBeDefined();
    expect(result.current.dispatch).toBeDefined();
    expect(result.current.actions).toBeDefined();
  });
});

// ============================================================================
// Initial State Tests
// ============================================================================

describe('Initial State', () => {
  it('should have correct initial state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    const { state } = result.current;

    expect(state.searchResults).toEqual({ artists: [], albums: [], tracks: [] });
    expect(state.selectedArtist).toBeNull();
    expect(state.albums).toEqual([]);
    expect(state.isSearching).toBe(false);
    expect(state.selectedAlbums).toEqual(new Set());
    expect(state.selectAllState).toBe('none');
    expect(state.downloads).toEqual(new Map());
    expect(state.activeDownloads).toBe(0);
    expect(state.completedDownloads).toBe(0);
    expect(state.failedDownloads).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.notifications).toEqual([]);
  });

  it('should accept custom initial state', () => {
    const customInitialState: Partial<AppState> = {
      isLoading: true,
      albums: mockAlbums
    };

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(customInitialState)
    });

    const { state } = result.current;

    expect(state.isLoading).toBe(true);
    expect(state.albums).toEqual(mockAlbums);
  });
});

// ============================================================================
// Search Actions Tests
// ============================================================================

describe('Search Actions', () => {
  it('should handle search start', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.startSearch('test query');
    });

    expect(result.current.state.isSearching).toBe(true);
    expect(result.current.state.error).toBeNull();
  });

  it('should handle search success', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.searchSuccess(mockSearchResults, 'test query');
    });

    expect(result.current.state.searchResults).toEqual(mockSearchResults);
    expect(result.current.state.isSearching).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  it('should handle search error', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.searchError(mockError, 'test query');
    });

    expect(result.current.state.isSearching).toBe(false);
    expect(result.current.state.error).toEqual(mockError);
    expect(result.current.state.searchResults).toEqual({ artists: [], albums: [], tracks: [] });
  });

  it('should handle artist selection', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.selectArtist(mockArtist);
    });

    expect(result.current.state.selectedArtist).toEqual(mockArtist);
    expect(result.current.state.albums).toEqual([]);
    expect(result.current.state.selectedAlbums).toEqual(new Set());
    expect(result.current.state.selectAllState).toBe('none');
  });

  it('should handle setting albums', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.setAlbums(mockAlbums);
    });

    expect(result.current.state.albums).toEqual(mockAlbums);
    expect(result.current.state.selectedAlbums).toEqual(new Set());
    expect(result.current.state.selectAllState).toBe('none');
  });

  it('should handle clear search', () => {
    const initialState: Partial<AppState> = {
      searchResults: mockSearchResults,
      selectedArtist: mockArtist,
      albums: mockAlbums,
      selectedAlbums: new Set(['album-1']),
      isSearching: true
    };

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(initialState)
    });

    act(() => {
      result.current.actions.clearSearch();
    });

    expect(result.current.state.searchResults).toEqual({ artists: [], albums: [], tracks: [] });
    expect(result.current.state.selectedArtist).toBeNull();
    expect(result.current.state.albums).toEqual([]);
    expect(result.current.state.selectedAlbums).toEqual(new Set());
    expect(result.current.state.selectAllState).toBe('none');
    expect(result.current.state.isSearching).toBe(false);
  });
});

// ============================================================================
// Selection Actions Tests
// ============================================================================

describe('Selection Actions', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  it('should toggle album selection', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ albums: mockAlbums })
    });

    // Select first album
    act(() => {
      result.current.actions.toggleAlbumSelection('album-1');
    });

    expect(result.current.state.selectedAlbums.has('album-1')).toBe(true);
    expect(result.current.state.selectAllState).toBe('some');

    // Deselect first album
    act(() => {
      result.current.actions.toggleAlbumSelection('album-1');
    });

    expect(result.current.state.selectedAlbums.has('album-1')).toBe(false);
    expect(result.current.state.selectAllState).toBe('none');
  });

  it('should select all albums', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ albums: mockAlbums })
    });

    act(() => {
      result.current.actions.selectAllAlbums();
    });

    expect(result.current.state.selectedAlbums.has('album-1')).toBe(true);
    expect(result.current.state.selectedAlbums.has('album-2')).toBe(true);
    expect(result.current.state.selectAllState).toBe('all');
  });

  it('should deselect all albums', () => {
    const initialState: Partial<AppState> = {
      albums: mockAlbums,
      selectedAlbums: new Set(['album-1', 'album-2']),
      selectAllState: 'all'
    };

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(initialState)
    });

    act(() => {
      result.current.actions.deselectAllAlbums();
    });

    expect(result.current.state.selectedAlbums.size).toBe(0);
    expect(result.current.state.selectAllState).toBe('none');
  });

  it('should set album selection', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ albums: mockAlbums })
    });

    act(() => {
      result.current.actions.setAlbumSelection('album-1', true);
    });

    expect(result.current.state.selectedAlbums.has('album-1')).toBe(true);
    expect(result.current.state.selectAllState).toBe('some');

    act(() => {
      result.current.actions.setAlbumSelection('album-1', false);
    });

    expect(result.current.state.selectedAlbums.has('album-1')).toBe(false);
    expect(result.current.state.selectAllState).toBe('none');
  });

  it('should update selectAllState correctly', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ albums: mockAlbums })
    });

    // No selection
    expect(result.current.state.selectAllState).toBe('none');

    // Partial selection
    act(() => {
      result.current.actions.toggleAlbumSelection('album-1');
    });
    expect(result.current.state.selectAllState).toBe('some');

    // Full selection
    act(() => {
      result.current.actions.toggleAlbumSelection('album-2');
    });
    expect(result.current.state.selectAllState).toBe('all');

    // Back to partial
    act(() => {
      result.current.actions.toggleAlbumSelection('album-1');
    });
    expect(result.current.state.selectAllState).toBe('some');
  });

  it('should clear selection', () => {
    const initialState: Partial<AppState> = {
      albums: mockAlbums,
      selectedAlbums: new Set(['album-1', 'album-2']),
      selectAllState: 'all'
    };

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper(initialState)
    });

    act(() => {
      result.current.actions.clearSelection();
    });

    expect(result.current.state.selectedAlbums.size).toBe(0);
    expect(result.current.state.selectAllState).toBe('none');
  });
});

// ============================================================================
// Download Actions Tests
// ============================================================================

describe('Download Actions', () => {
  it('should start download', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ albums: mockAlbums })
    });

    act(() => {
      result.current.actions.startDownload('download-1', ['album-1']);
    });

    expect(result.current.state.downloads.has('download-1')).toBe(true);
    expect(result.current.state.activeDownloads).toBe(1);

    const download = result.current.state.downloads.get('download-1');
    expect(download?.albumId).toBe('album-1');
    expect(download?.status).toBe('pending');
    expect(download?.progress).toBe(0);
  });

  it('should update download', () => {
    const initialDownloads = new Map();
    initialDownloads.set('download-1', {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'Test Album 1',
      artistName: 'Test Artist',
      status: 'pending' as const,
      progress: 0
    });

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ downloads: initialDownloads })
    });

    act(() => {
      result.current.actions.updateDownload('download-1', {
        status: 'downloading',
        progress: 50
      });
    });

    const download = result.current.state.downloads.get('download-1');
    expect(download?.status).toBe('downloading');
    expect(download?.progress).toBe(50);
  });

  it('should complete download', () => {
    const initialDownloads = new Map();
    initialDownloads.set('download-1', {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'Test Album 1',
      artistName: 'Test Artist',
      status: 'downloading' as const,
      progress: 50
    });

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ 
        downloads: initialDownloads,
        activeDownloads: 1
      })
    });

    act(() => {
      result.current.actions.completeDownload('download-1');
    });

    const download = result.current.state.downloads.get('download-1');
    expect(download?.status).toBe('completed');
    expect(download?.progress).toBe(100);
    expect(result.current.state.activeDownloads).toBe(0);
    expect(result.current.state.completedDownloads).toBe(1);
  });

  it('should fail download', () => {
    const initialDownloads = new Map();
    initialDownloads.set('download-1', {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'Test Album 1',
      artistName: 'Test Artist',
      status: 'downloading' as const,
      progress: 30
    });

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ 
        downloads: initialDownloads,
        activeDownloads: 1
      })
    });

    act(() => {
      result.current.actions.failDownload('download-1', 'Network error');
    });

    const download = result.current.state.downloads.get('download-1');
    expect(download?.status).toBe('failed');
    expect(download?.error).toBe('Network error');
    expect(result.current.state.activeDownloads).toBe(0);
    expect(result.current.state.failedDownloads).toBe(1);
  });

  it('should cancel download', () => {
    const initialDownloads = new Map();
    initialDownloads.set('download-1', {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'Test Album 1',
      artistName: 'Test Artist',
      status: 'downloading' as const,
      progress: 30
    });

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ 
        downloads: initialDownloads,
        activeDownloads: 1
      })
    });

    act(() => {
      result.current.actions.cancelDownload('download-1');
    });

    const download = result.current.state.downloads.get('download-1');
    expect(download?.status).toBe('cancelled');
    expect(result.current.state.activeDownloads).toBe(0);
  });

  it('should remove download', () => {
    const initialDownloads = new Map();
    initialDownloads.set('download-1', {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'Test Album 1',
      artistName: 'Test Artist',
      status: 'completed' as const,
      progress: 100
    });

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ 
        downloads: initialDownloads,
        completedDownloads: 1
      })
    });

    act(() => {
      result.current.actions.removeDownload('download-1');
    });

    expect(result.current.state.downloads.has('download-1')).toBe(false);
    expect(result.current.state.completedDownloads).toBe(0);
  });

  it('should clear downloads', () => {
    const initialDownloads = new Map();
    initialDownloads.set('download-1', {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'Test Album 1',
      artistName: 'Test Artist',
      status: 'completed' as const,
      progress: 100
    });

    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ 
        downloads: initialDownloads,
        activeDownloads: 1,
        completedDownloads: 1,
        failedDownloads: 1
      })
    });

    act(() => {
      result.current.actions.clearDownloads();
    });

    expect(result.current.state.downloads.size).toBe(0);
    expect(result.current.state.activeDownloads).toBe(0);
    expect(result.current.state.completedDownloads).toBe(0);
    expect(result.current.state.failedDownloads).toBe(0);
  });
});

// ============================================================================
// Global State Actions Tests
// ============================================================================

describe('Global State Actions', () => {
  it('should set loading state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.setLoading(true);
    });

    expect(result.current.state.isLoading).toBe(true);

    act(() => {
      result.current.actions.setLoading(false);
    });

    expect(result.current.state.isLoading).toBe(false);
  });

  it('should set error state', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.setError(mockError);
    });

    expect(result.current.state.error).toEqual(mockError);

    act(() => {
      result.current.actions.setError(null);
    });

    expect(result.current.state.error).toBeNull();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper({ error: mockError })
    });

    act(() => {
      result.current.actions.clearError();
    });

    expect(result.current.state.error).toBeNull();
  });
});

// ============================================================================
// Notification Actions Tests
// ============================================================================

describe('Notification Actions', () => {
  it('should add notification', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.addNotification({
        type: 'success',
        title: 'Test Title',
        message: 'Test Message'
      });
    });

    expect(result.current.state.notifications).toHaveLength(1);
    expect(result.current.state.notifications[0].type).toBe('success');
    expect(result.current.state.notifications[0].title).toBe('Test Title');
    expect(result.current.state.notifications[0].message).toBe('Test Message');
    expect(result.current.state.notifications[0].id).toBeDefined();
    expect(result.current.state.notifications[0].timestamp).toBeDefined();
  });

  it('should remove notification', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    let notificationId: string;

    act(() => {
      result.current.actions.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test'
      });
    });

    notificationId = result.current.state.notifications[0].id;

    act(() => {
      result.current.actions.removeNotification(notificationId);
    });

    expect(result.current.state.notifications).toHaveLength(0);
  });

  it('should clear notifications', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.addNotification({
        type: 'info',
        title: 'Test 1',
        message: 'Test 1'
      });
      result.current.actions.addNotification({
        type: 'warning',
        title: 'Test 2',
        message: 'Test 2'
      });
    });

    expect(result.current.state.notifications).toHaveLength(2);

    act(() => {
      result.current.actions.clearNotifications();
    });

    expect(result.current.state.notifications).toHaveLength(0);
  });

  it('should show success notification', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.showSuccessNotification('Success!', 'Operation completed');
    });

    expect(result.current.state.notifications).toHaveLength(1);
    expect(result.current.state.notifications[0].type).toBe('success');
    expect(result.current.state.notifications[0].title).toBe('Success!');
    expect(result.current.state.notifications[0].message).toBe('Operation completed');
    expect(result.current.state.notifications[0].autoClose).toBe(true);
    expect(result.current.state.notifications[0].duration).toBe(5000);
  });

  it('should show error notification', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.showErrorNotification('Error!', 'Something went wrong');
    });

    expect(result.current.state.notifications).toHaveLength(1);
    expect(result.current.state.notifications[0].type).toBe('error');
    expect(result.current.state.notifications[0].title).toBe('Error!');
    expect(result.current.state.notifications[0].message).toBe('Something went wrong');
    expect(result.current.state.notifications[0].autoClose).toBe(false);
  });

  it('should show warning notification', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.showWarningNotification('Warning!', 'Please be careful');
    });

    expect(result.current.state.notifications).toHaveLength(1);
    expect(result.current.state.notifications[0].type).toBe('warning');
    expect(result.current.state.notifications[0].autoClose).toBe(true);
    expect(result.current.state.notifications[0].duration).toBe(7000);
  });

  it('should show info notification', () => {
    const { result } = renderHook(() => useAppContext(), {
      wrapper: createWrapper()
    });

    act(() => {
      result.current.actions.showInfoNotification('Info', 'Just so you know');
    });

    expect(result.current.state.notifications).toHaveLength(1);
    expect(result.current.state.notifications[0].type).toBe('info');
    expect(result.current.state.notifications[0].autoClose).toBe(true);
    expect(result.current.state.notifications[0].duration).toBe(4000);
  });
});
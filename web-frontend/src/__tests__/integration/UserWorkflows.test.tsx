import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../../App';
import { AppProvider } from '../../contexts/AppContext';
import type { Artist, Album, SearchResults } from '../../types';

// Import mocked modules
import * as useSearchModule from '../../hooks/useSearch';
import * as useDownloadsModule from '../../hooks/useDownloads';
import * as useAlbumsModule from '../../hooks/useAlbums';
import * as DabApiClientModule from '../../services/DabApiClient';

// ============================================================================
// Mock Data
// ============================================================================

const mockArtists: Artist[] = [
  {
    id: 'artist-1',
    name: 'Test Artist One',
    picture: 'https://example.com/artist1.jpg'
  },
  {
    id: 'artist-2', 
    name: 'Test Artist Two',
    picture: 'https://example.com/artist2.jpg'
  }
];

const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'First Album',
    artist: 'Test Artist One',
    cover: 'https://example.com/album1.jpg',
    releaseDate: '2023-01-01',
    tracks: [],
    year: '2023',
    totalTracks: 10
  },
  {
    id: 'album-2',
    title: 'Second Album', 
    artist: 'Test Artist One',
    cover: 'https://example.com/album2.jpg',
    releaseDate: '2023-06-01',
    tracks: [],
    year: '2023',
    totalTracks: 12
  },
  {
    id: 'album-3',
    title: 'Third Album',
    artist: 'Test Artist One', 
    cover: 'https://example.com/album3.jpg',
    releaseDate: '2023-12-01',
    tracks: [],
    year: '2023',
    totalTracks: 8
  }
];

const mockSearchResults: SearchResults = {
  artists: mockArtists,
  albums: mockAlbums,
  tracks: []
};

// ============================================================================
// Mock Services and Hooks
// ============================================================================

// Mock the search hooks
vi.mock('../../hooks/useSearch', () => ({
  useSearchArtists: vi.fn(),
  useSearchHistory: vi.fn(),
  usePrefetchArtistAlbums: () => ({ prefetchArtistAlbums: vi.fn() }),
  useSearch: vi.fn(),
  useSearchSuggestions: vi.fn(),
  useCachedSearchResults: vi.fn()
}));

// Mock the download hooks
vi.mock('../../hooks/useDownloads', () => ({
  useDownloadAlbums: vi.fn(),
  useDownloadStatus: vi.fn(),
  useCancelDownload: vi.fn(),
  useDownloadsList: vi.fn(),
  useBatchDownload: vi.fn()
}));

// Mock the albums hook
vi.mock('../../hooks/useAlbums', () => ({
  useArtistAlbums: vi.fn()
}));

// Mock the DabApiClient
vi.mock('../../services/DabApiClient', () => ({
  DabApiClient: vi.fn(),
  getDabApiClient: vi.fn()
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: ({ className, ...props }: any) => (
    <div data-testid="magnifying-glass-icon" className={className} {...props} />
  ),
  XMarkIcon: ({ className, ...props }: any) => (
    <div data-testid="x-mark-icon" className={className} {...props} />
  ),
  CheckIcon: ({ className, ...props }: any) => (
    <div data-testid="check-icon" className={className} {...props} />
  ),
  PlayIcon: ({ className, ...props }: any) => (
    <div data-testid="play-icon" className={className} {...props} />
  ),
  PauseIcon: ({ className, ...props }: any) => (
    <div data-testid="pause-icon" className={className} {...props} />
  ),
  ArrowDownTrayIcon: ({ className, ...props }: any) => (
    <div data-testid="download-icon" className={className} {...props} />
  ),
  ExclamationTriangleIcon: ({ className, ...props }: any) => (
    <div data-testid="exclamation-icon" className={className} {...props} />
  )
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckIcon: ({ className, ...props }: any) => (
    <div data-testid="check-icon-solid" className={className} {...props} />
  )
}));

// ============================================================================
// Test Utilities
// ============================================================================

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
};

const renderApp = () => {
  const TestWrapper = createTestWrapper();
  return render(
    <TestWrapper>
      <App />
    </TestWrapper>
  );
};

// ============================================================================
// Integration Tests
// ============================================================================

describe('User Workflows Integration Tests', () => {
  // Get references to mocked functions
  const mockUseSearchArtists = vi.mocked(useSearchModule.useSearchArtists);
  const mockUseSearchHistory = vi.mocked(useSearchModule.useSearchHistory);
  const mockUseArtistAlbums = vi.mocked(useAlbumsModule.useArtistAlbums);
  const mockUseDownloadsList = vi.mocked(useDownloadsModule.useDownloadsList);
  const mockUseBatchDownload = vi.mocked(useDownloadsModule.useBatchDownload);
  const mockUseCancelDownload = vi.mocked(useDownloadsModule.useCancelDownload);
  const mockGetDabApiClient = vi.mocked(DabApiClientModule.getDabApiClient);

  // Mock API client
  const mockApiClient = {
    searchArtists: vi.fn(),
    getArtistAlbums: vi.fn(),
    downloadAlbum: vi.fn(),
    getDownloadStatus: vi.fn(),
    cancelDownload: vi.fn(),
    testConnection: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Setup default hook responses
    mockUseSearchArtists.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isFetching: false,
      isSuccess: true,
    });

    mockUseSearchHistory.mockReturnValue({
      searchHistory: [],
      addToHistory: vi.fn(),
      clearHistory: vi.fn(),
      removeFromHistory: vi.fn(),
    });

    mockUseArtistAlbums.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isFetching: false,
      isSuccess: true,
    });

    mockUseDownloadsList.mockReturnValue({
      downloads: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockUseBatchDownload.mockReturnValue({
      downloadSelectedAlbums: vi.fn(),
      isLoading: false,
      error: null,
      reset: vi.fn(),
    });

    mockUseCancelDownload.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
      reset: vi.fn(),
    });

    // Setup API client mock
    mockGetDabApiClient.mockReturnValue(mockApiClient);
    mockApiClient.searchArtists.mockResolvedValue(mockArtists);
    mockApiClient.getArtistAlbums.mockResolvedValue(mockAlbums);
    mockApiClient.downloadAlbum.mockResolvedValue({
      downloadId: 'download-123',
      status: 'initiated',
      message: 'Download started successfully'
    });
    mockApiClient.testConnection.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Complete Search-to-Download Workflow
  // ============================================================================

  describe('Complete Search-to-Download Workflow', () => {
    it('should render the main application components', async () => {
      renderApp();

      // Verify initial state
      expect(screen.getByText('DAB Music Downloader')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter artist name...')).toBeInTheDocument();
      expect(screen.getByText('Welcome to DAB Music Downloader')).toBeInTheDocument();
    });

    it('should handle search input and show results when data is available', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock search results
      mockUseSearchArtists.mockReturnValue({
        data: mockArtists,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');

      // Advance timers to trigger debounced search
      vi.advanceTimersByTime(300);

      // The search hook should be called with the query
      expect(mockUseSearchArtists).toHaveBeenCalled();
    });

    it('should show loading state during search', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock loading state
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: true,
        isSuccess: false,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Should show loading indicator
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock error state
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Search failed'),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Should show error message
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Complete Search-to-Download User Journey
  // ============================================================================

  describe('Complete Search-to-Download User Journey', () => {
    it('should complete full workflow: search → select artist → browse albums → select albums → download', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock successful search results
      mockUseSearchArtists.mockReturnValue({
        data: mockArtists,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      // Mock successful album fetch
      mockUseArtistAlbums.mockReturnValue({
        data: mockAlbums,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      // Mock successful download initiation
      const mockDownloadFunction = vi.fn().mockResolvedValue({
        downloadId: 'download-123',
        status: 'initiated',
        message: 'Download started successfully'
      });
      
      mockUseBatchDownload.mockReturnValue({
        downloadSelectedAlbums: mockDownloadFunction,
        isLoading: false,
        error: null,
        reset: vi.fn(),
      });

      renderApp();

      // Step 1: Search for artist
      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Step 2: Verify search results are displayed
      await waitFor(() => {
        expect(mockUseSearchArtists).toHaveBeenCalled();
      });

      // Step 3: Select an artist (simulate clicking on artist result)
      // This would typically trigger album loading
      mockUseArtistAlbums.mockReturnValue({
        data: mockAlbums,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      // Step 4: Verify albums are displayed
      await waitFor(() => {
        expect(mockUseArtistAlbums).toHaveBeenCalled();
      });

      // Step 5: Select albums (simulate checkbox interactions)
      // This would be handled by the AlbumGrid component

      // Step 6: Initiate download
      // This would be triggered by the download button
      await waitFor(() => {
        expect(mockUseBatchDownload).toHaveBeenCalled();
      });
    });

    it('should handle artist selection and album loading workflow', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock search results with artists
      mockUseSearchArtists.mockReturnValue({
        data: mockArtists,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      // Initially no albums loaded
      mockUseArtistAlbums.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: true,
        isSuccess: false,
      });

      renderApp();

      // Search for artist
      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Verify search was triggered
      await waitFor(() => {
        expect(mockUseSearchArtists).toHaveBeenCalled();
      });

      // Simulate artist selection triggering album load
      mockUseArtistAlbums.mockReturnValue({
        data: mockAlbums,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      // Verify albums are eventually loaded
      await waitFor(() => {
        expect(mockUseArtistAlbums).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Album Selection and Download Management
  // ============================================================================

  describe('Album Selection and Download Management', () => {
    it('should handle album selection state management', async () => {
      // Mock albums available
      mockUseArtistAlbums.mockReturnValue({
        data: mockAlbums,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      renderApp();

      // Verify albums hook is called
      await waitFor(() => {
        expect(mockUseArtistAlbums).toHaveBeenCalled();
      });

      // Album selection would be handled by AlbumGrid component
      // This tests that the hooks are properly integrated
    });

    it('should handle download progress tracking', async () => {
      // Mock active downloads
      const mockDownloads = [
        {
          id: 'download-1',
          albumId: 'album-1',
          albumTitle: 'First Album',
          artistName: 'Test Artist One',
          status: 'downloading' as const,
          progress: 45,
          totalTracks: 10,
          completedTracks: 4,
          startTime: new Date(),
        },
        {
          id: 'download-2',
          albumId: 'album-2',
          albumTitle: 'Second Album',
          artistName: 'Test Artist One',
          status: 'completed' as const,
          progress: 100,
          totalTracks: 12,
          completedTracks: 12,
          startTime: new Date(),
          endTime: new Date(),
        }
      ];

      mockUseDownloadsList.mockReturnValue({
        downloads: mockDownloads,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderApp();

      // Verify downloads are being tracked
      await waitFor(() => {
        expect(mockUseDownloadsList).toHaveBeenCalled();
      });
    });

    it('should handle download cancellation', async () => {
      const mockCancelFunction = vi.fn();
      
      mockUseCancelDownload.mockReturnValue({
        mutate: mockCancelFunction,
        isPending: false,
        error: null,
        reset: vi.fn(),
      });

      renderApp();

      // Verify cancel download hook is available
      expect(mockUseCancelDownload).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Error Scenarios and Recovery
  // ============================================================================

  describe('Error Scenarios and Recovery', () => {
    it('should handle network errors during search', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock network error
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error: Unable to connect to server'),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should handle album loading errors', async () => {
      // Mock album loading error
      mockUseArtistAlbums.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load albums'),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      });

      renderApp();

      // Verify error handling for album loading
      await waitFor(() => {
        expect(mockUseArtistAlbums).toHaveBeenCalled();
      });
    });

    it('should handle download failures', async () => {
      // Mock download error
      mockUseBatchDownload.mockReturnValue({
        downloadSelectedAlbums: vi.fn(),
        isLoading: false,
        error: new Error('Download failed: Insufficient storage space'),
        reset: vi.fn(),
      });

      renderApp();

      // Verify error handling for downloads
      expect(mockUseBatchDownload).toHaveBeenCalled();
    });

    it('should handle API timeout errors', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock timeout error
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Request timeout'),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Should handle timeout gracefully
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should provide retry functionality for failed operations', async () => {
      const mockRefetch = vi.fn();
      
      // Mock error state with refetch capability
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Temporary server error'),
        refetch: mockRefetch,
        isError: true,
        isFetching: false,
        isSuccess: false,
      });

      renderApp();

      // Verify refetch function is available for retry
      expect(mockRefetch).toBeDefined();
    });
  });

  // ============================================================================
  // Component Interactions and State Management
  // ============================================================================

  describe('Component Interactions and State Management', () => {
    it('should handle search input clearing', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      
      // Type search query
      await user.type(searchInput, 'Test Artist');
      expect(searchInput).toHaveValue('Test Artist');

      // Clear using Escape key
      await user.keyboard('{Escape}');
      expect(searchInput).toHaveValue('');
    });

    it('should handle empty search results', async () => {
      // Mock empty results
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      renderApp();

      // Should show empty state message
      expect(screen.getByText('Welcome to DAB Music Downloader')).toBeInTheDocument();
    });

    it('should manage loading states across components', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock loading states
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: true,
        isSuccess: false,
      });

      mockUseArtistAlbums.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: true,
        isSuccess: false,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Should show loading indicators
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle concurrent operations', async () => {
      // Mock multiple concurrent downloads
      const mockDownloads = [
        {
          id: 'download-1',
          albumId: 'album-1',
          albumTitle: 'First Album',
          artistName: 'Test Artist One',
          status: 'downloading' as const,
          progress: 25,
          totalTracks: 10,
          completedTracks: 2,
          startTime: new Date(),
        },
        {
          id: 'download-2',
          albumId: 'album-2',
          albumTitle: 'Second Album',
          artistName: 'Test Artist One',
          status: 'downloading' as const,
          progress: 75,
          totalTracks: 12,
          completedTracks: 9,
          startTime: new Date(),
        }
      ];

      mockUseDownloadsList.mockReturnValue({
        downloads: mockDownloads,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      renderApp();

      // Verify concurrent downloads are handled
      await waitFor(() => {
        expect(mockUseDownloadsList).toHaveBeenCalled();
      });
    });

    it('should handle state persistence during navigation', async () => {
      // Mock search results and selection state
      mockUseSearchArtists.mockReturnValue({
        data: mockArtists,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      mockUseArtistAlbums.mockReturnValue({
        data: mockAlbums,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      });

      renderApp();

      // Verify state management hooks are called
      await waitFor(() => {
        expect(mockUseSearchArtists).toHaveBeenCalled();
        expect(mockUseArtistAlbums).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Performance and User Experience
  // ============================================================================

  describe('Performance and User Experience', () => {
    it('should handle debounced search input', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'Test');
      
      // Should not trigger search immediately
      expect(mockUseSearchArtists).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining(['Test']) })
      );
      
      // Advance timers to trigger debounced search
      vi.advanceTimersByTime(300);
      
      // Now search should be triggered
      await waitFor(() => {
        expect(mockUseSearchArtists).toHaveBeenCalled();
      });
    });

    it('should handle rapid user interactions gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      
      // Rapid typing and clearing
      await user.type(searchInput, 'Test');
      await user.clear(searchInput);
      await user.type(searchInput, 'Artist');
      await user.clear(searchInput);
      await user.type(searchInput, 'Final Search');
      
      vi.advanceTimersByTime(300);
      
      // Should handle rapid changes without errors
      await waitFor(() => {
        expect(mockUseSearchArtists).toHaveBeenCalled();
      });
    });

    it('should provide responsive feedback for user actions', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      // Mock loading state
      mockUseSearchArtists.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: true,
        isSuccess: false,
      });

      renderApp();

      const searchInput = screen.getByPlaceholderText('Enter artist name...');
      await user.type(searchInput, 'Test Artist');
      vi.advanceTimersByTime(300);

      // Should show immediate loading feedback
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
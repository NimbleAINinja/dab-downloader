import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DownloadPanel } from '../DownloadPanel';
import type { Album, DownloadStatus } from '../../types';

// Mock the hooks
vi.mock('../../hooks/useDownloads', () => ({
  useBatchDownload: vi.fn(),
  useCancelDownload: vi.fn(),
  useDownloadsList: vi.fn(),
}));

// Import the mocked hooks
import { useBatchDownload, useCancelDownload, useDownloadsList } from '../../hooks/useDownloads';

// Mock data
const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'Test Album 1',
    artist: 'Test Artist 1',
    cover: 'https://example.com/cover1.jpg',
    totalTracks: 12,
    releaseDate: '2023-01-01',
    genre: 'Rock',
    tracks: [],
  },
  {
    id: 'album-2',
    title: 'Test Album 2',
    artist: 'Test Artist 2',
    cover: 'https://example.com/cover2.jpg',
    totalTracks: 8,
    releaseDate: '2023-02-01',
    genre: 'Pop',
    tracks: [],
  },
];

const mockDownloads: DownloadStatus[] = [
  {
    id: 'download-1',
    albumId: 'album-1',
    albumTitle: 'Test Album 1',
    artistName: 'Test Artist 1',
    status: 'downloading',
    progress: 45,
    currentTrack: 'Track 5',
    totalTracks: 12,
    completedTracks: 5,
    startTime: new Date('2023-01-01T10:00:00Z'),
    estimatedTimeRemaining: 300,
  },
  {
    id: 'download-2',
    albumId: 'album-2',
    albumTitle: 'Test Album 2',
    artistName: 'Test Artist 2',
    status: 'completed',
    progress: 100,
    totalTracks: 8,
    completedTracks: 8,
    startTime: new Date('2023-01-01T09:00:00Z'),
    endTime: new Date('2023-01-01T09:30:00Z'),
  },
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('DownloadPanel', () => {
  const mockDownloadSelectedAlbums = vi.fn();
  const mockCancelDownload = vi.fn();
  const mockOnDownloadStart = vi.fn();
  const mockOnDownloadCancel = vi.fn();
  const mockOnClearSelection = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock implementations
    (useBatchDownload as any).mockReturnValue({
      downloadSelectedAlbums: mockDownloadSelectedAlbums,
      isLoading: false,
      error: null,
    });

    (useCancelDownload as any).mockReturnValue({
      mutate: mockCancelDownload,
      isPending: false,
      variables: null,
    });

    (useDownloadsList as any).mockReturnValue({
      downloads: mockDownloads,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the download panel with header', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('Download Manager')).toBeInTheDocument();
    });

    it('shows selected albums when albums are provided', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={mockAlbums} />
        </TestWrapper>
      );

      expect(screen.getByText('Selected Albums (2)')).toBeInTheDocument();
      expect(screen.getAllByText('Test Album 1')).toHaveLength(2); // One in selected albums, one in downloads
      expect(screen.getAllByText('Test Artist 1')).toHaveLength(2); // One in selected albums, one in downloads
      expect(screen.getAllByText('Test Album 2')).toHaveLength(2); // One in selected albums, one in downloads
      expect(screen.getAllByText('Test Artist 2')).toHaveLength(2); // One in selected albums, one in downloads
    });

    it('does not show selected albums section when no albums are selected', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Selected Albums/)).not.toBeInTheDocument();
    });

    it('shows download progress list when downloads exist', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('Downloads (2)')).toBeInTheDocument();
      expect(screen.getByText('Test Album 1')).toBeInTheDocument();
      expect(screen.getByText('Downloading: Track 5')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Download Button', () => {
    it('is disabled when no albums are selected', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      const downloadButton = screen.getByRole('button', { name: /no albums selected/i });
      expect(downloadButton).toBeDisabled();
      expect(downloadButton).toHaveClass('bg-gray-300', 'cursor-not-allowed');
    });

    it('is enabled when albums are selected', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={mockAlbums} />
        </TestWrapper>
      );

      const downloadButton = screen.getByRole('button', { name: /download.*2/i });
      expect(downloadButton).toBeEnabled();
      expect(downloadButton).toHaveClass('bg-green-500');
    });

    it('shows loading state when download is in progress', () => {
      (useBatchDownload as any).mockReturnValue({
        downloadSelectedAlbums: mockDownloadSelectedAlbums,
        isLoading: true,
        error: null,
      });

      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={mockAlbums} />
        </TestWrapper>
      );

      const downloadButton = screen.getByRole('button', { name: /download.*2/i });
      expect(downloadButton).toBeDisabled();
      expect(screen.getByText('Starting Download...')).toBeInTheDocument();
    });

    it('calls downloadSelectedAlbums when clicked', async () => {
      mockDownloadSelectedAlbums.mockResolvedValue({
        downloadId: 'test-download-id',
        status: 'initiated',
        message: 'Download started',
      });

      render(
        <TestWrapper>
          <DownloadPanel 
            selectedAlbums={mockAlbums}
            onDownloadStart={mockOnDownloadStart}
          />
        </TestWrapper>
      );

      const downloadButton = screen.getByRole('button', { name: /download.*2/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadSelectedAlbums).toHaveBeenCalledWith(
          mockAlbums,
          {
            format: 'flac',
            bitrate: 'lossless',
            saveAlbumArt: true,
            verifyDownloads: true,
          }
        );
      });

      expect(mockOnDownloadStart).toHaveBeenCalledWith(['album-1', 'album-2']);
    });
  });

  describe('Clear Selection', () => {
    it('shows clear all button when albums are selected', () => {
      render(
        <TestWrapper>
          <DownloadPanel 
            selectedAlbums={mockAlbums}
            onClearSelection={mockOnClearSelection}
          />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear all selections/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('calls onClearSelection when clear all is clicked', () => {
      render(
        <TestWrapper>
          <DownloadPanel 
            selectedAlbums={mockAlbums}
            onClearSelection={mockOnClearSelection}
          />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear all selections/i });
      fireEvent.click(clearButton);

      expect(mockOnClearSelection).toHaveBeenCalled();
    });
  });

  describe('Download Progress', () => {
    it('shows progress bars for active downloads', () => {
      const { container } = render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      // Check for progress indicators by looking for the progress bar elements
      const progressBars = container.querySelectorAll('.bg-blue-500, .bg-green-500');
      expect(progressBars.length).toBeGreaterThanOrEqual(2);
    });

    it('shows cancel button for active downloads', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel download of test album 1/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('calls cancel download when cancel button is clicked', () => {
      render(
        <TestWrapper>
          <DownloadPanel 
            selectedAlbums={[]}
            onDownloadCancel={mockOnDownloadCancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel download of test album 1/i });
      fireEvent.click(cancelButton);

      expect(mockCancelDownload).toHaveBeenCalledWith('download-1', {
        onSuccess: expect.any(Function),
      });
    });

    it('shows cancelling state when cancel is in progress', () => {
      (useCancelDownload as any).mockReturnValue({
        mutate: mockCancelDownload,
        isPending: true,
        variables: 'download-1',
      });

      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      // Should show loading spinner instead of cancel icon
      const cancelButton = screen.getByRole('button', { name: /cancel download of test album 1/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays download error when present', () => {
      const mockError = new Error('Network error occurred');
      (useBatchDownload as any).mockReturnValue({
        downloadSelectedAlbums: mockDownloadSelectedAlbums,
        isLoading: false,
        error: mockError,
      });

      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={mockAlbums} />
        </TestWrapper>
      );

      expect(screen.getByText('Download Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('shows failed download status in progress list', () => {
      const failedDownloads: DownloadStatus[] = [
        {
          id: 'download-failed',
          albumId: 'album-failed',
          albumTitle: 'Failed Album',
          artistName: 'Failed Artist',
          status: 'failed',
          progress: 25,
          totalTracks: 10,
          completedTracks: 2,
          error: 'Connection timeout',
          startTime: new Date('2023-01-01T10:00:00Z'),
        },
      ];

      (useDownloadsList as any).mockReturnValue({
        downloads: failedDownloads,
      });

      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('Failed: Connection timeout')).toBeInTheDocument();
    });
  });

  describe('Download Settings', () => {
    it('shows download settings in collapsed details', () => {
      render(
        <TestWrapper>
          <DownloadPanel 
            selectedAlbums={[]}
            downloadFormat="mp3"
            downloadBitrate="320"
            saveAlbumArt={false}
            verifyDownloads={false}
          />
        </TestWrapper>
      );

      const detailsElement = screen.getByText('Download Settings');
      fireEvent.click(detailsElement);

      expect(screen.getByText('Format:')).toBeInTheDocument();
      expect(screen.getByText('MP3')).toBeInTheDocument();
      expect(screen.getByText('320 kbps')).toBeInTheDocument();
      expect(screen.getAllByText('No')).toHaveLength(2); // Album Art and Verify should both be No
    });

    it('passes custom download options to downloadSelectedAlbums', async () => {
      mockDownloadSelectedAlbums.mockResolvedValue({
        downloadId: 'test-download-id',
        status: 'initiated',
        message: 'Download started',
      });

      render(
        <TestWrapper>
          <DownloadPanel 
            selectedAlbums={mockAlbums}
            downloadFormat="mp3"
            downloadBitrate="256"
            saveAlbumArt={false}
            verifyDownloads={false}
          />
        </TestWrapper>
      );

      const downloadButton = screen.getByRole('button', { name: /download.*2/i });
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadSelectedAlbums).toHaveBeenCalledWith(
          mockAlbums,
          {
            format: 'mp3',
            bitrate: '256',
            saveAlbumArt: false,
            verifyDownloads: false,
          }
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for download button', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={mockAlbums} />
        </TestWrapper>
      );

      const downloadButton = screen.getByRole('button', { 
        name: /download 2 selected albums/i 
      });
      expect(downloadButton).toBeInTheDocument();
    });

    it('has proper ARIA labels for cancel buttons', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { 
        name: /cancel download of test album 1/i 
      });
      expect(cancelButton).toBeInTheDocument();
    });

    it('has proper alt text for album covers', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={mockAlbums} />
        </TestWrapper>
      );

      const albumCover = screen.getByAltText('Test Album 1 cover');
      expect(albumCover).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} className="custom-class" />
        </TestWrapper>
      );

      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('custom-class');
    });

    it('has responsive grid layout for download settings', () => {
      render(
        <TestWrapper>
          <DownloadPanel selectedAlbums={[]} />
        </TestWrapper>
      );

      const detailsElement = screen.getByText('Download Settings');
      fireEvent.click(detailsElement);

      const settingsGrid = screen.getByText('Format:').closest('.grid');
      expect(settingsGrid).toHaveClass('grid-cols-2');
    });
  });
});
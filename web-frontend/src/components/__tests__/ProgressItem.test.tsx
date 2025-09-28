
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProgressItem } from '../ProgressItem';
import type { DownloadStatus } from '../../types';

// Mock icons to avoid issues with SVG imports in tests
vi.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: ({ className, 'aria-label': ariaLabel }: any) => (
    <div className={className} aria-label={ariaLabel} data-testid="check-circle-icon" />
  ),
  ExclamationTriangleIcon: ({ className, 'aria-label': ariaLabel }: any) => (
    <div className={className} aria-label={ariaLabel} data-testid="exclamation-triangle-icon" />
  ),
  XMarkIcon: ({ className, 'aria-label': ariaLabel }: any) => (
    <div className={className} aria-label={ariaLabel} data-testid="x-mark-icon" />
  ),
  ClockIcon: ({ className, 'aria-label': ariaLabel }: any) => (
    <div className={className} aria-label={ariaLabel} data-testid="clock-icon" />
  ),
  ArrowPathIcon: ({ className }: any) => (
    <div className={className} data-testid="arrow-path-icon" />
  ),
  InformationCircleIcon: ({ className }: any) => (
    <div className={className} data-testid="information-circle-icon" />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  ArrowDownTrayIcon: ({ className, 'aria-label': ariaLabel }: any) => (
    <div className={className} aria-label={ariaLabel} data-testid="arrow-down-tray-icon-solid" />
  ),
  XMarkIcon: ({ className }: any) => (
    <div className={className} data-testid="x-mark-icon-solid" />
  ),
}));

describe('ProgressItem', () => {
  const mockDownload: DownloadStatus = {
    id: 'download-1',
    albumId: 'album-1',
    albumTitle: 'Test Album',
    artistName: 'Test Artist',
    status: 'downloading',
    progress: 50,
    currentTrack: 'Track 1',
    totalTracks: 10,
    completedTracks: 5,
    startTime: new Date('2024-01-01T10:00:00Z'),
    estimatedTimeRemaining: 120,
  };

  const mockOnCancel = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders download information correctly', () => {
      render(<ProgressItem download={mockDownload} />);

      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('5 of 10 tracks')).toBeInTheDocument();
    });

    it('renders with compact mode', () => {
      render(<ProgressItem download={mockDownload} compact={true} />);

      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.getByText('5/10 tracks')).toBeInTheDocument();
    });

    it('renders without details when showDetails is false', () => {
      render(<ProgressItem download={mockDownload} showDetails={false} />);

      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.queryByText('5 of 10 tracks')).not.toBeInTheDocument();
    });
  });

  describe('Status Icons and Text', () => {
    it('shows correct icon and text for downloading status', () => {
      render(<ProgressItem download={mockDownload} />);

      expect(screen.getByTestId('arrow-down-tray-icon-solid')).toBeInTheDocument();
      expect(screen.getByText('Downloading: Track 1')).toBeInTheDocument();
    });

    it('shows correct icon and text for completed status', () => {
      const completedDownload = { ...mockDownload, status: 'completed' as const, progress: 100 };
      render(<ProgressItem download={completedDownload} />);

      expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(2); // One in status, one in completion details
      expect(screen.getByText('Completed successfully')).toBeInTheDocument();
    });

    it('shows correct icon and text for failed status', () => {
      const failedDownload = { 
        ...mockDownload, 
        status: 'failed' as const, 
        error: 'Network error',
        progress: 25 
      };
      render(<ProgressItem download={failedDownload} />);

      expect(screen.getByTestId('exclamation-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Failed: Network error')).toBeInTheDocument();
    });

    it('shows correct icon and text for queued status', () => {
      const queuedDownload = { ...mockDownload, status: 'queued' as const };
      render(<ProgressItem download={queuedDownload} />);

      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByText('Waiting in queue')).toBeInTheDocument();
    });

    it('shows correct icon and text for cancelled status', () => {
      const cancelledDownload = { ...mockDownload, status: 'cancelled' as const };
      render(<ProgressItem download={cancelledDownload} />);

      expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
      expect(screen.getByText('Download cancelled')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('displays progress bar with correct width', () => {
      render(<ProgressItem download={mockDownload} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('handles progress values outside 0-100 range', () => {
      const invalidProgressDownload = { ...mockDownload, progress: 150 };
      render(<ProgressItem download={invalidProgressDownload} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('shows correct color for different statuses', () => {
      const completedDownload = { ...mockDownload, status: 'completed' as const };
      render(<ProgressItem download={completedDownload} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveClass('bg-green-500');
    });
  });

  describe('Action Buttons', () => {
    it('shows cancel button for active downloads', () => {
      render(<ProgressItem download={mockDownload} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByLabelText('Cancel download of Test Album');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).not.toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      render(<ProgressItem download={mockDownload} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByLabelText('Cancel download of Test Album');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalledWith('download-1');
      });
    });

    it('disables cancel button when cancelling', () => {
      render(
        <ProgressItem 
          download={mockDownload} 
          onCancel={mockOnCancel} 
          isCancelling={true} 
        />
      );

      const cancelButton = screen.getByLabelText('Cancel download of Test Album');
      expect(cancelButton).toBeDisabled();
    });

    it('shows retry button for failed downloads', () => {
      const failedDownload = { ...mockDownload, status: 'failed' as const };
      render(<ProgressItem download={failedDownload} onRetry={mockOnRetry} />);

      const retryButton = screen.getByLabelText('Retry download of Test Album');
      expect(retryButton).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const failedDownload = { ...mockDownload, status: 'failed' as const };
      render(<ProgressItem download={failedDownload} onRetry={mockOnRetry} />);

      const retryButton = screen.getByLabelText('Retry download of Test Album');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockOnRetry).toHaveBeenCalledWith('download-1');
      });
    });

    it('does not show action buttons for completed downloads', () => {
      const completedDownload = { ...mockDownload, status: 'completed' as const };
      render(
        <ProgressItem 
          download={completedDownload} 
          onCancel={mockOnCancel} 
          onRetry={mockOnRetry} 
        />
      );

      expect(screen.queryByLabelText('Cancel download of Test Album')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Retry download of Test Album')).not.toBeInTheDocument();
    });
  });

  describe('Time and Speed Display', () => {
    it('formats time remaining correctly', () => {
      render(<ProgressItem download={mockDownload} />);

      expect(screen.getByText(/~2m remaining/)).toBeInTheDocument();
    });

    it('shows download speed when available', () => {
      const downloadWithSpeed = { 
        ...mockDownload, 
        speed: 1024 * 1024 // 1 MB/s
      };
      render(<ProgressItem download={downloadWithSpeed} />);

      expect(screen.getByText(/1\.0 MB\/s/)).toBeInTheDocument();
    });

    it('shows elapsed time for completed downloads', () => {
      const completedDownload = { 
        ...mockDownload, 
        status: 'completed' as const,
        endTime: new Date('2024-01-01T10:02:00Z') // 2 minutes after start
      };
      render(<ProgressItem download={completedDownload} />);

      expect(screen.getByText(/Completed in 2m/)).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('shows error details for failed downloads', () => {
      const failedDownload = { 
        ...mockDownload, 
        status: 'failed' as const,
        error: 'Connection timeout'
      };
      render(<ProgressItem download={failedDownload} />);

      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
      expect(screen.getByTestId('information-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<ProgressItem download={mockDownload} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute(
        'aria-label', 
        'Download progress for Test Album by Test Artist'
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute(
        'aria-label', 
        'Download progress: 50%'
      );
    });

    it('provides proper button labels', () => {
      render(<ProgressItem download={mockDownload} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByLabelText('Cancel download of Test Album');
      expect(cancelButton).toHaveAttribute('title', 'Cancel download');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional fields gracefully', () => {
      const minimalDownload: DownloadStatus = {
        id: 'download-2',
        albumId: 'album-2',
        albumTitle: 'Minimal Album',
        artistName: 'Minimal Artist',
        status: 'pending',
        progress: 0,
      };

      render(<ProgressItem download={minimalDownload} />);

      expect(screen.getByText('Minimal Album')).toBeInTheDocument();
      expect(screen.getByText('Minimal Artist')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles zero total tracks', () => {
      const noTracksDownload = { ...mockDownload, totalTracks: 0 };
      render(<ProgressItem download={noTracksDownload} />);

      expect(screen.queryByText(/tracks/)).not.toBeInTheDocument();
    });
  });
});
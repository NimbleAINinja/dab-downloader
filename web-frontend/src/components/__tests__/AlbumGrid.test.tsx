import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlbumGrid } from '../AlbumGrid';
import type { Album } from '../../types';

// Mock the AlbumCard component to simplify testing
vi.mock('../AlbumCard', () => ({
  AlbumCard: ({ album, isSelected, onSelect, size }: any) => (
    <div
      data-testid={`album-card-${album.id}`}
      data-selected={isSelected}
      data-size={size}
      onClick={() => onSelect(album.id, !isSelected)}
    >
      <span>{album.title}</span>
      <span>{album.artist}</span>
      {isSelected && <span data-testid="selected-indicator">Selected</span>}
    </div>
  ),
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className}>Check</div>
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <div data-testid="x-mark-icon" className={className}>X</div>
  ),
  ExclamationTriangleIcon: ({ className }: { className?: string }) => (
    <div data-testid="exclamation-icon" className={className}>!</div>
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon-solid" className={className}>CheckSolid</div>
  ),
}));

describe('AlbumGrid', () => {
  const mockAlbums: Album[] = [
    {
      id: '1',
      title: 'Album One',
      artist: 'Artist One',
      cover: 'https://example.com/cover1.jpg',
      releaseDate: '2023-01-01',
      tracks: [],
      year: '2023',
      totalTracks: 10,
    },
    {
      id: '2',
      title: 'Album Two',
      artist: 'Artist Two',
      cover: 'https://example.com/cover2.jpg',
      releaseDate: '2023-02-01',
      tracks: [],
      year: '2023',
      totalTracks: 12,
    },
    {
      id: '3',
      title: 'Album Three',
      artist: 'Artist Three',
      cover: 'https://example.com/cover3.jpg',
      releaseDate: '2023-03-01',
      tracks: [],
      year: '2023',
      totalTracks: 8,
    },
  ];

  const defaultProps = {
    albums: mockAlbums,
    selectedAlbums: new Set<string>(),
    onAlbumSelect: vi.fn(),
    onSelectAll: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders albums correctly', () => {
      render(<AlbumGrid {...defaultProps} />);

      expect(screen.getByTestId('album-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('album-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('album-card-3')).toBeInTheDocument();

      expect(screen.getByText('Album One')).toBeInTheDocument();
      expect(screen.getByText('Album Two')).toBeInTheDocument();
      expect(screen.getByText('Album Three')).toBeInTheDocument();
    });

    it('applies correct grid size classes', () => {
      const { rerender } = render(<AlbumGrid {...defaultProps} gridSize="small" />);
      let gridContainer = screen.getByTestId('album-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-2');

      rerender(<AlbumGrid {...defaultProps} gridSize="medium" />);
      gridContainer = screen.getByTestId('album-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1');

      rerender(<AlbumGrid {...defaultProps} gridSize="large" />);
      gridContainer = screen.getByTestId('album-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1');
    });

    it('passes correct size prop to AlbumCard components', () => {
      render(<AlbumGrid {...defaultProps} gridSize="large" />);

      expect(screen.getByTestId('album-card-1')).toHaveAttribute('data-size', 'large');
      expect(screen.getByTestId('album-card-2')).toHaveAttribute('data-size', 'large');
      expect(screen.getByTestId('album-card-3')).toHaveAttribute('data-size', 'large');
    });
  });

  describe('Loading State', () => {
    it('shows loading skeletons when loading', () => {
      render(<AlbumGrid {...defaultProps} isLoading={true} />);

      const skeletons = screen.getAllByRole('presentation', { hidden: true });
      expect(skeletons).toHaveLength(12); // Default skeleton count
      expect(skeletons[0]).toHaveClass('animate-pulse');
    });

    it('does not show albums when loading', () => {
      render(<AlbumGrid {...defaultProps} isLoading={true} />);

      expect(screen.queryByTestId('album-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('album-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('album-card-3')).not.toBeInTheDocument();
    });

    it('does not show select all button when loading', () => {
      render(<AlbumGrid {...defaultProps} isLoading={true} />);

      expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when error is present', () => {
      const errorMessage = 'Failed to load albums';
      render(<AlbumGrid {...defaultProps} error={errorMessage} />);

      expect(screen.getByText('Error loading albums')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByTestId('exclamation-icon')).toBeInTheDocument();
    });

    it('does not show albums when error is present', () => {
      render(<AlbumGrid {...defaultProps} error="Some error" />);

      expect(screen.queryByTestId('album-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('album-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('album-card-3')).not.toBeInTheDocument();
    });

    it('shows retry button in error state', () => {
      render(<AlbumGrid {...defaultProps} error="Some error" />);

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no albums are provided', () => {
      render(<AlbumGrid {...defaultProps} albums={[]} />);

      expect(screen.getByText('No albums found')).toBeInTheDocument();
      expect(screen.getByText('Search for an artist to see their albums here.')).toBeInTheDocument();
    });

    it('shows custom empty message when provided', () => {
      const customMessage = 'Custom empty message';
      render(<AlbumGrid {...defaultProps} albums={[]} emptyMessage={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('does not show select all button when no albums', () => {
      render(<AlbumGrid {...defaultProps} albums={[]} />);

      expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument();
    });
  });

  describe('Selection Functionality', () => {
    it('shows select all button by default', () => {
      render(<AlbumGrid {...defaultProps} />);

      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
    });

    it('hides select all button when showSelectAll is false', () => {
      render(<AlbumGrid {...defaultProps} showSelectAll={false} />);

      expect(screen.queryByRole('button', { name: /select all/i })).not.toBeInTheDocument();
    });

    it('calls onSelectAll when select all button is clicked', async () => {
      const user = userEvent.setup();
      render(<AlbumGrid {...defaultProps} />);

      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      expect(defaultProps.onSelectAll).toHaveBeenCalledTimes(1);
    });

    it('shows correct button text and state when no albums are selected', () => {
      render(<AlbumGrid {...defaultProps} />);

      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('shows correct button text and state when all albums are selected', () => {
      const selectedAlbums = new Set(['1', '2', '3']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      expect(screen.getByRole('button', { name: /deselect all/i })).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();
      expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
    });

    it('shows correct button text and state when some albums are selected', () => {
      const selectedAlbums = new Set(['1', '2']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon-solid')).toBeInTheDocument();
    });

    it('shows selection count when albums are selected', () => {
      const selectedAlbums = new Set(['1', '2']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      expect(screen.getByText('2 of 3 selected')).toBeInTheDocument();
    });

    it('calls onAlbumSelect when album card is clicked', async () => {
      const user = userEvent.setup();
      render(<AlbumGrid {...defaultProps} />);

      const albumCard = screen.getByTestId('album-card-1');
      await user.click(albumCard);

      expect(defaultProps.onAlbumSelect).toHaveBeenCalledWith('1', true);
    });

    it('shows selected state on album cards correctly', () => {
      const selectedAlbums = new Set(['1', '3']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      expect(screen.getByTestId('album-card-1')).toHaveAttribute('data-selected', 'true');
      expect(screen.getByTestId('album-card-2')).toHaveAttribute('data-selected', 'false');
      expect(screen.getByTestId('album-card-3')).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Accessibility', () => {
    it('provides screen reader announcements for selection changes', () => {
      const selectedAlbums = new Set(['1', '2']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      const announcement = screen.getByText('2 albums selected out of 3');
      expect(announcement).toHaveClass('sr-only');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    it('provides proper aria-label for select all button', () => {
      const selectedAlbums = new Set(['1']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      const selectAllButton = screen.getByRole('button', { name: /select all \(1 of 3 selected\)/i });
      expect(selectAllButton).toBeInTheDocument();
    });

    it('provides proper aria-label for deselect all button', () => {
      const selectedAlbums = new Set(['1', '2', '3']);
      render(<AlbumGrid {...defaultProps} selectedAlbums={selectedAlbums} />);

      const deselectAllButton = screen.getByRole('button', { name: /deselect all \(3 of 3 selected\)/i });
      expect(deselectAllButton).toBeInTheDocument();
    });

    it('has proper focus management for select all button', async () => {
      const user = userEvent.setup();
      render(<AlbumGrid {...defaultProps} />);

      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      
      await user.tab();
      expect(selectAllButton).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive grid classes for small size', () => {
      render(<AlbumGrid {...defaultProps} gridSize="small" />);
      
      const gridContainer = screen.getByTestId('album-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4', 'lg:grid-cols-6', 'xl:grid-cols-8');
    });

    it('applies responsive grid classes for medium size', () => {
      render(<AlbumGrid {...defaultProps} gridSize="medium" />);
      
      const gridContainer = screen.getByTestId('album-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-5', '2xl:grid-cols-6');
    });

    it('applies responsive grid classes for large size', () => {
      render(<AlbumGrid {...defaultProps} gridSize="large" />);
      
      const gridContainer = screen.getByTestId('album-card-1').parentElement;
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });

  describe('Integration Tests', () => {
    it('handles complete selection workflow', async () => {
      const user = userEvent.setup();
      const onAlbumSelect = vi.fn();
      const onSelectAll = vi.fn();

      const { rerender } = render(
        <AlbumGrid
          {...defaultProps}
          onAlbumSelect={onAlbumSelect}
          onSelectAll={onSelectAll}
        />
      );

      // Initially no albums selected
      expect(screen.getByText('Select All')).toBeInTheDocument();

      // Select individual album
      await user.click(screen.getByTestId('album-card-1'));
      expect(onAlbumSelect).toHaveBeenCalledWith('1', true);

      // Simulate partial selection state
      rerender(
        <AlbumGrid
          {...defaultProps}
          selectedAlbums={new Set(['1'])}
          onAlbumSelect={onAlbumSelect}
          onSelectAll={onSelectAll}
        />
      );

      expect(screen.getByText('1 of 3 selected')).toBeInTheDocument();
      expect(screen.getByText('Select All')).toBeInTheDocument();

      // Click select all
      await user.click(screen.getByRole('button', { name: /select all/i }));
      expect(onSelectAll).toHaveBeenCalledTimes(1);

      // Simulate all selected state
      rerender(
        <AlbumGrid
          {...defaultProps}
          selectedAlbums={new Set(['1', '2', '3'])}
          onAlbumSelect={onAlbumSelect}
          onSelectAll={onSelectAll}
        />
      );

      expect(screen.getByText('3 of 3 selected')).toBeInTheDocument();
      expect(screen.getByText('Deselect All')).toBeInTheDocument();

      // Click deselect all
      await user.click(screen.getByRole('button', { name: /deselect all/i }));
      expect(onSelectAll).toHaveBeenCalledTimes(2);
    });

    it('handles loading to content transition', async () => {
      const { rerender } = render(<AlbumGrid {...defaultProps} isLoading={true} />);

      // Initially loading
      expect(screen.getAllByRole('presentation', { hidden: true })).toHaveLength(12);
      expect(screen.queryByTestId('album-card-1')).not.toBeInTheDocument();

      // Transition to loaded
      rerender(<AlbumGrid {...defaultProps} isLoading={false} />);

      await waitFor(() => {
        expect(screen.queryByRole('presentation', { hidden: true })).not.toBeInTheDocument();
        expect(screen.getByTestId('album-card-1')).toBeInTheDocument();
      });
    });

    it('handles error to content transition', async () => {
      const { rerender } = render(<AlbumGrid {...defaultProps} error="Network error" />);

      // Initially error
      expect(screen.getByText('Error loading albums')).toBeInTheDocument();
      expect(screen.queryByTestId('album-card-1')).not.toBeInTheDocument();

      // Transition to loaded
      rerender(<AlbumGrid {...defaultProps} error={null} />);

      await waitFor(() => {
        expect(screen.queryByText('Error loading albums')).not.toBeInTheDocument();
        expect(screen.getByTestId('album-card-1')).toBeInTheDocument();
      });
    });

    it('handles empty to content transition', async () => {
      const { rerender } = render(<AlbumGrid {...defaultProps} albums={[]} />);

      // Initially empty
      expect(screen.getByText('No albums found')).toBeInTheDocument();
      expect(screen.queryByTestId('album-card-1')).not.toBeInTheDocument();

      // Transition to loaded
      rerender(<AlbumGrid {...defaultProps} albums={mockAlbums} />);

      await waitFor(() => {
        expect(screen.queryByText('No albums found')).not.toBeInTheDocument();
        expect(screen.getByTestId('album-card-1')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily when props do not change', () => {
      const { rerender } = render(<AlbumGrid {...defaultProps} />);
      
      const initialAlbumCard = screen.getByTestId('album-card-1');
      
      // Re-render with same props
      rerender(<AlbumGrid {...defaultProps} />);
      
      const afterRerenderAlbumCard = screen.getByTestId('album-card-1');
      expect(initialAlbumCard).toBe(afterRerenderAlbumCard);
    });

    it('handles large number of albums efficiently', () => {
      const manyAlbums = Array.from({ length: 100 }, (_, i) => ({
        id: `album-${i}`,
        title: `Album ${i}`,
        artist: `Artist ${i}`,
        cover: `https://example.com/cover${i}.jpg`,
        releaseDate: '2023-01-01',
        tracks: [],
        year: '2023',
        totalTracks: 10,
      }));

      const startTime = performance.now();
      render(<AlbumGrid {...defaultProps} albums={manyAlbums} />);
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should render all albums
      expect(screen.getByTestId('album-card-album-0')).toBeInTheDocument();
      expect(screen.getByTestId('album-card-album-99')).toBeInTheDocument();
    });
  });
});
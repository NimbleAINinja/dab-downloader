
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AlbumCard from '../AlbumCard';
import type { Album } from '../../types';

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon-outline" className={className} />
  ),
  MusicalNoteIcon: ({ className }: { className?: string }) => (
    <div data-testid="musical-note-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  CheckIcon: ({ className }: { className?: string }) => (
    <div data-testid="check-icon-solid" className={className} />
  ),
}));

describe('AlbumCard', () => {
  const mockAlbum: Album = {
    id: 'album-1',
    title: 'Test Album',
    artist: 'Test Artist',
    cover: 'https://example.com/cover.jpg',
    releaseDate: '2023-01-01',
    tracks: [],
    totalTracks: 12,
    year: '2023',
    genre: 'Rock',
  };

  const defaultProps = {
    album: mockAlbum,
    isSelected: false,
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders album information correctly', () => {
      render(<AlbumCard {...defaultProps} />);

      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText(/12 tracks/)).toBeInTheDocument();
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });

    it('renders album cover image with correct attributes', () => {
      render(<AlbumCard {...defaultProps} />);

      const image = screen.getByAltText('Test Album album cover');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('shows placeholder when no cover image is provided', () => {
      const albumWithoutCover = { ...mockAlbum, cover: '' };
      render(<AlbumCard {...defaultProps} album={albumWithoutCover} />);

      expect(screen.getByTestId('musical-note-icon')).toBeInTheDocument();
    });

    it('hides artist when showArtist is false', () => {
      render(<AlbumCard {...defaultProps} showArtist={false} />);

      expect(screen.getByText('Test Album')).toBeInTheDocument();
      expect(screen.queryByText('Test Artist')).not.toBeInTheDocument();
    });

    it('applies correct size classes', () => {
      const { rerender } = render(<AlbumCard {...defaultProps} size="small" />);
      let card = screen.getByRole('button');
      expect(card).toHaveClass('w-32');

      rerender(<AlbumCard {...defaultProps} size="medium" />);
      card = screen.getByRole('button');
      expect(card).toHaveClass('w-48');

      rerender(<AlbumCard {...defaultProps} size="large" />);
      card = screen.getByRole('button');
      expect(card).toHaveClass('w-64');
    });

    it('applies custom className', () => {
      render(<AlbumCard {...defaultProps} className="custom-class" />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Selection State', () => {
    it('shows unselected state correctly', () => {
      render(<AlbumCard {...defaultProps} isSelected={false} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('check-icon-outline')).toBeInTheDocument();
      expect(screen.queryByTestId('check-icon-solid')).not.toBeInTheDocument();
    });

    it('shows selected state correctly', () => {
      render(<AlbumCard {...defaultProps} isSelected={true} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getAllByTestId('check-icon-solid')).toHaveLength(2); // One in checkbox, one in overlay
    });

    it('calls onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AlbumCard {...defaultProps} onSelect={onSelect} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(onSelect).toHaveBeenCalledWith('album-1', true);
    });

    it('calls onSelect when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AlbumCard {...defaultProps} onSelect={onSelect} />);

      const checkbox = screen.getByLabelText('Select Test Album');
      await user.click(checkbox);

      expect(onSelect).toHaveBeenCalledWith('album-1', true);
    });

    it('toggles selection state correctly', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      // Test unselected -> selected
      const { rerender } = render(<AlbumCard {...defaultProps} onSelect={onSelect} />);
      let card = screen.getByRole('button');
      await user.click(card);
      expect(onSelect).toHaveBeenCalledWith('album-1', true);

      // Test selected -> unselected
      rerender(<AlbumCard {...defaultProps} isSelected={true} onSelect={onSelect} />);
      card = screen.getByRole('button');
      await user.click(card);
      expect(onSelect).toHaveBeenCalledWith('album-1', false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('is focusable and has correct ARIA attributes', () => {
      render(<AlbumCard {...defaultProps} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-label', 'Select Test Album by Test Artist, 12 tracks');
    });

    it('toggles selection on Enter key', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AlbumCard {...defaultProps} onSelect={onSelect} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith('album-1', true);
    });

    it('toggles selection on Space key', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AlbumCard {...defaultProps} onSelect={onSelect} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(onSelect).toHaveBeenCalledWith('album-1', true);
    });

    it('does not trigger selection on other keys', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<AlbumCard {...defaultProps} onSelect={onSelect} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Escape}');

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('shows focus state visually', async () => {
      const user = userEvent.setup();
      render(<AlbumCard {...defaultProps} />);

      const card = screen.getByRole('button');
      await user.tab(); // Focus the card

      // Check if focus styles are applied (this is a simplified check)
      expect(card).toHaveFocus();
    });
  });

  describe('Image Loading', () => {
    it('shows loading placeholder initially', () => {
      render(<AlbumCard {...defaultProps} />);

      // Should show musical note icon as placeholder
      expect(screen.getByTestId('musical-note-icon')).toBeInTheDocument();
    });

    it('handles image load success', async () => {
      render(<AlbumCard {...defaultProps} />);

      const image = screen.getByAltText('Test Album album cover');
      
      // Simulate image load
      fireEvent.load(image);

      await waitFor(() => {
        expect(image).toHaveClass('opacity-100');
      });
    });

    it('handles image load error', async () => {
      render(<AlbumCard {...defaultProps} />);

      const image = screen.getByAltText('Test Album album cover');
      
      // Simulate image error
      fireEvent.error(image);

      await waitFor(() => {
        // Should show placeholder icon when image fails to load
        expect(screen.getByTestId('musical-note-icon')).toBeInTheDocument();
      });
    });

    it('shows placeholder when album has no cover', () => {
      const albumWithoutCover = { ...mockAlbum, cover: '' };
      render(<AlbumCard {...defaultProps} album={albumWithoutCover} />);

      expect(screen.getByTestId('musical-note-icon')).toBeInTheDocument();
      expect(screen.queryByAltText('Test Album album cover')).not.toBeInTheDocument();
    });
  });

  describe('Track Count Display', () => {
    it('displays track count from totalTracks', () => {
      render(<AlbumCard {...defaultProps} />);
      expect(screen.getByText((_content, element) => {
        return element?.textContent === '12 tracks • 2023';
      })).toBeInTheDocument();
    });

    it('displays track count from tracks array when totalTracks is not available', () => {
      const albumWithTracksArray = {
        ...mockAlbum,
        totalTracks: undefined,
        tracks: new Array(8).fill({}),
      };
      render(<AlbumCard {...defaultProps} album={albumWithTracksArray} />);
      expect(screen.getByText((_content, element) => {
        return element?.textContent === '8 tracks • 2023';
      })).toBeInTheDocument();
    });

    it('handles singular track count', () => {
      const singleTrackAlbum = { ...mockAlbum, totalTracks: 1 };
      render(<AlbumCard {...defaultProps} album={singleTrackAlbum} />);
      expect(screen.getByText(/1 track/)).toBeInTheDocument();
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });

    it('handles zero tracks', () => {
      const noTracksAlbum = { ...mockAlbum, totalTracks: 0, tracks: [] };
      render(<AlbumCard {...defaultProps} album={noTracksAlbum} />);
      expect(screen.getByText(/2023/)).toBeInTheDocument();
      expect(screen.queryByText(/tracks/)).not.toBeInTheDocument();
    });

    it('displays year only when no track count', () => {
      const albumWithoutTracks = {
        ...mockAlbum,
        totalTracks: undefined,
        tracks: [],
      };
      render(<AlbumCard {...defaultProps} album={albumWithoutTracks} />);
      expect(screen.getByText(/2023/)).toBeInTheDocument();
      expect(screen.queryByText(/tracks/)).not.toBeInTheDocument();
    });

    it('handles missing year', () => {
      const albumWithoutYear = { ...mockAlbum, year: undefined };
      render(<AlbumCard {...defaultProps} album={albumWithoutYear} />);
      expect(screen.getByText(/12 tracks/)).toBeInTheDocument();
      expect(screen.queryByText(/•/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<AlbumCard {...defaultProps} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', 'Select Test Album by Test Artist, 12 tracks');
      
      const checkbox = screen.getByLabelText('Select Test Album');
      expect(checkbox).toBeInTheDocument();
    });

    it('has proper title attributes for truncated text', () => {
      render(<AlbumCard {...defaultProps} />);

      const title = screen.getByText('Test Album');
      expect(title).toHaveAttribute('title', 'Test Album');

      const artist = screen.getByText('Test Artist');
      expect(artist).toHaveAttribute('title', 'Test Artist');
    });

    it('has screen reader only checkbox', () => {
      render(<AlbumCard {...defaultProps} />);

      const hiddenCheckbox = screen.getByLabelText('Select Test Album');
      expect(hiddenCheckbox).toHaveClass('sr-only');
    });

    it('updates aria-pressed when selection changes', () => {
      const { rerender } = render(<AlbumCard {...defaultProps} isSelected={false} />);
      
      let card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'false');

      rerender(<AlbumCard {...defaultProps} isSelected={true} />);
      card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Visual States', () => {
    it('applies selection overlay when selected', () => {
      render(<AlbumCard {...defaultProps} isSelected={true} />);

      // Check for selection overlay with blue background
      const card = screen.getByRole('button');
      const overlay = card.querySelector('div');
      expect(overlay).toHaveClass('bg-blue-500', 'bg-opacity-20', 'border-blue-500');
    });

    it('shows selection indicator in image overlay when selected', () => {
      render(<AlbumCard {...defaultProps} isSelected={true} />);

      // Should have selection indicator overlay on the image
      expect(screen.getAllByTestId('check-icon-solid')).toHaveLength(2);
    });

    it('applies hover styles when not selected', () => {
      render(<AlbumCard {...defaultProps} isSelected={false} />);

      const card = screen.getByRole('button');
      expect(card).toHaveClass('group');
      
      // The hover styles are applied via group-hover classes
      const overlay = card.querySelector('div');
      expect(overlay).toHaveClass('group-hover:bg-gray-100');
    });
  });
});
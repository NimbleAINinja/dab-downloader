import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DownloadSkeleton } from '../DownloadSkeleton';

describe('DownloadSkeleton', () => {
  it('should render without crashing', () => {
    render(<DownloadSkeleton />);
    
    // Should render skeleton elements
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<DownloadSkeleton />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading downloads');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });

  it('should render multiple skeleton items by default', () => {
    render(<DownloadSkeleton />);
    
    // Should render multiple skeleton items for download list (default 3)
    const skeletonItems = screen.getAllByRole('presentation', { hidden: true });
    expect(skeletonItems).toHaveLength(3);
  });

  it('should render custom number of skeleton items', () => {
    render(<DownloadSkeleton count={5} />);
    
    const skeletonItems = screen.getAllByRole('presentation', { hidden: true });
    expect(skeletonItems).toHaveLength(5);
  });

  it('should have animate-pulse class for loading animation', () => {
    render(<DownloadSkeleton />);
    
    const skeletonItems = screen.getAllByRole('presentation', { hidden: true });
    skeletonItems.forEach(item => {
      expect(item).toHaveClass('animate-pulse');
    });
  });

  it('should render skeleton elements for download progress', () => {
    render(<DownloadSkeleton />);
    
    // Should have skeleton elements that represent download progress bars
    const progressBars = screen.getByRole('status').querySelectorAll('.w-full.bg-gray-200.rounded-full.h-2');
    expect(progressBars.length).toBe(3); // One per download item
  });

  it('should render skeleton elements for album info', () => {
    render(<DownloadSkeleton />);
    
    // Should have skeleton elements for album title and artist
    const albumInfoContainers = screen.getByRole('status').querySelectorAll('.flex-1.space-y-2');
    expect(albumInfoContainers.length).toBe(3); // One per download item
  });

  it('should apply custom className', () => {
    const customClass = 'custom-skeleton-class';
    render(<DownloadSkeleton className={customClass} />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass(customClass);
  });

  it('should render with proper spacing and layout', () => {
    render(<DownloadSkeleton />);
    
    const skeleton = screen.getByRole('status');
    
    // Should have proper spacing classes
    expect(skeleton).toHaveClass('space-y-4');
  });

  it('should render skeleton buttons for actions', () => {
    render(<DownloadSkeleton />);
    
    // Should have skeleton elements for cancel/retry buttons
    const actionButtons = screen.getByRole('status').querySelectorAll('.w-6.h-6');
    expect(actionButtons.length).toBe(6); // 2 per download item (3 items)
  });

  it('should handle zero count gracefully', () => {
    render(<DownloadSkeleton count={0} />);
    
    // Should not render any skeleton items
    const skeletonItems = screen.queryAllByRole('presentation');
    expect(skeletonItems).toHaveLength(0);
  });

  it('should render header when showHeader is true', () => {
    render(<DownloadSkeleton showHeader={true} />);
    
    // Should render header skeleton
    const headerElements = screen.getByRole('status').querySelectorAll('.h-6');
    expect(headerElements.length).toBeGreaterThan(0);
  });

  it('should not render header when showHeader is false', () => {
    render(<DownloadSkeleton showHeader={false} />);
    
    // Should not render header skeleton - check for header container
    const headerContainer = screen.getByRole('status').querySelector('.flex.items-center.justify-between.mb-6');
    expect(headerContainer).toBeNull();
  });

  it('should have screen reader announcement', () => {
    render(<DownloadSkeleton />);
    
    // Should have screen reader text
    expect(screen.getByText('Loading download progress, please wait...')).toBeInTheDocument();
  });

  it('should render different progress bar widths for variety', () => {
    render(<DownloadSkeleton count={3} />);
    
    // Should have different progress widths to simulate real progress variety
    const progressBars = screen.getByRole('status').querySelectorAll('.animate-pulse-slow');
    expect(progressBars.length).toBe(3);
    
    // Each should have different width styles
    const widths = Array.from(progressBars).map(bar => 
      (bar as HTMLElement).style.width
    );
    const uniqueWidths = new Set(widths);
    expect(uniqueWidths.size).toBe(3); // All different widths
  });
});
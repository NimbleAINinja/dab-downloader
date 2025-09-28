import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AlbumGridSkeleton } from '../AlbumGridSkeleton';

describe('AlbumGridSkeleton', () => {
  it('renders with default props', () => {
    render(<AlbumGridSkeleton />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-label', 'Loading albums');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
    
    // Should render default count of 12 skeleton items
    const { container } = render(<AlbumGridSkeleton />);
    const skeletonItems = container.querySelectorAll('[role="presentation"]');
    expect(skeletonItems).toHaveLength(12);
  });

  it('renders custom count of skeleton items', () => {
    const { container } = render(<AlbumGridSkeleton count={6} />);
    
    const skeletonItems = container.querySelectorAll('[role="presentation"]');
    expect(skeletonItems).toHaveLength(6);
  });

  it('applies size classes correctly', () => {
    const { rerender, container } = render(<AlbumGridSkeleton size="small" count={1} />);
    let skeletonItem = container.querySelector('[role="presentation"]') as HTMLElement;
    expect(skeletonItem).toHaveClass('w-32');

    rerender(<AlbumGridSkeleton size="medium" count={1} />);
    skeletonItem = container.querySelector('[role="presentation"]') as HTMLElement;
    expect(skeletonItem).toHaveClass('w-48');

    rerender(<AlbumGridSkeleton size="large" count={1} />);
    skeletonItem = container.querySelector('[role="presentation"]') as HTMLElement;
    expect(skeletonItem).toHaveClass('w-64');
  });

  it('shows select all button skeleton when enabled', () => {
    render(<AlbumGridSkeleton showSelectAll={true} />);
    
    // Should have skeleton elements for select all button
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('hides select all button skeleton when disabled', () => {
    render(<AlbumGridSkeleton showSelectAll={false} />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-skeleton-class';
    render(<AlbumGridSkeleton className={customClass} />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass(customClass);
  });

  it('has proper accessibility attributes', () => {
    render(<AlbumGridSkeleton />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading albums');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
    
    // Screen reader announcement
    expect(screen.getByText('Loading album grid, please wait...')).toHaveClass('sr-only');
  });

  it('skeleton items have proper aria attributes', () => {
    const { container } = render(<AlbumGridSkeleton count={2} />);
    
    const skeletonItems = container.querySelectorAll('[role="presentation"]');
    skeletonItems.forEach(item => {
      expect(item).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
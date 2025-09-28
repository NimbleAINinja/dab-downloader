import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SearchSkeleton } from '../SearchSkeleton';

describe('SearchSkeleton', () => {
  it('should render without crashing', () => {
    render(<SearchSkeleton />);
    
    // Should render skeleton elements
    const skeleton = screen.getByRole('status');
    expect(skeleton).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<SearchSkeleton />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading search results');
    expect(skeleton).toHaveAttribute('aria-live', 'polite');
  });

  it('should have animate-pulse class for loading animation', () => {
    render(<SearchSkeleton />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render skeleton for search results header', () => {
    render(<SearchSkeleton />);
    
    // Should have skeleton elements for header
    const headerElements = screen.getByRole('status').querySelectorAll('.h-6, .h-4');
    expect(headerElements.length).toBeGreaterThan(0);
  });

  it('should render multiple result skeletons by default', () => {
    render(<SearchSkeleton />);
    
    // Should render 3 artist result skeletons by default
    const resultContainers = screen.getByRole('status').querySelectorAll('.flex.items-center.space-x-3');
    expect(resultContainers.length).toBe(3);
  });

  it('should apply custom className', () => {
    const customClass = 'custom-search-skeleton';
    render(<SearchSkeleton className={customClass} />);
    
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveClass(customClass);
  });

  it('should render skeleton for artist images', () => {
    render(<SearchSkeleton />);
    
    // Should have skeleton elements for artist profile images (rounded-full)
    const artistImages = screen.getByRole('status').querySelectorAll('.rounded-full');
    expect(artistImages.length).toBe(3); // One per result
  });

  it('should render skeleton for artist info', () => {
    render(<SearchSkeleton />);
    
    // Should have skeleton elements for artist names and info
    const infoElements = screen.getByRole('status').querySelectorAll('.space-y-2');
    expect(infoElements.length).toBe(3); // One per result
  });

  it('should render skeleton for action buttons', () => {
    render(<SearchSkeleton />);
    
    // Should have skeleton elements for action buttons
    const actionButtons = screen.getByRole('status').querySelectorAll('.w-20.h-8');
    expect(actionButtons.length).toBe(3); // One per result
  });

  it('should have screen reader announcement', () => {
    render(<SearchSkeleton />);
    
    // Should have screen reader text
    expect(screen.getByText('Searching for artists, please wait...')).toBeInTheDocument();
  });

  it('should render with proper spacing and layout', () => {
    render(<SearchSkeleton />);
    
    // Should have proper spacing classes
    const spacingContainer = screen.getByRole('status').querySelector('.space-y-3');
    expect(spacingContainer).toBeInTheDocument();
  });

  it('should render different skeleton widths for variety', () => {
    render(<SearchSkeleton />);
    
    // Should have different widths to simulate real content variety
    const skeleton = screen.getByRole('status');
    const widthElements = skeleton.querySelectorAll('.w-3\\/4, .w-1\\/2, .w-48, .w-32');
    expect(widthElements.length).toBeGreaterThan(0);
  });
});
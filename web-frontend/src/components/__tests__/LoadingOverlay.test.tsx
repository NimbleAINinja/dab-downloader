import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  const TestContent = () => <div data-testid="test-content">Test Content</div>;

  it('renders children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <TestContent />
      </LoadingOverlay>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows loading state when loading with overlay', () => {
    render(
      <LoadingOverlay isLoading={true} overlay={true}>
        <TestContent />
      </LoadingOverlay>
    );
    
    // Content should still be present but with reduced opacity
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    
    // Loading overlay should be present
    const loadingStatuses = screen.getAllByRole('status');
    const overlayStatus = loadingStatuses.find(status => 
      status.classList.contains('absolute')
    );
    expect(overlayStatus).toBeInTheDocument();
    expect(overlayStatus).toHaveAttribute('aria-label', 'Loading...');
  });

  it('shows inline loading state when overlay is false', () => {
    render(
      <LoadingOverlay isLoading={true} overlay={false}>
        <TestContent />
      </LoadingOverlay>
    );
    
    // Content should not be present in inline mode
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    
    // Loading state should be present
    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus).toBeInTheDocument();
  });

  it('applies custom message', () => {
    const customMessage = 'Loading albums...';
    render(
      <LoadingOverlay isLoading={true} message={customMessage}>
        <TestContent />
      </LoadingOverlay>
    );
    
    const loadingStatuses = screen.getAllByRole('status');
    const overlayStatus = loadingStatuses.find(status => 
      status.classList.contains('absolute')
    );
    expect(overlayStatus).toHaveAttribute('aria-label', customMessage);
    expect(screen.getAllByText(customMessage).length).toBeGreaterThan(0);
  });

  it('applies blur effect when specified', () => {
    const { container } = render(
      <LoadingOverlay isLoading={true} blur={true}>
        <TestContent />
      </LoadingOverlay>
    );
    
    const contentDiv = container.querySelector('.filter.blur-sm');
    expect(contentDiv).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-overlay-class';
    const { container } = render(
      <LoadingOverlay isLoading={false} className={customClass}>
        <TestContent />
      </LoadingOverlay>
    );
    
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass(customClass);
  });

  it('uses correct spinner size', () => {
    render(
      <LoadingOverlay isLoading={true} spinnerSize="large">
        <TestContent />
      </LoadingOverlay>
    );
    
    const loadingStatuses = screen.getAllByRole('status');
    expect(loadingStatuses.length).toBeGreaterThan(0);
  });

  it('has proper accessibility attributes', () => {
    render(
      <LoadingOverlay isLoading={true} message="Custom loading">
        <TestContent />
      </LoadingOverlay>
    );
    
    const loadingStatuses = screen.getAllByRole('status');
    const overlayStatus = loadingStatuses.find(status => 
      status.getAttribute('aria-label') === 'Custom loading' && 
      status.classList.contains('absolute')
    );
    expect(overlayStatus).toHaveAttribute('aria-label', 'Custom loading');
    expect(overlayStatus).toHaveAttribute('aria-live', 'polite');
  });
});
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Toast from '../Toast';

describe('Toast', () => {
  const defaultProps = {
    id: 'test-toast',
    type: 'info' as const,
    title: 'Test Title',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toast with title', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders toast with message', () => {
    render(<Toast {...defaultProps} message="Test message" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders success toast with correct styling', () => {
    render(<Toast {...defaultProps} type="success" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-green-50', 'border-green-200');
  });

  it('renders error toast with correct styling', () => {
    render(<Toast {...defaultProps} type="error" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-50', 'border-red-200');
  });

  it('renders warning toast with correct styling', () => {
    render(<Toast {...defaultProps} type="warning" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  it('renders info toast with correct styling', () => {
    render(<Toast {...defaultProps} type="info" />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Toast {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('Close notification'));
    
    // Wait for the exit animation to complete
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 500 });
  });

  it('renders action button when provided', () => {
    const action = {
      label: 'Retry',
      onClick: vi.fn(),
    };

    render(<Toast {...defaultProps} action={action} />);
    
    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(action.onClick).toHaveBeenCalled();
  });

  it('auto-closes after duration', async () => {
    const onClose = vi.fn();
    render(<Toast {...defaultProps} onClose={onClose} duration={100} />);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 500 });
  });

  it('does not auto-close when duration is 0', async () => {
    const onClose = vi.fn();
    render(<Toast {...defaultProps} onClose={onClose} duration={0} />);
    
    // Wait a bit to ensure it doesn't auto-close
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    
    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
  });

  it('applies entrance animation', () => {
    render(<Toast {...defaultProps} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('transform', 'transition-all', 'duration-300');
  });
});
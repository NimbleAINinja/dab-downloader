import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ToastContainer from '../ToastContainer';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import type { ToastProps } from '../Toast';

// Mock component to trigger toast actions
const ToastTrigger = () => {
  const { showSuccess, showError, showWarning, hideToast, clearAllToasts } = useToast();
  let toastId: string;

  return (
    <div>
      <button
        onClick={() => {
          toastId = showSuccess('Success', 'Test success message');
        }}
      >
        Add Success Toast
      </button>
      <button
        onClick={() => {
          toastId = showError('Error', 'Test error message');
        }}
      >
        Add Error Toast
      </button>
      <button
        onClick={() => {
          toastId = showWarning('Warning', 'Test warning message', { duration: 1000 });
        }}
      >
        Add Warning Toast
      </button>
      <button
        onClick={() => hideToast(toastId)}
      >
        Remove Toast
      </button>
      <button
        onClick={() => clearAllToasts()}
      >
        Clear All
      </button>
    </div>
  );
};

const ProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
  </ToastProvider>
);

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should render without crashing', () => {
    render(
      <ProviderWrapper>
        <div>Test content</div>
      </ProviderWrapper>
    );

    // Should render test content
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should display success toast when added', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    const addButton = screen.getByText('Add Success Toast');
    
    act(() => {
      addButton.click();
    });

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Test success message')).toBeInTheDocument();
  });

  it('should display error toast when added', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    const addButton = screen.getByText('Add Error Toast');
    
    act(() => {
      addButton.click();
    });

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should display warning toast when added', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    const addButton = screen.getByText('Add Warning Toast');
    
    act(() => {
      addButton.click();
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Test warning message')).toBeInTheDocument();
  });

  it('should display multiple toasts', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    act(() => {
      screen.getByText('Add Error Toast').click();
    });

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should remove toast when remove button is clicked', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    // Add a toast
    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    expect(screen.getByText('Success')).toBeInTheDocument();

    // Remove the toast
    act(() => {
      screen.getByText('Remove Toast').click();
    });

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('should clear all toasts when clear all is clicked', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    // Add multiple toasts
    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    act(() => {
      screen.getByText('Add Error Toast').click();
    });

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();

    // Clear all toasts
    act(() => {
      screen.getByText('Clear All').click();
    });

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('should auto-close toasts with autoClose enabled', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    // Add a warning toast with 1 second auto-close
    act(() => {
      screen.getByText('Add Warning Toast').click();
    });

    expect(screen.getByText('Warning')).toBeInTheDocument();

    // Fast-forward time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Warning')).not.toBeInTheDocument();
  });

  it('should not auto-close toasts with autoClose disabled', () => {
    render(
      <ProviderWrapper>
        <ToastTrigger />
      </ProviderWrapper>
    );

    // Add an error toast with autoClose disabled
    act(() => {
      screen.getByText('Add Error Toast').click();
    });

    expect(screen.getByText('Error')).toBeInTheDocument();

    // Fast-forward time by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Toast should still be visible
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should handle toast removal via close button', () => {
    render(
      <TestWrapper>
        <ToastTrigger />
      </TestWrapper>
    );

    // Add a toast
    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    expect(screen.getByText('Success')).toBeInTheDocument();

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    
    act(() => {
      closeButton.click();
    });

    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });

  it('should position toasts correctly', () => {
    render(
      <TestWrapper>
        <ToastTrigger />
      </TestWrapper>
    );

    const container = screen.getByRole('region', { name: /notifications/i });
    
    // Check that container has correct positioning classes
    expect(container).toHaveClass('fixed', 'top-4', 'right-4', 'z-50');
  });

  it('should limit the number of visible toasts', () => {
    render(
      <TestWrapper>
        <ToastTrigger />
      </TestWrapper>
    );

    // Add multiple toasts quickly
    act(() => {
      for (let i = 0; i < 10; i++) {
        screen.getByText('Add Success Toast').click();
      }
    });

    // Should limit to a reasonable number (e.g., 5)
    const toasts = screen.getAllByText('Success');
    expect(toasts.length).toBeLessThanOrEqual(5);
  });

  it('should handle keyboard navigation', () => {
    render(
      <TestWrapper>
        <ToastTrigger />
      </TestWrapper>
    );

    // Add a toast
    act(() => {
      screen.getByText('Add Success Toast').click();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    
    // Should be focusable
    expect(closeButton).toHaveAttribute('tabIndex', '0');
  });

  it('should have proper ARIA attributes', () => {
    render(
      <TestWrapper>
        <ToastTrigger />
      </TestWrapper>
    );

    const container = screen.getByRole('region', { name: /notifications/i });
    
    expect(container).toHaveAttribute('aria-live', 'polite');
    expect(container).toHaveAttribute('aria-label', 'Notifications');
  });

  it('should handle rapid toast additions and removals', () => {
    render(
      <TestWrapper>
        <ToastTrigger />
      </TestWrapper>
    );

    // Rapidly add and remove toasts
    act(() => {
      screen.getByText('Add Success Toast').click();
      screen.getByText('Add Error Toast').click();
      screen.getByText('Remove Toast').click();
      screen.getByText('Add Warning Toast').click();
    });

    // Should handle without errors
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.queryByText('Success')).not.toBeInTheDocument();
  });
});
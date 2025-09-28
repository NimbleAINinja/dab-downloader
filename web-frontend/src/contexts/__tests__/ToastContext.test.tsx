import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from '../ToastContext';

// Test component that uses the toast context
const TestComponent = () => {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.showSuccess('Success!', 'Operation completed')}>
        Show Success
      </button>
      <button onClick={() => toast.showError('Error!', 'Something went wrong')}>
        Show Error
      </button>
      <button onClick={() => toast.showWarning('Warning!', 'Be careful')}>
        Show Warning
      </button>
      <button onClick={() => toast.showInfo('Info!', 'Just so you know')}>
        Show Info
      </button>
      <button onClick={() => toast.clearAllToasts()}>
        Clear All
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  it('provides toast functions to children', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeInTheDocument();
    expect(screen.getByText('Show Error')).toBeInTheDocument();
    expect(screen.getByText('Show Warning')).toBeInTheDocument();
    expect(screen.getByText('Show Info')).toBeInTheDocument();
  });

  it('shows success toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('shows error toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));

    expect(screen.getByText('Error!')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows warning toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Warning'));

    expect(screen.getByText('Warning!')).toBeInTheDocument();
    expect(screen.getByText('Be careful')).toBeInTheDocument();
  });

  it('shows info toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));

    expect(screen.getByText('Info!')).toBeInTheDocument();
    expect(screen.getByText('Just so you know')).toBeInTheDocument();
  });

  it('clears all toasts', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show multiple toasts
    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();

    // Clear all toasts
    fireEvent.click(screen.getByText('Clear All'));

    expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    expect(screen.queryByText('Error!')).not.toBeInTheDocument();
  });

  it('limits number of toasts based on maxToasts prop', () => {
    const TestComponentWithManyToasts = () => {
      const toast = useToast();

      return (
        <div>
          <button onClick={() => {
            for (let i = 0; i < 10; i++) {
              toast.showInfo(`Toast ${i}`, `Message ${i}`);
            }
          }}>
            Show Many Toasts
          </button>
        </div>
      );
    };

    render(
      <ToastProvider maxToasts={3}>
        <TestComponentWithManyToasts />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Many Toasts'));

    // Should only show the last 3 toasts
    expect(screen.getByText('Toast 7')).toBeInTheDocument();
    expect(screen.getByText('Toast 8')).toBeInTheDocument();
    expect(screen.getByText('Toast 9')).toBeInTheDocument();
    expect(screen.queryByText('Toast 0')).not.toBeInTheDocument();
  });

  it('throws error when useToast is used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useToast(); // This should throw an error
      return <div>Should not render</div>;
    };

    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useToast must be used within a ToastProvider');

    console.error = originalConsoleError;
  });

  it('returns toast ID when showing toast', () => {
    const TestComponentWithId = () => {
      const toast = useToast();
      const [toastId, setToastId] = React.useState<string>('');

      return (
        <div>
          <button onClick={() => {
            const id = toast.showSuccess('Success!');
            setToastId(id);
          }}>
            Show Toast
          </button>
          <div data-testid="toast-id">{toastId}</div>
        </div>
      );
    };

    render(
      <ToastProvider>
        <TestComponentWithId />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));

    const toastId = screen.getByTestId('toast-id').textContent;
    expect(toastId).toMatch(/^toast-\d+-[a-z0-9]+$/);
  });
});
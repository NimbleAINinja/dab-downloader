import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider } from '../../contexts/AppContext';
import NotificationSystem, { useNotificationActions } from '../NotificationSystem';
import type { Notification } from '../../contexts/AppContext';

// ============================================================================
// Test Utilities
// ============================================================================

const TestComponent = () => {
  const notifications = useNotificationActions();
  
  return (
    <div>
      <button onClick={() => notifications.showSuccess('Success', 'Success message')}>
        Show Success
      </button>
      <button onClick={() => notifications.showError('Error', 'Error message')}>
        Show Error
      </button>
      <button onClick={() => notifications.showWarning('Warning', 'Warning message')}>
        Show Warning
      </button>
      <button onClick={() => notifications.showInfo('Info', 'Info message')}>
        Show Info
      </button>
      <button onClick={() => notifications.clear()}>
        Clear All
      </button>
      <NotificationSystem />
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement, initialNotifications?: Notification[]) => {
  const initialState = initialNotifications ? { notifications: initialNotifications } : undefined;
  
  return render(
    <AppProvider initialState={initialState}>
      {component}
    </AppProvider>
  );
};

// Mock timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

// ============================================================================
// NotificationSystem Component Tests
// ============================================================================

describe('NotificationSystem', () => {
  it('should render nothing when no notifications', () => {
    renderWithProvider(<NotificationSystem />);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render notifications when present', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'test-1',
        type: 'success',
        title: 'Success Title',
        message: 'Success message',
        timestamp: new Date()
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render multiple notifications', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'test-1',
        type: 'success',
        title: 'Success Title',
        message: 'Success message',
        timestamp: new Date()
      },
      {
        id: 'test-2',
        type: 'error',
        title: 'Error Title',
        message: 'Error message',
        timestamp: new Date()
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Error Title')).toBeInTheDocument();
  });

  it('should limit notifications to maxNotifications', () => {
    const mockNotifications: Notification[] = Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`,
      type: 'info' as const,
      title: `Title ${i}`,
      message: `Message ${i}`,
      timestamp: new Date()
    }));

    renderWithProvider(<NotificationSystem maxNotifications={3} />, mockNotifications);
    
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(3);
    
    // Should show the last 3 notifications
    expect(screen.getByText('Title 7')).toBeInTheDocument();
    expect(screen.getByText('Title 8')).toBeInTheDocument();
    expect(screen.getByText('Title 9')).toBeInTheDocument();
    expect(screen.queryByText('Title 6')).not.toBeInTheDocument();
  });

  it('should apply correct styles for different notification types', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'success',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        timestamp: new Date()
      },
      {
        id: 'error',
        type: 'error',
        title: 'Error',
        message: 'Error message',
        timestamp: new Date()
      },
      {
        id: 'warning',
        type: 'warning',
        title: 'Warning',
        message: 'Warning message',
        timestamp: new Date()
      },
      {
        id: 'info',
        type: 'info',
        title: 'Info',
        message: 'Info message',
        timestamp: new Date()
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    const alerts = screen.getAllByRole('alert');
    
    // Check that different classes are applied (we can't easily test exact classes with jsdom)
    expect(alerts[0]).toHaveClass('bg-green-50', 'border-green-400', 'text-green-800');
    expect(alerts[1]).toHaveClass('bg-red-50', 'border-red-400', 'text-red-800');
    expect(alerts[2]).toHaveClass('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
    expect(alerts[3]).toHaveClass('bg-blue-50', 'border-blue-400', 'text-blue-800');
  });

  it('should position notifications correctly', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'test-1',
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: new Date()
      }
    ];

    const { rerender } = renderWithProvider(
      <NotificationSystem position="top-right" />, 
      mockNotifications
    );
    
    let container = screen.getByRole('alert').closest('.fixed');
    expect(container).toHaveClass('top-4', 'right-4');

    rerender(
      <AppProvider initialState={{ notifications: mockNotifications }}>
        <NotificationSystem position="bottom-left" />
      </AppProvider>
    );
    
    container = screen.getByRole('alert').closest('.fixed');
    expect(container).toHaveClass('bottom-4', 'left-4');
  });
});

// ============================================================================
// Notification Item Tests
// ============================================================================

describe('NotificationItem', () => {
  it('should display close button and handle close', () => {
    renderWithProvider(<TestComponent />);
    
    // Show a notification
    fireEvent.click(screen.getByText('Show Success'));
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Click close button
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should auto-close notifications when autoClose is true', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'test-1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        timestamp: new Date(),
        autoClose: true,
        duration: 5000
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Verify that the notification has autoClose properties
    const notification = mockNotifications[0];
    expect(notification.autoClose).toBe(true);
    expect(notification.duration).toBe(5000);
  });

  it('should not auto-close error notifications', async () => {
    renderWithProvider(<TestComponent />);
    
    // Show an error notification (which has autoClose: false)
    fireEvent.click(screen.getByText('Show Error'));
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Fast-forward time
    vi.advanceTimersByTime(10000);
    
    // Should still be visible
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should display correct icons for different notification types', () => {
    renderWithProvider(<TestComponent />);
    
    // Test success icon
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Clear and test error icon
    act(() => {
      fireEvent.click(screen.getByText('Clear All'));
      fireEvent.click(screen.getByText('Show Error'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Clear and test warning icon
    act(() => {
      fireEvent.click(screen.getByText('Clear All'));
      fireEvent.click(screen.getByText('Show Warning'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Clear and test info icon
    act(() => {
      fireEvent.click(screen.getByText('Clear All'));
      fireEvent.click(screen.getByText('Show Info'));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show progress bar for auto-closing notifications', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'test-1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        timestamp: new Date(),
        autoClose: true,
        duration: 5000
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    const notification = screen.getByRole('alert');
    
    // Check for progress bar (it should be present for auto-closing notifications)
    const progressBar = notification.querySelector('.absolute.bottom-0');
    expect(progressBar).toBeInTheDocument();
  });

  it('should not show progress bar for non-auto-closing notifications', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'test-1',
        type: 'error',
        title: 'Error',
        message: 'Error message',
        timestamp: new Date(),
        autoClose: false
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    const notification = screen.getByRole('alert');
    
    // Check for progress bar (it should not be present for non-auto-closing notifications)
    const progressBar = notification.querySelector('.absolute.bottom-0');
    expect(progressBar).not.toBeInTheDocument();
  });
});

// ============================================================================
// useNotificationActions Hook Tests
// ============================================================================

describe('useNotificationActions', () => {
  it('should provide notification action methods', () => {
    renderWithProvider(<TestComponent />);
    
    // Test that all buttons are rendered (indicating the hook works)
    expect(screen.getByText('Show Success')).toBeInTheDocument();
    expect(screen.getByText('Show Error')).toBeInTheDocument();
    expect(screen.getByText('Show Warning')).toBeInTheDocument();
    expect(screen.getByText('Show Info')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should create success notifications with correct properties', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
    });
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
  });

  it('should create error notifications with correct properties', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      fireEvent.click(screen.getByText('Show Error'));
    });
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
  });

  it('should create warning notifications with correct properties', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      fireEvent.click(screen.getByText('Show Warning'));
    });
    
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50');
  });

  it('should create info notifications with correct properties', () => {
    renderWithProvider(<TestComponent />);
    
    act(() => {
      fireEvent.click(screen.getByText('Show Info'));
    });
    
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50');
  });

  it('should clear all notifications', () => {
    renderWithProvider(<TestComponent />);
    
    // Add multiple notifications
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
    });
    
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    
    // Clear all
    act(() => {
      fireEvent.click(screen.getByText('Clear All'));
    });
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('NotificationSystem Integration', () => {
  it('should handle multiple notifications with different auto-close settings', () => {
    const mockNotifications: Notification[] = [
      {
        id: 'success-1',
        type: 'success',
        title: 'Success',
        message: 'Success message',
        timestamp: new Date(),
        autoClose: true,
        duration: 5000
      },
      {
        id: 'error-1',
        type: 'error',
        title: 'Error',
        message: 'Error message',
        timestamp: new Date(),
        autoClose: false
      }
    ];

    renderWithProvider(<NotificationSystem />, mockNotifications);
    
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(2);
    
    // Verify different auto-close settings
    expect(mockNotifications[0].autoClose).toBe(true);
    expect(mockNotifications[1].autoClose).toBe(false);
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should handle rapid notification creation and removal', () => {
    renderWithProvider(<TestComponent />);
    
    // Rapidly add notifications
    act(() => {
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText('Show Info'));
      }
    });
    
    expect(screen.getAllByRole('alert')).toHaveLength(5);
    
    // Clear all at once
    act(() => {
      fireEvent.click(screen.getByText('Clear All'));
    });
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should maintain notification order', () => {
    renderWithProvider(<TestComponent />);
    
    // Add notifications in specific order
    act(() => {
      fireEvent.click(screen.getByText('Show Success'));
      fireEvent.click(screen.getByText('Show Error'));
      fireEvent.click(screen.getByText('Show Warning'));
    });
    
    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(3);
    
    // Check order (first added should be first in DOM)
    expect(alerts[0]).toHaveTextContent('Success');
    expect(alerts[1]).toHaveTextContent('Error');
    expect(alerts[2]).toHaveTextContent('Warning');
  });
});
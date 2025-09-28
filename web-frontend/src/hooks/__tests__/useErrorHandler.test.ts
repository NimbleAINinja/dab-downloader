import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorHandler } from '../useErrorHandler';
import { useToast } from '../../contexts/ToastContext';

// Mock the toast context
vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

const mockToast = {
  showError: vi.fn(),
  showInfo: vi.fn(),
  clearAllToasts: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
  showToast: vi.fn(),
  hideToast: vi.fn(),
};

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue(mockToast);
  });

  it('handles API errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const apiError = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' },
        statusText: 'Internal Server Error',
      },
      config: { url: '/api/test', method: 'GET' },
    };

    const errorState = result.current.handleError(apiError, 'test context');

    expect(errorState.type).toBe('api');
    expect(errorState.message).toBe('Internal Server Error');
    expect(errorState.retryable).toBe(true);
    expect(mockToast.showError).toHaveBeenCalled();
  });

  it('handles network errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const networkError = {
      request: {},
      message: 'Network Error',
      config: { url: '/api/test', method: 'GET' },
    };

    const errorState = result.current.handleError(networkError, 'test context');

    expect(errorState.type).toBe('network');
    expect(errorState.retryable).toBe(true);
    expect(mockToast.showError).toHaveBeenCalled();
  });

  it('handles async operations with error handling', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const successOperation = vi.fn().mockResolvedValue('success');
    const failingOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));

    // Test successful operation
    const successResult = await result.current.handleAsyncError(successOperation, 'success test');
    expect(successResult).toBe('success');
    expect(mockToast.showError).not.toHaveBeenCalled();

    // Test failing operation
    const failResult = await result.current.handleAsyncError(failingOperation, 'fail test');
    expect(failResult).toBeNull();
    expect(mockToast.showError).toHaveBeenCalled();
  });

  it('retries operations with proper configuration', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');

    const retryResult = await result.current.retryOperation(
      operation,
      'retry test',
      { maxRetries: 3, baseDelay: 10 }
    );

    expect(retryResult).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(mockToast.showInfo).toHaveBeenCalledTimes(2); // Two retry attempts
  });

  it('clears errors when requested', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.clearErrors();
    });

    expect(mockToast.clearAllToasts).toHaveBeenCalled();
  });

  it('respects showToast option', () => {
    const { result } = renderHook(() => useErrorHandler({ showToast: false }));

    const error = new Error('Test error');
    result.current.handleError(error, 'test context');

    expect(mockToast.showError).not.toHaveBeenCalled();
  });

  it('handles retryable errors with action button', () => {
    const { result } = renderHook(() => useErrorHandler());

    const retryableError = {
      response: {
        status: 500,
        data: { message: 'Server Error' },
      },
      config: { url: '/api/test' },
    };

    result.current.handleError(retryableError, 'test context');

    expect(mockToast.showError).toHaveBeenCalledWith(
      'Server error. Please try again later.',
      undefined,
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Retry',
          onClick: expect.any(Function),
        }),
      })
    );
  });

  it('handles non-retryable errors without action button', () => {
    const { result } = renderHook(() => useErrorHandler());

    const nonRetryableError = {
      response: {
        status: 400,
        data: { message: 'Bad Request' },
      },
      config: { url: '/api/test' },
    };

    result.current.handleError(nonRetryableError, 'test context');

    expect(mockToast.showError).toHaveBeenCalledWith(
      'Bad Request',
      undefined,
      expect.objectContaining({
        action: undefined,
      })
    );
  });
});
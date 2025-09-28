import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  retryOperation,
  withRetry,
  retryWithCondition,
  retryNetworkErrors,
  retryWithTimeout,
  CircuitBreaker,
  withCircuitBreaker,
  DEFAULT_RETRY_CONFIG,
} from '../retryUtils';

describe('retryUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('retryOperation', () => {
    it('succeeds on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const result = await retryOperation(operation, { maxRetries: 3, baseDelay: 10 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(retryOperation(operation, { maxRetries: 2, baseDelay: 10 }))
        .rejects.toThrow('Always fails');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('calls onRetry callback', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const onRetry = vi.fn();

      await retryOperation(operation, {
        maxRetries: 2,
        baseDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'unknown' }),
        0,
        expect.any(Number)
      );
    });

    it('respects custom shouldRetry function', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Custom error'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(retryOperation(operation, { shouldRetry, maxRetries: 3 }))
        .rejects.toThrow('Custom error');

      expect(operation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('withRetry', () => {
    it('creates a retry wrapper function', async () => {
      const originalFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const retryFn = withRetry(originalFn, { maxRetries: 2, baseDelay: 10 });

      const result = await retryFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('retryWithCondition', () => {
    it('retries based on custom condition', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Retryable error'))
        .mockRejectedValueOnce(new Error('Non-retryable error'))
        .mockResolvedValueOnce('success');

      const shouldRetry = vi.fn()
        .mockReturnValueOnce(true)  // First error is retryable
        .mockReturnValueOnce(false); // Second error is not retryable

      await expect(retryWithCondition(operation, shouldRetry, 3, 10))
        .rejects.toThrow('Non-retryable error');

      expect(operation).toHaveBeenCalledTimes(2);
      expect(shouldRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryNetworkErrors', () => {
    it('retries only network errors', async () => {
      const networkError = {
        request: {},
        message: 'Network Error',
        config: { url: '/api/test' },
      };

      const operation = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const result = await retryNetworkErrors(operation, 2);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryWithTimeout', () => {
    it('times out long-running operations', async () => {
      const operation = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(retryWithTimeout(operation, 100, { maxRetries: 1 }))
        .rejects.toThrow('Operation timed out after 100ms');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('succeeds within timeout', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryWithTimeout(operation, 1000);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('CircuitBreaker', () => {
    it('allows operations when circuit is closed', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const circuitBreaker = new CircuitBreaker(operation, {
        failureThreshold: 3,
        recoveryTimeout: 1000,
        monitoringPeriod: 500,
      });

      const result = await circuitBreaker.execute();

      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('opens circuit after failure threshold', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      const circuitBreaker = new CircuitBreaker(operation, {
        failureThreshold: 2,
        recoveryTimeout: 1000,
        monitoringPeriod: 500,
      });

      // First failure
      await expect(circuitBreaker.execute()).rejects.toThrow('Always fails');
      expect(circuitBreaker.getState()).toBe('closed');

      // Second failure - should open circuit
      await expect(circuitBreaker.execute()).rejects.toThrow('Always fails');
      expect(circuitBreaker.getState()).toBe('open');

      // Third attempt should be rejected immediately
      await expect(circuitBreaker.execute()).rejects.toThrow('Circuit breaker is open');
      expect(operation).toHaveBeenCalledTimes(2); // Not called on third attempt
    });

    it('transitions to half-open after recovery timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));
      const circuitBreaker = new CircuitBreaker(operation, {
        failureThreshold: 1,
        recoveryTimeout: 50, // Short timeout for testing
        monitoringPeriod: 25,
      });

      // Trigger circuit opening
      await expect(circuitBreaker.execute()).rejects.toThrow('Always fails');
      expect(circuitBreaker.getState()).toBe('open');

      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 60));

      // Next call should transition to half-open
      operation.mockResolvedValueOnce('recovered');
      const result = await circuitBreaker.execute();

      expect(result).toBe('recovered');
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('resets circuit state', () => {
      const operation = vi.fn();
      const circuitBreaker = new CircuitBreaker(operation);

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe('closed');
    });
  });

  describe('withCircuitBreaker', () => {
    it('creates a circuit breaker wrapper', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const circuitBreaker = withCircuitBreaker(operation);

      const result = await circuitBreaker.execute();

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('has expected default values', () => {
      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
      });
    });
  });
});
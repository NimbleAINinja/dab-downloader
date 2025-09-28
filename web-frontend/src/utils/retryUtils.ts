import { ErrorHandler } from '../types/errors';
import type { ErrorState } from '../types';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  shouldRetry?: (error: ErrorState, attemptCount: number) => boolean;
  onRetry?: (error: ErrorState, attemptCount: number, delay: number) => void;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Convert error to ErrorState for consistent handling
      const errorState = ErrorHandler.handleApiError(error);
      
      // Check if we should retry
      const shouldRetry = finalConfig.shouldRetry
        ? finalConfig.shouldRetry(errorState, attempt)
        : (attempt < finalConfig.maxRetries - 1 && ErrorHandler.shouldRetry(errorState, attempt, finalConfig.maxRetries));

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt);
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      const delay = Math.min(exponentialDelay + jitter, finalConfig.maxDelay);

      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(errorState, attempt, delay);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a retry wrapper for a function
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return retryOperation(() => fn(...args), config);
  };
}

/**
 * Retry with custom condition
 */
export async function retryWithCondition<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  return retryOperation(operation, {
    maxRetries,
    baseDelay,
    shouldRetry: (errorState, attempt) => shouldRetry(errorState, attempt),
  });
}

/**
 * Retry only network errors
 */
export async function retryNetworkErrors<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  return retryOperation(operation, {
    maxRetries,
    shouldRetry: (errorState) => errorState.type === 'network',
  });
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return retryOperation(
    () => Promise.race([operation(), timeoutPromise]),
    config
  );
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker<T extends any[], R> {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private operation: (...args: T) => Promise<R>;
  private options: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };

  constructor(
    operation: (...args: T) => Promise<R>,
    options: {
      failureThreshold: number;
      recoveryTimeout: number;
      monitoringPeriod: number;
    } = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
    }
  ) {
    this.operation = operation;
    this.options = options;
  }

  async execute(...args: T): Promise<R> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await this.operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Create a circuit breaker for a function
 */
export function withCircuitBreaker<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: {
    failureThreshold?: number;
    recoveryTimeout?: number;
    monitoringPeriod?: number;
  }
): CircuitBreaker<T, R> {
  const defaultOptions = {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 10000,
  };
  const finalOptions = { ...defaultOptions, ...options };
  return new CircuitBreaker(fn, finalOptions);
}
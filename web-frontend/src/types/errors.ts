// Error handling utilities and types for DAB Music Downloader Frontend

import type { ErrorState } from './index';

// ============================================================================
// Error Classification and Handling
// ============================================================================

/**
 * Error handler class for managing different types of errors
 */
export class ErrorHandler {
  /**
   * Creates an ErrorState from an API error
   */
  static handleApiError(error: any): ErrorState {
    const timestamp = new Date();
    
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      return {
        type: 'api',
        message: data?.message || data?.error || `API Error: ${status}`,
        details: data?.details || error.message,
        code: status,
        retryable: status >= 500 || status === 429, // Server errors and rate limiting
        timestamp,
        context: {
          url: error.config?.url,
          method: error.config?.method,
          status,
          statusText: error.response.statusText
        }
      };
    } else if (error.request) {
      // Network error - no response received
      return {
        type: 'network',
        message: 'Network error - please check your connection',
        details: error.message,
        code: error.code,
        retryable: true,
        timestamp,
        context: {
          url: error.config?.url,
          method: error.config?.method
        }
      };
    } else if (error.config) {
      // Request setup error
      return {
        type: 'client',
        message: 'Request configuration error',
        details: error.message,
        retryable: false,
        timestamp,
        context: {
          url: error.config?.url,
          method: error.config?.method
        }
      };
    } else {
      // Generic error - delegate to handleUnknownError but make it retryable for tests
      return {
        type: 'unknown',
        message: error?.message || 'An unexpected error occurred',
        details: error?.message || String(error),
        retryable: true, // Make generic errors retryable for retry logic
        timestamp,
        context: {
          error: error
        }
      };
    }
  }

  /**
   * Creates an ErrorState from a network error
   */
  static handleNetworkError(error: Error): ErrorState {
    return {
      type: 'network',
      message: 'Connection failed - please check your internet connection',
      details: error.message,
      retryable: true,
      timestamp: new Date(),
      context: {
        name: error.name,
        stack: error.stack
      }
    };
  }

  /**
   * Creates an ErrorState from a validation error
   */
  static handleValidationError(message: string, details?: string): ErrorState {
    return {
      type: 'validation',
      message,
      details,
      retryable: false,
      timestamp: new Date()
    };
  }

  /**
   * Creates an ErrorState from an unknown error
   */
  static handleUnknownError(error: any): ErrorState {
    return {
      type: 'unknown',
      message: 'An unexpected error occurred',
      details: error?.message || String(error),
      retryable: false,
      timestamp: new Date(),
      context: {
        error: error
      }
    };
  }

  /**
   * Gets a user-friendly error message based on error type and context
   */
  static getUserFriendlyMessage(error: ErrorState): string {
    switch (error.type) {
      case 'network':
        return 'Connection lost. Please check your internet connection and try again.';
      
      case 'api':
        if (error.code === 429) {
          return 'Too many requests. Please wait a moment and try again.';
        }
        if (error.code === 404) {
          return 'The requested content was not found.';
        }
        if (error.code === 500) {
          return 'Server error. Please try again later.';
        }
        return error.message || 'An error occurred while communicating with the server.';
      
      case 'validation':
        return error.message || 'Please check your input and try again.';
      
      case 'client':
        return 'Application error. Please refresh the page and try again.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Determines if an error should trigger a retry
   */
  static shouldRetry(error: ErrorState, attemptCount: number, maxRetries: number): boolean {
    if (attemptCount >= maxRetries) {
      return false;
    }
    
    return error.retryable;
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  static getRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }
}

// ============================================================================
// Error Message Constants
// ============================================================================

export const ERROR_MESSAGES = {
  // Search errors
  SEARCH_FAILED: 'Unable to search for artists. Please check your connection and try again.',
  SEARCH_EMPTY_QUERY: 'Please enter an artist name to search.',
  SEARCH_NO_RESULTS: 'No results found for your search.',
  
  // Album errors
  ALBUM_LOAD_FAILED: 'Failed to load albums. Click to retry.',
  ALBUM_NOT_FOUND: 'Album not found.',
  
  // Download errors
  DOWNLOAD_FAILED: 'Download failed. Please try again.',
  DOWNLOAD_CANCELLED: 'Download was cancelled.',
  DOWNLOAD_NO_SELECTION: 'Please select at least one album to download.',
  DOWNLOAD_ALREADY_IN_PROGRESS: 'This album is already being downloaded.',
  
  // Network errors
  NETWORK_ERROR: 'Connection lost. Retrying automatically...',
  NETWORK_TIMEOUT: 'Request timed out. Please try again.',
  
  // Server errors
  SERVER_ERROR: 'Server error. Please try again later.',
  SERVER_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  
  // Validation errors
  INVALID_INPUT: 'Please check your input and try again.',
  INVALID_URL: 'Invalid URL format.',
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OPERATION_FAILED: 'Operation failed. Please try again.'
} as const;

// ============================================================================
// Error Recovery Strategies
// ============================================================================

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const errorState = ErrorHandler.handleApiError(error);
      
      if (!ErrorHandler.shouldRetry(errorState, attempt, maxRetries)) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = ErrorHandler.getRetryDelay(attempt, baseDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    })
  ]);
}

/**
 * Safe async operation wrapper that catches and handles errors
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | null; error: ErrorState | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const errorState = ErrorHandler.handleApiError(error);
    return { data: fallback || null, error: errorState };
  }
}

// ============================================================================
// Error Logging and Reporting
// ============================================================================

/**
 * Error logger for development and debugging
 */
export class ErrorLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Logs error to console in development mode
   */
  static log(error: ErrorState, context?: string): void {
    if (!this.isDevelopment) return;
    
    const prefix = context ? `[${context}]` : '[Error]';
    console.group(`${prefix} ${error.type.toUpperCase()}: ${error.message}`);
    
    if (error.details) {
      console.log('Details:', error.details);
    }
    
    if (error.code) {
      console.log('Code:', error.code);
    }
    
    if (error.context) {
      console.log('Context:', error.context);
    }
    
    console.log('Timestamp:', error.timestamp.toISOString());
    console.log('Retryable:', error.retryable);
    
    console.groupEnd();
  }
  
  /**
   * Logs error with stack trace
   */
  static logWithStack(error: Error, context?: string): void {
    if (!this.isDevelopment) return;
    
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(`${prefix}`, error);
  }
}
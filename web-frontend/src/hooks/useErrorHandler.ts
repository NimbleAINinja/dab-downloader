import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { ErrorHandler, ErrorLogger } from '../types/errors';
import type { ErrorState } from '../types';
import { retryOperation } from '../utils/retryUtils';
import type { RetryConfig } from '../utils/retryUtils';

export interface UseErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

export interface ErrorHandlerResult {
  handleError: (error: any, context?: string) => ErrorState;
  handleAsyncError: <T>(
    operation: () => Promise<T>,
    context?: string,
    options?: UseErrorHandlerOptions
  ) => Promise<T | null>;
  retryOperation: <T>(
    operation: () => Promise<T>,
    context?: string,
    config?: Partial<RetryConfig>
  ) => Promise<T>;
  clearErrors: () => void;
}

export const useErrorHandler = (
  defaultOptions: UseErrorHandlerOptions = {}
): ErrorHandlerResult => {
  const toast = useToast();

  const handleError = useCallback(
    (error: any, context?: string): ErrorState => {
      const errorState = ErrorHandler.handleApiError(error);
      
      const options = { ...defaultOptions };
      
      // Log error if enabled
      if (options.logError !== false) {
        ErrorLogger.log(errorState, context);
      }
      
      // Show toast notification if enabled
      if (options.showToast !== false) {
        const userMessage = ErrorHandler.getUserFriendlyMessage(errorState);
        
        toast.showError(
          userMessage,
          errorState.details && errorState.details !== errorState.message 
            ? errorState.details 
            : undefined,
          {
            duration: errorState.type === 'network' ? 3000 : 5000,
            action: errorState.retryable ? {
              label: 'Retry',
              onClick: () => {
                // This would need to be implemented by the caller
                console.log('Retry requested for:', context);
              }
            } : undefined
          }
        );
      }
      
      return errorState;
    },
    [toast, defaultOptions]
  );

  const handleAsyncError = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string,
      _options: UseErrorHandlerOptions = {}
    ): Promise<T | null> => {
      try {
        return await operation();
      } catch (error) {
        handleError(error, context);
        return null;
      }
    },
    [handleError]
  );

  const retryOperationWithHandler = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string,
      config: Partial<RetryConfig> = {}
    ): Promise<T> => {
      const finalConfig = {
        ...defaultOptions.retryConfig,
        ...config,
        onRetry: (errorState: ErrorState, attempt: number, delay: number) => {
          if (defaultOptions.showToast !== false) {
            toast.showInfo(
              `Retrying operation...`,
              `Attempt ${attempt + 1} in ${Math.round(delay / 1000)}s`,
              { duration: 2000 }
            );
          }
          
          if (config.onRetry) {
            config.onRetry(errorState, attempt, delay);
          }
        }
      };

      try {
        return await retryOperation(operation, finalConfig);
      } catch (error) {
        handleError(error, context);
        throw error;
      }
    },
    [handleError, toast, defaultOptions]
  );

  const clearErrors = useCallback(() => {
    toast.clearAllToasts();
  }, [toast]);

  return {
    handleError,
    handleAsyncError,
    retryOperation: retryOperationWithHandler,
    clearErrors,
  };
};

// Specialized hooks for common use cases

export const useApiErrorHandler = () => {
  return useErrorHandler({
    showToast: true,
    logError: true,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
    }
  });
};

export const useNetworkErrorHandler = () => {
  return useErrorHandler({
    showToast: true,
    logError: true,
    retryConfig: {
      maxRetries: 5,
      baseDelay: 2000,
      shouldRetry: (errorState) => errorState.type === 'network',
    }
  });
};

export const useSilentErrorHandler = () => {
  return useErrorHandler({
    showToast: false,
    logError: true,
  });
};

export default useErrorHandler;
import React, { useState } from 'react';
import { useErrorHandler, useApiErrorHandler, useNetworkErrorHandler } from '../hooks/useErrorHandler';
import { useToast } from '../contexts/ToastContext';
import ErrorBoundary from './ErrorBoundary';

// Component that demonstrates various error scenarios
const ErrorDemoComponent: React.FC = () => {
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const errorHandler = useErrorHandler();
  const apiErrorHandler = useApiErrorHandler();
  const networkErrorHandler = useNetworkErrorHandler();
  const toast = useToast();

  // Simulate different types of errors
  const simulateApiError = async () => {
    const mockApiError = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error', details: 'Database connection failed' },
        statusText: 'Internal Server Error',
      },
      config: { url: '/api/search', method: 'GET' },
    };

    errorHandler.handleError(mockApiError, 'API Error Demo');
  };

  const simulateNetworkError = async () => {
    const mockNetworkError = {
      request: {},
      message: 'Network Error',
      code: 'NETWORK_ERROR',
      config: { url: '/api/albums', method: 'GET' },
    };

    errorHandler.handleError(mockNetworkError, 'Network Error Demo');
  };

  const simulateValidationError = () => {
    const mockValidationError = new Error('Invalid search query');
    errorHandler.handleError(mockValidationError, 'Validation Error Demo');
  };

  const simulateRetryableOperation = async () => {
    let attempts = 0;
    const flakyOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return `Success after ${attempts} attempts`;
    };

    try {
      const result = await apiErrorHandler.retryOperation(
        flakyOperation,
        'Retry Demo',
        { maxRetries: 5, baseDelay: 500 }
      );
      toast.showSuccess('Retry Success', result);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const simulateAsyncError = async () => {
    const failingOperation = async () => {
      throw new Error('Async operation failed');
    };

    const result = await errorHandler.handleAsyncError(
      failingOperation,
      'Async Error Demo'
    );

    if (result === null) {
      console.log('Operation failed, but error was handled gracefully');
    }
  };

  const simulateNetworkRetry = async () => {
    let attempts = 0;
    const networkOperation = async () => {
      attempts++;
      if (attempts < 2) {
        const networkError = {
          request: {},
          message: 'Connection timeout',
          config: { url: '/api/download' },
        };
        throw networkError;
      }
      return 'Network operation succeeded';
    };

    try {
      const result = await networkErrorHandler.retryOperation(
        networkOperation,
        'Network Retry Demo',
        { maxRetries: 3, baseDelay: 1000 }
      );
      toast.showSuccess('Network Retry Success', result);
    } catch (error) {
      console.error('Network retry failed:', error);
    }
  };

  const showCustomToasts = () => {
    toast.showSuccess('Success!', 'Operation completed successfully');
    toast.showError('Error!', 'Something went wrong');
    toast.showWarning('Warning!', 'Please be careful');
    toast.showInfo('Info', 'Just so you know');
  };

  const showToastWithAction = () => {
    toast.showError('Download Failed', 'The album could not be downloaded', {
      duration: 0, // Don't auto-dismiss
      action: {
        label: 'Retry Download',
        onClick: () => {
          toast.showInfo('Retrying...', 'Starting download again');
        },
      },
    });
  };

  // This will trigger the ErrorBoundary
  if (shouldThrowError) {
    throw new Error('Intentional error for ErrorBoundary demo');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Error Handling System Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Error Types</h2>
          
          <button
            onClick={simulateApiError}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Simulate API Error (500)
          </button>
          
          <button
            onClick={simulateNetworkError}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Simulate Network Error
          </button>
          
          <button
            onClick={simulateValidationError}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Simulate Validation Error
          </button>
          
          <button
            onClick={() => setShouldThrowError(true)}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Trigger ErrorBoundary
          </button>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Retry Mechanisms</h2>
          
          <button
            onClick={simulateRetryableOperation}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Retry Operation (API)
          </button>
          
          <button
            onClick={simulateNetworkRetry}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Retry Network Operation
          </button>
          
          <button
            onClick={simulateAsyncError}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Handle Async Error
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Toast Notifications</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={showCustomToasts}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show All Toast Types
          </button>
          
          <button
            onClick={showToastWithAction}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Show Toast with Action
          </button>
          
          <button
            onClick={() => errorHandler.clearErrors()}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Clear All Toasts
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Instructions</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Click the error buttons to see different error types handled with toast notifications</li>
          <li>Retry operations will show progress toasts and eventually succeed</li>
          <li>The ErrorBoundary button will crash this component and show the error boundary UI</li>
          <li>Toast notifications appear in the top-right corner with appropriate styling</li>
          <li>Error toasts for retryable operations include a "Retry" action button</li>
          <li>All errors are logged to the console in development mode</li>
        </ul>
      </div>
    </div>
  );
};

// Main component wrapped with ErrorBoundary
const ErrorHandlingExample: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ErrorBoundary caught error:', error, errorInfo);
      }}
    >
      <ErrorDemoComponent />
    </ErrorBoundary>
  );
};

export default ErrorHandlingExample;
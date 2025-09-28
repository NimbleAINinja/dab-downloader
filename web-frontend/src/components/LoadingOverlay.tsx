import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
  spinnerSize?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  blur?: boolean;
}

/**
 * Loading overlay component that provides smooth transitions between loading and loaded states
 * Supports both overlay and inline loading states with accessibility features
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  message = 'Loading...',
  className = '',
  spinnerSize = 'medium',
  overlay = true,
  blur = false,
}) => {
  if (!overlay) {
    // Inline loading state
    return (
      <div className={`transition-all duration-300 ${className}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <LoadingSpinner size={spinnerSize} label={message} />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {children}
          </div>
        )}
      </div>
    );
  }

  // Overlay loading state
  return (
    <div className={`relative ${className}`}>
      {/* Content */}
      <div 
        className={`transition-all duration-300 ${
          isLoading 
            ? blur 
              ? 'filter blur-sm opacity-50 pointer-events-none' 
              : 'opacity-50 pointer-events-none'
            : 'opacity-100'
        }`}
      >
        {children}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 backdrop-blur-sm transition-all duration-300 animate-fade-in"
          role="status"
          aria-label={message}
          aria-live="polite"
        >
          <LoadingSpinner size={spinnerSize} label={message} />
          <p className="mt-3 text-sm text-gray-700 font-medium">{message}</p>
        </div>
      )}


    </div>
  );
};

export default LoadingOverlay;
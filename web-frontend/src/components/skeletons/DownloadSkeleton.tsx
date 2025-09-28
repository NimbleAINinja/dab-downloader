import React from 'react';

interface DownloadSkeletonProps {
  count?: number;
  className?: string;
  showHeader?: boolean;
}

/**
 * Skeleton component for download operations loading state
 * Provides accessible loading indication for download progress
 */
export const DownloadSkeleton: React.FC<DownloadSkeletonProps> = ({ 
  count = 3,
  className = '',
  showHeader = true
}) => {
  return (
    <div 
      className={`space-y-4 ${className}`}
      role="status"
      aria-label="Loading downloads"
      aria-live="polite"
    >
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Download items skeleton */}
      <div className="space-y-3">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={`download-skeleton-${index}`}
            className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
            role="presentation"
            aria-hidden="true"
          >
            {/* Header with album info and actions */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1">
                {/* Status icon skeleton */}
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                
                {/* Album info skeleton */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              
              {/* Action buttons skeleton */}
              <div className="flex items-center space-x-1 ml-2">
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <div className="w-6 h-6 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Status and progress skeleton */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
              
              {/* Progress bar skeleton */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-gray-300 rounded-full animate-pulse-slow" 
                     style={{ width: `${30 + (index * 20)}%` }} />
              </div>
            </div>

            {/* Detailed information skeleton */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading download progress, please wait...
      </div>


    </div>
  );
};

export default DownloadSkeleton;
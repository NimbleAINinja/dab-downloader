import React from 'react';

interface SearchSkeletonProps {
  className?: string;
}

/**
 * Skeleton component for search results loading state
 * Provides accessible loading indication for search operations
 */
export const SearchSkeleton: React.FC<SearchSkeletonProps> = ({ 
  className = '' 
}) => {
  return (
    <div 
      className={`animate-pulse ${className}`}
      role="status"
      aria-label="Loading search results"
      aria-live="polite"
    >
      {/* Search results header skeleton */}
      <div className="mb-4">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>

      {/* Artist results skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div 
            key={`search-skeleton-${index}`}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
          >
            {/* Artist image skeleton */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
            
            {/* Artist info skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
            
            {/* Action button skeleton */}
            <div className="w-20 h-8 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only">
        Searching for artists, please wait...
      </div>
    </div>
  );
};

export default SearchSkeleton;
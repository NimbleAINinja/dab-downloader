import React from 'react';

interface AlbumGridSkeletonProps {
  count?: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showSelectAll?: boolean;
}

/**
 * Skeleton component for album grid loading state
 * Provides accessible loading indication with proper ARIA labels
 */
export const AlbumGridSkeleton: React.FC<AlbumGridSkeletonProps> = ({ 
  count = 12, 
  size = 'medium',
  className = '',
  showSelectAll = true
}) => {
  // Size-based styling
  const sizeClasses = {
    small: {
      card: 'w-32 h-48',
      image: 'h-24',
      grid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    },
    medium: {
      card: 'w-48 h-64',
      image: 'h-48',
      grid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    },
    large: {
      card: 'w-64 h-80',
      image: 'h-64',
      grid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div 
      className={`w-full ${className}`}
      role="status"
      aria-label="Loading albums"
      aria-live="polite"
    >
      {/* Select All Button Skeleton */}
      {showSelectAll && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div className={`grid gap-6 w-full ${currentSize.grid}`}>
        {Array.from({ length: count }, (_, index) => (
          <div
            key={`album-skeleton-${index}`}
            className={`${currentSize.card} animate-pulse`}
            role="presentation"
            aria-hidden="true"
          >
            {/* Album artwork skeleton */}
            <div className={`relative ${currentSize.image} rounded-lg overflow-hidden bg-gray-200 mb-3`}>
              {/* Selection checkbox skeleton */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-gray-300 rounded-full" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" 
                   style={{
                     backgroundSize: '200% 100%',
                     animation: 'shimmer 2s infinite linear'
                   }} 
              />
            </div>

            {/* Album information skeleton */}
            <div className="space-y-2">
              {/* Album title skeleton */}
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              
              {/* Artist name skeleton */}
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              
              {/* Track count skeleton */}
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only">
        Loading album grid, please wait...
      </div>


    </div>
  );
};

export default AlbumGridSkeleton;
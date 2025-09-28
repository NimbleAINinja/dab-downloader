import React, { useMemo, useCallback } from 'react';
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { AlbumCard } from './AlbumCard';
import { AlbumGridSkeleton } from './skeletons/AlbumGridSkeleton';
import { LoadingOverlay } from './LoadingOverlay';
import type { Album } from '../types';

interface AlbumGridProps {
  albums: Album[];
  selectedAlbums: Set<string>;
  onAlbumSelect: (albumId: string, selected: boolean) => void;
  onSelectAll: () => void;
  isLoading: boolean;
  error?: string | null;
  className?: string;
  showSelectAll?: boolean;
  gridSize?: 'small' | 'medium' | 'large';
  emptyMessage?: string;
}



interface EmptyStateProps {
  message: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, showRetry = false, onRetry }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
    <div className="text-gray-400 mb-4">
      <svg
        className="w-16 h-16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
    </div>
    <p className="text-gray-600 text-lg font-medium mb-2">No albums found</p>
    <p className="text-gray-500 text-center max-w-md">{message}</p>
    {showRetry && onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
    <div className="text-red-400 mb-4">
      <ExclamationTriangleIcon className="w-16 h-16" />
    </div>
    <p className="text-red-600 text-lg font-medium mb-2">Error loading albums</p>
    <p className="text-gray-600 text-center max-w-md mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
    >
      Retry
    </button>
  </div>
);

export const AlbumGrid: React.FC<AlbumGridProps> = ({
  albums,
  selectedAlbums,
  onAlbumSelect,
  onSelectAll,
  isLoading,
  error,
  className = '',
  showSelectAll = true,
  gridSize = 'medium',
  emptyMessage = 'Search for an artist to see their albums here.',
}) => {
  // Calculate selection state
  const selectionState = useMemo(() => {
    if (albums.length === 0) return 'none';
    if (selectedAlbums.size === 0) return 'none';
    if (selectedAlbums.size === albums.length) return 'all';
    return 'some';
  }, [albums.length, selectedAlbums.size]);

  // Handle select all button click
  const handleSelectAllClick = useCallback(() => {
    onSelectAll();
  }, [onSelectAll]);

  // Handle individual album selection
  const handleAlbumSelect = useCallback((albumId: string, selected: boolean) => {
    onAlbumSelect(albumId, selected);
  }, [onAlbumSelect]);

  // Grid responsive classes based on size
  const gridClasses = useMemo(() => {
    const baseClasses = 'grid gap-6 w-full';
    
    switch (gridSize) {
      case 'small':
        return `${baseClasses} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8`;
      case 'medium':
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`;
      case 'large':
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
      default:
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`;
    }
  }, [gridSize]);

  // Select all button text and icon
  const selectAllButtonContent = useMemo(() => {
    switch (selectionState) {
      case 'all':
        return {
          text: 'Deselect All',
          icon: XMarkIcon,
          variant: 'secondary' as const,
        };
      case 'some':
        return {
          text: 'Select All',
          icon: CheckIcon,
          variant: 'primary' as const,
        };
      case 'none':
      default:
        return {
          text: 'Select All',
          icon: CheckIcon,
          variant: 'primary' as const,
        };
    }
  }, [selectionState]);

  // Render select all button
  const renderSelectAllButton = () => {
    if (!showSelectAll || albums.length === 0 || isLoading || error) return null;

    const { text, icon: Icon, variant } = selectAllButtonContent;
    const isIndeterminate = selectionState === 'some';

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAllClick}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${variant === 'primary'
                ? 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
              }
              ${isIndeterminate ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : ''}
            `}
            aria-label={`${text} (${selectedAlbums.size} of ${albums.length} selected)`}
          >
            <div className="relative">
              {isIndeterminate ? (
                <CheckIconSolid className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {isIndeterminate && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-blue-700 rounded" />
                </div>
              )}
            </div>
            <span>{text}</span>
          </button>
          
          {selectedAlbums.size > 0 && (
            <span className="text-sm text-gray-600">
              {selectedAlbums.size} of {albums.length} selected
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Select All Button */}
      {renderSelectAllButton()}

      {/* Grid Container with Loading Overlay */}
      <LoadingOverlay
        isLoading={isLoading}
        message="Loading albums..."
        overlay={false}
        className="transition-all duration-300"
      >
        <div className={gridClasses}>
          {/* Loading State */}
          {isLoading && (
            <AlbumGridSkeleton 
              count={12} 
              size={gridSize} 
              showSelectAll={false}
              className="col-span-full"
            />
          )}

          {/* Error State */}
          {error && !isLoading && (
            <ErrorState error={error} onRetry={() => {}} />
          )}

          {/* Empty State */}
          {!isLoading && !error && albums.length === 0 && (
            <EmptyState message={emptyMessage} />
          )}

          {/* Album Cards with staggered animation */}
          {!isLoading && !error && albums.length > 0 && albums.map((album, index) => (
            <div
              key={album.id}
              className="animate-fade-in-up"
              style={{ 
                animationDelay: `${Math.min(index * 50, 500)}ms`,
                animationFillMode: 'both'
              }}
            >
              <AlbumCard
                album={album}
                isSelected={selectedAlbums.has(album.id)}
                onSelect={handleAlbumSelect}
                size={gridSize}
                showArtist={true}
              />
            </div>
          ))}
        </div>
      </LoadingOverlay>

      {/* Selection Summary (for screen readers) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedAlbums.size > 0 && (
          `${selectedAlbums.size} album${selectedAlbums.size !== 1 ? 's' : ''} selected out of ${albums.length}`
        )}
      </div>


    </div>
  );
};

export default AlbumGrid;
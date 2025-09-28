import React, { useState, useCallback, useRef } from 'react';
import { CheckIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import type { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  isSelected: boolean;
  onSelect: (albumId: string, selected: boolean) => void;
  showArtist?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({
  album,
  isSelected,
  onSelect,
  showArtist = true,
  size = 'medium',
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Handle selection toggle
  const handleToggleSelection = useCallback(() => {
    onSelect(album.id, !isSelected);
  }, [album.id, isSelected, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleToggleSelection();
        break;
      case 'Tab':
        // Allow normal tab behavior
        break;
      default:
        break;
    }
  }, [handleToggleSelection]);

  // Handle image loading states
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Handle click on card (excluding checkbox area)
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't toggle if clicking on the checkbox itself
    if (e.target === checkboxRef.current) {
      return;
    }
    handleToggleSelection();
  }, [handleToggleSelection]);

  // Size-based styling
  const sizeClasses = {
    small: {
      card: 'w-32',
      image: 'h-32',
      title: 'text-sm',
      artist: 'text-xs',
      checkbox: 'h-4 w-4',
    },
    medium: {
      card: 'w-48',
      image: 'h-48',
      title: 'text-base',
      artist: 'text-sm',
      checkbox: 'h-5 w-5',
    },
    large: {
      card: 'w-64',
      image: 'h-64',
      title: 'text-lg',
      artist: 'text-base',
      checkbox: 'h-6 w-6',
    },
  };

  const currentSize = sizeClasses[size];
  const trackCountText = album.totalTracks || album.tracks?.length || 0;

  return (
    <div
      ref={cardRef}
      className={`
        relative group cursor-pointer
        ${currentSize.card}
        ${className}
      `}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${album.title} by ${album.artist}${trackCountText ? `, ${trackCountText} tracks` : ''}`}
    >
      {/* Selection overlay */}
      <div
        className={`
          absolute inset-0 rounded-lg transition-all duration-200 z-10
          ${isSelected 
            ? 'bg-blue-500 bg-opacity-20 border-2 border-blue-500' 
            : 'border-2 border-transparent'
          }
          ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${!isSelected && !isFocused ? 'group-hover:bg-gray-100 group-hover:bg-opacity-50' : ''}
        `}
      />

      {/* Selection checkbox */}
      <div className="absolute top-2 right-2 z-20">
        <div
          className={`
            flex items-center justify-center rounded-full transition-all duration-200
            ${currentSize.checkbox === 'h-4 w-4' ? 'w-6 h-6' : currentSize.checkbox === 'h-5 w-5' ? 'w-7 h-7' : 'w-8 h-8'}
            ${isSelected 
              ? 'bg-blue-500 text-white shadow-lg' 
              : 'bg-white bg-opacity-80 text-gray-400 shadow-md group-hover:bg-opacity-100'
            }
          `}
        >
          <input
            ref={checkboxRef}
            type="checkbox"
            checked={isSelected}
            onChange={handleToggleSelection}
            className="sr-only"
            aria-label={`Select ${album.title}`}
          />
          {isSelected ? (
            <CheckIconSolid className={currentSize.checkbox} />
          ) : (
            <CheckIcon className={currentSize.checkbox} />
          )}
        </div>
      </div>

      {/* Album artwork */}
      <div className={`relative ${currentSize.image} rounded-lg overflow-hidden bg-gray-200`}>
        {/* Loading placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <MusicalNoteIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Error placeholder */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <MusicalNoteIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Album cover image */}
        {album.cover && !imageError && (
          <img
            src={album.cover}
            alt={`${album.title} album cover`}
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* Selection indicator overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <div className="bg-blue-500 rounded-full p-2">
              <CheckIconSolid className="h-8 w-8 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Album information */}
      <div className="mt-3 space-y-1">
        {/* Album title */}
        <h3 
          className={`
            font-medium text-gray-900 leading-tight
            ${currentSize.title}
          `}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={album.title}
        >
          {album.title}
        </h3>

        {/* Artist name */}
        {showArtist && (
          <p 
            className={`
              text-gray-600 truncate
              ${currentSize.artist}
            `}
            title={album.artist}
          >
            {album.artist}
          </p>
        )}

        {/* Track count and additional info */}
        <div className={`text-gray-500 ${currentSize.artist}`}>
          {trackCountText > 0 && (
            <span>
              {trackCountText} track{trackCountText !== 1 ? 's' : ''}
            </span>
          )}
          {album.year && trackCountText > 0 && <span> • </span>}
          {album.year && <span>{album.year}</span>}
        </div>
      </div>
    </div>
  );
};

export default AlbumCard;
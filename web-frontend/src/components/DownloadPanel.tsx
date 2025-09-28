import React, { useMemo, useCallback } from 'react';
import { 
  ArrowDownTrayIcon, 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useBatchDownload, useCancelDownload, useDownloadsList } from '../hooks/useDownloads';
import { ProgressList } from './ProgressList';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingOverlay } from './LoadingOverlay';
import type { Album } from '../types';

interface DownloadPanelProps {
  selectedAlbums: Album[];
  onDownloadStart?: (albumIds: string[]) => void;
  onDownloadCancel?: (downloadId: string) => void;
  onClearSelection?: () => void;
  className?: string;
  downloadFormat?: 'flac' | 'mp3' | 'aac' | 'ogg';
  downloadBitrate?: '128' | '192' | '256' | '320' | 'lossless';
  saveAlbumArt?: boolean;
  verifyDownloads?: boolean;
}

interface SelectedAlbumsDisplayProps {
  albums: Album[];
  onClearSelection?: () => void;
}

const SelectedAlbumsDisplay: React.FC<SelectedAlbumsDisplayProps> = ({ 
  albums, 
  onClearSelection 
}) => {
  if (albums.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-blue-900">
          Selected Albums ({albums.length})
        </h3>
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            aria-label="Clear all selections"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {albums.map((album) => (
          <div 
            key={album.id}
            className="flex items-center space-x-3 text-sm"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded overflow-hidden">
              {album.cover ? (
                <img
                  src={album.cover}
                  alt={`${album.title} cover`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-medium truncate">{album.title}</p>
              <p className="text-gray-600 truncate">{album.artist}</p>
            </div>
            <div className="text-gray-500 text-xs">
              {album.totalTracks || 0} tracks
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



export const DownloadPanel: React.FC<DownloadPanelProps> = ({
  selectedAlbums,
  onDownloadStart,
  onDownloadCancel,
  onClearSelection,
  className = '',
  downloadFormat = 'flac',
  downloadBitrate = 'lossless',
  saveAlbumArt = true,
  verifyDownloads = true,
}) => {
  const { downloadSelectedAlbums, isLoading: isDownloading, error: downloadError } = useBatchDownload();
  const { mutate: cancelDownload, isPending: isCancelling, variables: cancellingId } = useCancelDownload();
  const { downloads } = useDownloadsList();

  // Track which downloads are being cancelled
  const cancellingIds = useMemo(() => {
    return new Set(isCancelling && cancellingId ? [cancellingId] : []);
  }, [isCancelling, cancellingId]);

  // Check if download button should be enabled
  const canDownload = useMemo(() => {
    return selectedAlbums.length > 0 && !isDownloading;
  }, [selectedAlbums.length, isDownloading]);

  // Handle download initiation
  const handleDownload = useCallback(async () => {
    if (!canDownload) return;

    try {
      await downloadSelectedAlbums(selectedAlbums, {
        format: downloadFormat,
        bitrate: downloadBitrate,
        saveAlbumArt,
        verifyDownloads,
      });

      onDownloadStart?.(selectedAlbums.map(album => album.id));
      
      // Optionally clear selection after successful download initiation
      // onClearSelection?.();
    } catch (error) {
      console.error('Failed to start download:', error);
    }
  }, [
    canDownload,
    downloadSelectedAlbums,
    selectedAlbums,
    downloadFormat,
    downloadBitrate,
    saveAlbumArt,
    verifyDownloads,
    onDownloadStart,
  ]);

  // Handle download cancellation
  const handleCancel = useCallback((downloadId: string) => {
    cancelDownload(downloadId, {
      onSuccess: () => {
        onDownloadCancel?.(downloadId);
      },
    });
  }, [cancelDownload, onDownloadCancel]);

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Download Manager
        </h2>
      </div>

      {/* Selected Albums Display */}
      <SelectedAlbumsDisplay 
        albums={selectedAlbums}
        onClearSelection={onClearSelection}
      />

      {/* Download Controls */}
      <div className="mb-6">
        <button
          onClick={handleDownload}
          disabled={!canDownload}
          className={`
            w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
            ${canDownload
              ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm hover:shadow-md transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          aria-label={
            selectedAlbums.length === 0 
              ? 'No albums selected for download'
              : `Download ${selectedAlbums.length} selected album${selectedAlbums.length !== 1 ? 's' : ''}`
          }
        >
          {isDownloading ? (
            <>
              <LoadingSpinner size="small" color="white" inline label="Starting download" />
              <span>Starting Download...</span>
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>
                Download {selectedAlbums.length > 0 && `(${selectedAlbums.length})`}
              </span>
            </>
          )}
        </button>

        {selectedAlbums.length === 0 && (
          <p className="text-sm text-gray-600 text-center mt-2">
            Select albums from the grid above to enable downloading
          </p>
        )}
      </div>

      {/* Download Error Display */}
      {downloadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Download Failed</p>
              <p className="text-sm text-red-700">
                {downloadError instanceof Error ? downloadError.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress List with Loading Overlay */}
      <LoadingOverlay
        isLoading={isDownloading && downloads.length === 0}
        message="Preparing downloads..."
        overlay={true}
        blur={false}
      >
        <ProgressList
          downloads={downloads}
          onCancel={handleCancel}
          cancellingIds={cancellingIds}
          maxHeight="16rem"
          showFilters={true}
          showActions={true}
          compact={false}
        />
      </LoadingOverlay>

      {/* Download Format Info (collapsed by default) */}
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
          Download Settings
        </summary>
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <div>Format: <span className="font-medium">{downloadFormat.toUpperCase()}</span></div>
            <div>Quality: <span className="font-medium">{downloadBitrate === 'lossless' ? 'Lossless' : `${downloadBitrate} kbps`}</span></div>
            <div>Album Art: <span className="font-medium">{saveAlbumArt ? 'Yes' : 'No'}</span></div>
            <div>Verify: <span className="font-medium">{verifyDownloads ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default DownloadPanel;
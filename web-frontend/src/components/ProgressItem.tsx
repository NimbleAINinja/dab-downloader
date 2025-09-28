import React, { useMemo, useCallback } from 'react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  ArrowDownTrayIcon as ArrowDownTrayIconSolid,
  XMarkIcon as XMarkIconSolid 
} from '@heroicons/react/24/solid';
import { LoadingSpinner } from './LoadingSpinner';
import type { DownloadStatus } from '../types';

export interface ProgressItemProps {
  download: DownloadStatus;
  onCancel?: (downloadId: string) => void;
  onRetry?: (downloadId: string) => void;
  isCancelling?: boolean;
  isRetrying?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

/**
 * Individual progress item component for tracking download status
 * Displays progress, status indicators, and provides cancel/retry actions
 */
export const ProgressItem: React.FC<ProgressItemProps> = ({
  download,
  onCancel,
  onRetry,
  isCancelling = false,
  isRetrying = false,
  showDetails = true,
  compact = false,
}) => {
  // Memoized status icon based on download status
  const statusIcon = useMemo(() => {
    switch (download.status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" aria-label="Completed" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" aria-label="Failed" />;
      case 'cancelled':
        return <XMarkIcon className="w-5 h-5 text-gray-500" aria-label="Cancelled" />;
      case 'downloading':
        return <ArrowDownTrayIconSolid className="w-5 h-5 text-blue-500 animate-pulse" aria-label="Downloading" />;
      case 'queued':
        return <ClockIcon className="w-5 h-5 text-yellow-500" aria-label="Queued" />;
      case 'pending':
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" aria-label="Pending" />;
    }
  }, [download.status]);

  // Memoized status text with additional context
  const statusText = useMemo(() => {
    switch (download.status) {
      case 'completed':
        return 'Completed successfully';
      case 'failed':
        return download.error ? `Failed: ${download.error}` : 'Download failed';
      case 'cancelled':
        return 'Download cancelled';
      case 'downloading':
        return download.currentTrack 
          ? `Downloading: ${download.currentTrack}` 
          : 'Downloading...';
      case 'queued':
        return 'Waiting in queue';
      case 'pending':
      default:
        return 'Preparing download';
    }
  }, [download.status, download.error, download.currentTrack]);

  // Memoized progress bar color based on status
  const progressBarColor = useMemo(() => {
    switch (download.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-400';
      case 'downloading':
        return 'bg-blue-500';
      case 'queued':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  }, [download.status]);

  // Check if actions are available
  const canCancel = ['pending', 'queued', 'downloading'].includes(download.status) && onCancel;
  const canRetry = download.status === 'failed' && onRetry;

  // Format time remaining
  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
    return `${Math.ceil(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`;
  }, []);

  // Format download speed
  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }, []);

  // Calculate elapsed time
  const elapsedTime = useMemo(() => {
    if (!download.startTime) return null;
    const now = download.endTime || new Date();
    const elapsed = Math.floor((now.getTime() - download.startTime.getTime()) / 1000);
    return elapsed;
  }, [download.startTime, download.endTime]);

  // Handle cancel action
  const handleCancel = useCallback(() => {
    if (canCancel && !isCancelling) {
      onCancel!(download.id);
    }
  }, [canCancel, isCancelling, onCancel, download.id]);

  // Handle retry action
  const handleRetry = useCallback(() => {
    if (canRetry && !isRetrying) {
      onRetry!(download.id);
    }
  }, [canRetry, isRetrying, onRetry, download.id]);

  return (
    <>
      <div 
        className={`bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-sm ${
          compact ? 'p-3' : 'p-4'
        }`}
        role="article"
        aria-label={`Download progress for ${download.albumTitle} by ${download.artistName}`}
      >
      {/* Header with album info and actions */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {statusIcon}
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {download.albumTitle}
            </p>
            <p className={`text-gray-600 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {download.artistName}
            </p>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-1 ml-2">
          {canRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              aria-label={`Retry download of ${download.albumTitle}`}
              title="Retry download"
            >
              {isRetrying ? (
                <LoadingSpinner size="small" color="primary" inline label="Retrying download" />
              ) : (
                <ArrowPathIcon className="w-4 h-4" />
              )}
            </button>
          )}
          
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label={`Cancel download of ${download.albumTitle}`}
              title="Cancel download"
            >
              {isCancelling ? (
                <LoadingSpinner size="small" color="secondary" inline label="Cancelling download" />
              ) : (
                <XMarkIconSolid className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status and progress */}
      <div className="mb-2">
        <div className={`flex items-center justify-between mb-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
          <span className="truncate flex-1 mr-2">{statusText}</span>
          <span className="font-medium">{Math.round(download.progress)}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ 
              width: `${Math.max(0, Math.min(100, download.progress))}%`,
              transform: download.status === 'downloading' ? 'scaleX(1)' : 'scaleX(1)',
              transformOrigin: 'left'
            }}
            role="progressbar"
            aria-valuenow={download.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Download progress: ${Math.round(download.progress)}%`}
          />
          
          {/* Animated shimmer effect for active downloads */}
          {download.status === 'downloading' && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"
              style={{
                width: `${Math.max(0, Math.min(100, download.progress))}%`,
                backgroundSize: '200% 100%'
              }}
            />
          )}
        </div>
      </div>

      {/* Detailed information */}
      {showDetails && !compact && (
        <div className="space-y-1">
          {/* Track progress */}
          {(download.totalTracks || 0) > 0 && (
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>
                {download.completedTracks || 0} of {download.totalTracks} tracks
              </span>
              {download.status === 'downloading' && download.estimatedTimeRemaining && (
                <span>
                  ~{formatTimeRemaining(download.estimatedTimeRemaining)} remaining
                </span>
              )}
            </div>
          )}

          {/* Download speed and elapsed time */}
          {download.status === 'downloading' && (
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>
                {download.speed && `${formatSpeed(download.speed)}`}
              </span>
              {elapsedTime && (
                <span>
                  {formatTimeRemaining(elapsedTime)} elapsed
                </span>
              )}
            </div>
          )}

          {/* Completion details */}
          {download.status === 'completed' && elapsedTime && (
            <div className="text-xs text-green-600 flex items-center">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              <span>
                Completed in {formatTimeRemaining(elapsedTime)}
              </span>
            </div>
          )}

          {/* Error details */}
          {download.status === 'failed' && download.error && (
            <div className="text-xs text-red-600 flex items-start">
              <InformationCircleIcon className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              <span className="break-words">{download.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Compact mode details */}
      {showDetails && compact && (download.totalTracks || 0) > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {download.completedTracks || 0}/{download.totalTracks} tracks
          {download.status === 'downloading' && download.estimatedTimeRemaining && (
            <span className="ml-2">
              • ~{formatTimeRemaining(download.estimatedTimeRemaining)}
            </span>
          )}
        </div>
      )}
      </div>


    </>
  );
};

export default ProgressItem;
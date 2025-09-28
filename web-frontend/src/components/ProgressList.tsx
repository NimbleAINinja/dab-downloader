import React, { useMemo, useCallback, useState } from 'react';
import { 
  FunnelIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { ProgressItem } from './ProgressItem';
import type { DownloadStatus } from '../types';

export interface ProgressListProps {
  downloads: DownloadStatus[];
  onCancel?: (downloadId: string) => void;
  onRetry?: (downloadId: string) => void;
  onClearCompleted?: () => void;
  onRetryAll?: () => void;
  cancellingIds?: Set<string>;
  retryingIds?: Set<string>;
  maxHeight?: string;
  showFilters?: boolean;
  showActions?: boolean;
  compact?: boolean;
  emptyMessage?: string;
}

type FilterType = 'all' | 'active' | 'completed' | 'failed' | 'cancelled';
type SortType = 'startTime' | 'progress' | 'albumTitle' | 'status';
type SortOrder = 'asc' | 'desc';

/**
 * Progress list component for displaying and managing multiple download progress items
 * Provides filtering, sorting, and batch operations for downloads
 */
export const ProgressList: React.FC<ProgressListProps> = ({
  downloads,
  onCancel,
  onRetry,
  onClearCompleted,
  onRetryAll,
  cancellingIds = new Set(),
  retryingIds = new Set(),
  maxHeight = '24rem', // max-h-96 equivalent
  showFilters = true,
  showActions = true,
  compact = false,
  emptyMessage = 'No downloads yet',
}) => {
  // Local state for filtering and sorting
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('startTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showDetails, setShowDetails] = useState(true);

  // Memoized download statistics
  const stats = useMemo(() => {
    return downloads.reduce(
      (acc, download) => {
        acc.total++;
        switch (download.status) {
          case 'completed':
            acc.completed++;
            break;
          case 'failed':
            acc.failed++;
            break;
          case 'cancelled':
            acc.cancelled++;
            break;
          case 'downloading':
          case 'queued':
          case 'pending':
            acc.active++;
            break;
        }
        return acc;
      },
      { total: 0, active: 0, completed: 0, failed: 0, cancelled: 0 }
    );
  }, [downloads]);

  // Memoized filtered and sorted downloads
  const filteredAndSortedDownloads = useMemo(() => {
    let filtered = downloads;

    // Apply filter
    switch (filter) {
      case 'active':
        filtered = downloads.filter(d => ['pending', 'queued', 'downloading'].includes(d.status));
        break;
      case 'completed':
        filtered = downloads.filter(d => d.status === 'completed');
        break;
      case 'failed':
        filtered = downloads.filter(d => d.status === 'failed');
        break;
      case 'cancelled':
        filtered = downloads.filter(d => d.status === 'cancelled');
        break;
      default:
        filtered = downloads;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'startTime':
          comparison = (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'albumTitle':
          comparison = a.albumTitle.localeCompare(b.albumTitle);
          break;
        case 'status':
          const statusOrder = { pending: 0, queued: 1, downloading: 2, completed: 3, failed: 4, cancelled: 5 };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [downloads, filter, sortBy, sortOrder]);

  // Filter options with counts
  const filterOptions = useMemo(() => [
    { value: 'all', label: `All (${stats.total})`, count: stats.total },
    { value: 'active', label: `Active (${stats.active})`, count: stats.active },
    { value: 'completed', label: `Completed (${stats.completed})`, count: stats.completed },
    { value: 'failed', label: `Failed (${stats.failed})`, count: stats.failed },
    { value: 'cancelled', label: `Cancelled (${stats.cancelled})`, count: stats.cancelled },
  ] as const, [stats]);

  // Sort options
  const sortOptions = [
    { value: 'startTime', label: 'Start Time' },
    { value: 'progress', label: 'Progress' },
    { value: 'albumTitle', label: 'Album Title' },
    { value: 'status', label: 'Status' },
  ] as const;

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSortBy: SortType) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Handle clear completed
  const handleClearCompleted = useCallback(() => {
    if (onClearCompleted && stats.completed > 0) {
      onClearCompleted();
    }
  }, [onClearCompleted, stats.completed]);

  // Handle retry all failed
  const handleRetryAll = useCallback(() => {
    if (onRetryAll && stats.failed > 0) {
      onRetryAll();
    }
  }, [onRetryAll, stats.failed]);

  // Toggle details visibility
  const toggleDetails = useCallback(() => {
    setShowDetails(!showDetails);
  }, [showDetails]);

  // If no downloads, show empty state
  if (downloads.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <ArrowsUpDownIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Downloads
          {stats.total > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({filteredAndSortedDownloads.length} of {stats.total})
            </span>
          )}
        </h3>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            {/* Toggle details button */}
            <button
              onClick={toggleDetails}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={showDetails ? 'Hide details' : 'Show details'}
              aria-label={showDetails ? 'Hide download details' : 'Show download details'}
            >
              {showDetails ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>

            {/* Retry all failed button */}
            {stats.failed > 0 && onRetryAll && (
              <button
                onClick={handleRetryAll}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                title={`Retry ${stats.failed} failed download${stats.failed !== 1 ? 's' : ''}`}
                aria-label={`Retry all failed downloads`}
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            )}

            {/* Clear completed button */}
            {stats.completed > 0 && onClearCompleted && (
              <button
                onClick={handleClearCompleted}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title={`Clear ${stats.completed} completed download${stats.completed !== 1 ? 's' : ''}`}
                aria-label="Clear completed downloads"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters and sorting */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {/* Filter buttons */}
          <div className="flex items-center space-x-1">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 mr-2">Filter:</span>
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange(option.value as FilterType)}
                disabled={option.count === 0}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filter === option.value
                    ? 'bg-blue-500 text-white'
                    : option.count > 0
                    ? 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center space-x-1">
            <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 mr-2">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortType)}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowsUpDownIcon className={`w-3 h-3 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Downloads list */}
      <div 
        className="space-y-2 overflow-y-auto"
        style={{ maxHeight }}
        role="list"
        aria-label="Download progress list"
      >
        {filteredAndSortedDownloads.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              No downloads match the current filter
            </p>
          </div>
        ) : (
          filteredAndSortedDownloads.map((download) => (
            <ProgressItem
              key={download.id}
              download={download}
              onCancel={onCancel}
              onRetry={onRetry}
              isCancelling={cancellingIds.has(download.id)}
              isRetrying={retryingIds.has(download.id)}
              showDetails={showDetails}
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Summary stats */}
      {stats.total > 0 && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
          {stats.active > 0 && <span>{stats.active} active</span>}
          {stats.active > 0 && (stats.completed > 0 || stats.failed > 0) && <span> • </span>}
          {stats.completed > 0 && <span>{stats.completed} completed</span>}
          {stats.completed > 0 && stats.failed > 0 && <span> • </span>}
          {stats.failed > 0 && <span>{stats.failed} failed</span>}
          {stats.cancelled > 0 && (
            <>
              {(stats.active > 0 || stats.completed > 0 || stats.failed > 0) && <span> • </span>}
              <span>{stats.cancelled} cancelled</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressList;
import React, { useState, useCallback, useMemo } from 'react';
import { ProgressList } from './ProgressList';
import type { DownloadStatus } from '../types';

/**
 * Example component demonstrating ProgressList usage with interactive features
 */
export const ProgressListExample: React.FC = () => {
  // Generate example downloads with various states
  const generateExampleDownloads = useCallback((): DownloadStatus[] => {
    const baseTime = Date.now();
    return [
      {
        id: 'download-1',
        albumId: 'album-1',
        albumTitle: 'The Dark Side of the Moon',
        artistName: 'Pink Floyd',
        status: 'downloading',
        progress: 75,
        currentTrack: 'Time',
        totalTracks: 10,
        completedTracks: 7,
        startTime: new Date(baseTime - 8 * 60 * 1000),
        estimatedTimeRemaining: 120,
        speed: 1024 * 1024 * 1.5,
      },
      {
        id: 'download-2',
        albumId: 'album-2',
        albumTitle: 'Abbey Road',
        artistName: 'The Beatles',
        status: 'completed',
        progress: 100,
        totalTracks: 17,
        completedTracks: 17,
        startTime: new Date(baseTime - 15 * 60 * 1000),
        endTime: new Date(baseTime - 5 * 60 * 1000),
      },
      {
        id: 'download-3',
        albumId: 'album-3',
        albumTitle: 'Thriller',
        artistName: 'Michael Jackson',
        status: 'failed',
        progress: 35,
        error: 'Connection timeout after 30 seconds',
        totalTracks: 9,
        completedTracks: 3,
        startTime: new Date(baseTime - 20 * 60 * 1000),
      },
      {
        id: 'download-4',
        albumId: 'album-4',
        albumTitle: 'Random Access Memories',
        artistName: 'Daft Punk',
        status: 'queued',
        progress: 0,
        totalTracks: 13,
        completedTracks: 0,
        startTime: new Date(baseTime - 2 * 60 * 1000),
      },
      {
        id: 'download-5',
        albumId: 'album-5',
        albumTitle: 'Back in Black',
        artistName: 'AC/DC',
        status: 'downloading',
        progress: 45,
        currentTrack: 'You Shook Me All Night Long',
        totalTracks: 10,
        completedTracks: 4,
        startTime: new Date(baseTime - 12 * 60 * 1000),
        estimatedTimeRemaining: 300,
        speed: 1024 * 1024 * 0.8,
      },
      {
        id: 'download-6',
        albumId: 'album-6',
        albumTitle: 'Hotel California',
        artistName: 'Eagles',
        status: 'completed',
        progress: 100,
        totalTracks: 9,
        completedTracks: 9,
        startTime: new Date(baseTime - 25 * 60 * 1000),
        endTime: new Date(baseTime - 15 * 60 * 1000),
      },
      {
        id: 'download-7',
        albumId: 'album-7',
        albumTitle: 'Nevermind',
        artistName: 'Nirvana',
        status: 'failed',
        progress: 60,
        error: 'Insufficient disk space',
        totalTracks: 12,
        completedTracks: 7,
        startTime: new Date(baseTime - 18 * 60 * 1000),
      },
      {
        id: 'download-8',
        albumId: 'album-8',
        albumTitle: 'The Wall',
        artistName: 'Pink Floyd',
        status: 'cancelled',
        progress: 25,
        totalTracks: 26,
        completedTracks: 6,
        startTime: new Date(baseTime - 30 * 60 * 1000),
        endTime: new Date(baseTime - 28 * 60 * 1000),
      },
      {
        id: 'download-9',
        albumId: 'album-9',
        albumTitle: 'Born to Run',
        artistName: 'Bruce Springsteen',
        status: 'pending',
        progress: 0,
        totalTracks: 8,
        completedTracks: 0,
        startTime: new Date(baseTime),
      },
    ];
  }, []);

  const [downloads, setDownloads] = useState<DownloadStatus[]>(generateExampleDownloads);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  // Simulate download progress updates
  const [isSimulating, setIsSimulating] = useState(false);

  const startSimulation = useCallback(() => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    const interval = setInterval(() => {
      setDownloads(prev => prev.map(download => {
        if (download.status === 'downloading' && download.progress < 100) {
          const newProgress = Math.min(100, download.progress + Math.random() * 10);
          const newCompletedTracks = Math.floor((newProgress / 100) * (download.totalTracks || 0));
          
          return {
            ...download,
            progress: newProgress,
            completedTracks: newCompletedTracks,
            estimatedTimeRemaining: download.estimatedTimeRemaining 
              ? Math.max(0, download.estimatedTimeRemaining - 5)
              : undefined,
          };
        }
        return download;
      }));
    }, 2000);

    // Stop simulation after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsSimulating(false);
    }, 30000);
  }, [isSimulating]);

  const handleCancel = useCallback((downloadId: string) => {
    setCancellingIds(prev => new Set([...prev, downloadId]));
    
    setTimeout(() => {
      setDownloads(prev => prev.map(download => 
        download.id === downloadId 
          ? { ...download, status: 'cancelled', endTime: new Date() }
          : download
      ));
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadId);
        return newSet;
      });
    }, 1500);
  }, []);

  const handleRetry = useCallback((downloadId: string) => {
    setRetryingIds(prev => new Set([...prev, downloadId]));
    
    setTimeout(() => {
      setDownloads(prev => prev.map(download => 
        download.id === downloadId 
          ? { 
              ...download, 
              status: 'queued',
              error: undefined,
              startTime: new Date(),
            }
          : download
      ));
      setRetryingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadId);
        return newSet;
      });
    }, 1000);
  }, []);

  const handleClearCompleted = useCallback(() => {
    setDownloads(prev => prev.filter(download => download.status !== 'completed'));
  }, []);

  const handleRetryAll = useCallback(() => {
    const failedIds = downloads
      .filter(download => download.status === 'failed')
      .map(download => download.id);
    
    failedIds.forEach(id => handleRetry(id));
  }, [downloads, handleRetry]);

  const addNewDownload = useCallback(() => {
    const newDownload: DownloadStatus = {
      id: `download-${Date.now()}`,
      albumId: `album-${Date.now()}`,
      albumTitle: `New Album ${Math.floor(Math.random() * 1000)}`,
      artistName: `Artist ${Math.floor(Math.random() * 100)}`,
      status: 'pending',
      progress: 0,
      totalTracks: Math.floor(Math.random() * 15) + 5,
      completedTracks: 0,
      startTime: new Date(),
    };
    
    setDownloads(prev => [newDownload, ...prev]);
  }, []);

  const resetDownloads = useCallback(() => {
    setDownloads(generateExampleDownloads());
    setCancellingIds(new Set());
    setRetryingIds(new Set());
    setIsSimulating(false);
  }, [generateExampleDownloads]);

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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ProgressList Component Example
        </h1>
        <p className="text-gray-600 mb-6">
          Interactive demonstration of the ProgressList component with filtering, sorting, and batch operations
        </p>
      </div>

      {/* Control Panel */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Control Panel
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={addNewDownload}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add New Download
          </button>
          <button
            onClick={startSimulation}
            disabled={isSimulating}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? 'Simulating...' : 'Start Progress Simulation'}
          </button>
          <button
            onClick={resetDownloads}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset Downloads
          </button>
        </div>
        
        {/* Statistics */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-medium">{stats.total}</span>
            </div>
            <div>
              <span className="text-gray-600">Active:</span>
              <span className="ml-2 font-medium text-blue-600">{stats.active}</span>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="ml-2 font-medium text-green-600">{stats.completed}</span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-2 font-medium text-red-600">{stats.failed}</span>
            </div>
            <div>
              <span className="text-gray-600">Cancelled:</span>
              <span className="ml-2 font-medium text-gray-600">{stats.cancelled}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Default Configuration */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Default Configuration
        </h2>
        <ProgressList
          downloads={downloads}
          onCancel={handleCancel}
          onRetry={handleRetry}
          onClearCompleted={handleClearCompleted}
          onRetryAll={handleRetryAll}
          cancellingIds={cancellingIds}
          retryingIds={retryingIds}
          maxHeight="24rem"
          showFilters={true}
          showActions={true}
          compact={false}
        />
      </section>

      {/* Compact Configuration */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Compact Configuration
        </h2>
        <ProgressList
          downloads={downloads.slice(0, 5)}
          onCancel={handleCancel}
          onRetry={handleRetry}
          cancellingIds={cancellingIds}
          retryingIds={retryingIds}
          maxHeight="16rem"
          showFilters={false}
          showActions={false}
          compact={true}
        />
      </section>

      {/* Minimal Configuration */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Minimal Configuration (No Actions)
        </h2>
        <ProgressList
          downloads={downloads.slice(0, 3)}
          maxHeight="12rem"
          showFilters={true}
          showActions={false}
          compact={false}
        />
      </section>

      {/* Empty State */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Empty State
        </h2>
        <ProgressList
          downloads={[]}
          emptyMessage="No downloads in progress"
        />
      </section>

      {/* Usage Information */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Usage Information
        </h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Key Features:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Filtering by status (All, Active, Completed, Failed, Cancelled)</li>
              <li>Sorting by start time, progress, album title, or status</li>
              <li>Batch operations (Clear completed, Retry all failed)</li>
              <li>Real-time progress updates</li>
              <li>Cancel and retry individual downloads</li>
              <li>Compact and detailed view modes</li>
              <li>Configurable maximum height with scrolling</li>
              <li>Statistics summary</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Props:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>downloads</code>: Array of DownloadStatus objects (required)</li>
              <li><code>onCancel</code>: Function to handle cancel actions</li>
              <li><code>onRetry</code>: Function to handle retry actions</li>
              <li><code>onClearCompleted</code>: Function to clear completed downloads</li>
              <li><code>onRetryAll</code>: Function to retry all failed downloads</li>
              <li><code>cancellingIds</code>: Set of download IDs being cancelled</li>
              <li><code>retryingIds</code>: Set of download IDs being retried</li>
              <li><code>maxHeight</code>: Maximum height for the scrollable list</li>
              <li><code>showFilters</code>: Boolean to show/hide filter controls</li>
              <li><code>showActions</code>: Boolean to show/hide action buttons</li>
              <li><code>compact</code>: Boolean for compact display mode</li>
              <li><code>emptyMessage</code>: Custom message for empty state</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgressListExample;
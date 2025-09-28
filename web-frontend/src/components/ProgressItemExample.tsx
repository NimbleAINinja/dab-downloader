import React, { useState } from 'react';
import { ProgressItem } from './ProgressItem';
import type { DownloadStatus } from '../types';

/**
 * Example component demonstrating ProgressItem usage with different states
 */
export const ProgressItemExample: React.FC = () => {
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  // Example download statuses
  const exampleDownloads: DownloadStatus[] = [
    {
      id: 'download-1',
      albumId: 'album-1',
      albumTitle: 'The Dark Side of the Moon',
      artistName: 'Pink Floyd',
      status: 'downloading',
      progress: 65,
      currentTrack: 'Money',
      totalTracks: 10,
      completedTracks: 6,
      startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      estimatedTimeRemaining: 180, // 3 minutes
      speed: 1024 * 1024 * 2, // 2 MB/s
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
      startTime: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      endTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    },
    {
      id: 'download-3',
      albumId: 'album-3',
      albumTitle: 'Thriller',
      artistName: 'Michael Jackson',
      status: 'failed',
      progress: 30,
      error: 'Network connection timeout',
      totalTracks: 9,
      completedTracks: 2,
      startTime: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
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
      startTime: new Date(),
    },
    {
      id: 'download-5',
      albumId: 'album-5',
      albumTitle: 'Back in Black',
      artistName: 'AC/DC',
      status: 'cancelled',
      progress: 45,
      totalTracks: 10,
      completedTracks: 4,
      startTime: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      endTime: new Date(Date.now() - 18 * 60 * 1000), // 18 minutes ago
    },
    {
      id: 'download-6',
      albumId: 'album-6',
      albumTitle: 'Minimal Example',
      artistName: 'Test Artist',
      status: 'pending',
      progress: 0,
    },
  ];

  const handleCancel = (downloadId: string) => {
    setCancellingIds(prev => new Set([...prev, downloadId]));
    
    // Simulate cancellation delay
    setTimeout(() => {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadId);
        return newSet;
      });
      console.log(`Cancelled download: ${downloadId}`);
    }, 2000);
  };

  const handleRetry = (downloadId: string) => {
    setRetryingIds(prev => new Set([...prev, downloadId]));
    
    // Simulate retry delay
    setTimeout(() => {
      setRetryingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(downloadId);
        return newSet;
      });
      console.log(`Retried download: ${downloadId}`);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ProgressItem Component Examples
        </h1>
        <p className="text-gray-600 mb-6">
          Demonstrating different download states and configurations
        </p>
      </div>

      {/* Default Mode Examples */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Default Mode
        </h2>
        <div className="space-y-4">
          {exampleDownloads.map((download) => (
            <ProgressItem
              key={download.id}
              download={download}
              onCancel={handleCancel}
              onRetry={handleRetry}
              isCancelling={cancellingIds.has(download.id)}
              isRetrying={retryingIds.has(download.id)}
              showDetails={true}
              compact={false}
            />
          ))}
        </div>
      </section>

      {/* Compact Mode Examples */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Compact Mode
        </h2>
        <div className="space-y-2">
          {exampleDownloads.slice(0, 3).map((download) => (
            <ProgressItem
              key={`compact-${download.id}`}
              download={download}
              onCancel={handleCancel}
              onRetry={handleRetry}
              isCancelling={cancellingIds.has(download.id)}
              isRetrying={retryingIds.has(download.id)}
              showDetails={true}
              compact={true}
            />
          ))}
        </div>
      </section>

      {/* No Details Mode */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No Details Mode
        </h2>
        <div className="space-y-3">
          {exampleDownloads.slice(0, 2).map((download) => (
            <ProgressItem
              key={`no-details-${download.id}`}
              download={download}
              onCancel={handleCancel}
              onRetry={handleRetry}
              isCancelling={cancellingIds.has(download.id)}
              isRetrying={retryingIds.has(download.id)}
              showDetails={false}
              compact={false}
            />
          ))}
        </div>
      </section>

      {/* No Actions Mode */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          No Actions Mode
        </h2>
        <div className="space-y-3">
          {exampleDownloads.slice(0, 2).map((download) => (
            <ProgressItem
              key={`no-actions-${download.id}`}
              download={download}
              // No onCancel or onRetry props
              showDetails={true}
              compact={false}
            />
          ))}
        </div>
      </section>

      {/* Usage Information */}
      <section className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Usage Information
        </h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Props:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>download</code>: DownloadStatus object (required)</li>
              <li><code>onCancel</code>: Function to handle cancel action (optional)</li>
              <li><code>onRetry</code>: Function to handle retry action (optional)</li>
              <li><code>isCancelling</code>: Boolean indicating if cancel is in progress</li>
              <li><code>isRetrying</code>: Boolean indicating if retry is in progress</li>
              <li><code>showDetails</code>: Boolean to show/hide detailed information</li>
              <li><code>compact</code>: Boolean for compact display mode</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Features:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time progress tracking with visual progress bar</li>
              <li>Status-specific icons and colors</li>
              <li>Cancel and retry actions with loading states</li>
              <li>Time formatting (remaining, elapsed, speed)</li>
              <li>Error message display</li>
              <li>Accessibility support with ARIA labels</li>
              <li>Responsive design</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProgressItemExample;
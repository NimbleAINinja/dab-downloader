import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingOverlay } from './LoadingOverlay';
import { AlbumGridSkeleton } from './skeletons/AlbumGridSkeleton';
import { SearchSkeleton } from './skeletons/SearchSkeleton';
import { DownloadSkeleton } from './skeletons/DownloadSkeleton';

/**
 * Example component demonstrating various loading states and skeleton components
 * This component showcases the loading states implemented for task 15
 */
export const LoadingStatesExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [overlayType, setOverlayType] = useState<'inline' | 'overlay'>('inline');

  const toggleLoading = () => setIsLoading(!isLoading);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Loading States & Skeleton Components
        </h1>
        <p className="text-gray-600 mb-6">
          Demonstration of accessible loading states with smooth transitions
        </p>
        
        <div className="flex items-center justify-center space-x-4 mb-8">
          <button
            onClick={toggleLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isLoading ? 'Stop Loading' : 'Start Loading'}
          </button>
          
          <select
            value={overlayType}
            onChange={(e) => setOverlayType(e.target.value as 'inline' | 'overlay')}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="inline">Inline Loading</option>
            <option value="overlay">Overlay Loading</option>
          </select>
        </div>
      </div>

      {/* Loading Spinners */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Loading Spinners</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Small</h3>
            <LoadingSpinner size="small" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Medium</h3>
            <LoadingSpinner size="medium" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Large</h3>
            <LoadingSpinner size="large" />
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Primary</h3>
            <LoadingSpinner color="primary" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Secondary</h3>
            <LoadingSpinner color="secondary" />
          </div>
          <div className="text-center bg-gray-800 p-3 rounded">
            <h3 className="text-sm font-medium text-white mb-3">White</h3>
            <LoadingSpinner color="white" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Gray</h3>
            <LoadingSpinner color="gray" />
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Loading Overlay</h2>
        <LoadingOverlay
          isLoading={isLoading}
          message="Loading content..."
          overlay={overlayType === 'overlay'}
          blur={overlayType === 'overlay'}
        >
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Sample Content</h3>
            <p className="text-gray-600 mb-4">
              This content will be shown with loading states when the toggle is activated.
              The overlay mode will blur and overlay this content, while inline mode will replace it.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium mb-2">Card 1</h4>
                <p className="text-sm text-gray-600">Sample card content</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium mb-2">Card 2</h4>
                <p className="text-sm text-gray-600">Sample card content</p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium mb-2">Card 3</h4>
                <p className="text-sm text-gray-600">Sample card content</p>
              </div>
            </div>
          </div>
        </LoadingOverlay>
      </section>

      {/* Search Skeleton */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Search Results Skeleton</h2>
        <SearchSkeleton />
      </section>

      {/* Album Grid Skeleton */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Album Grid Skeleton</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Small Size</h3>
            <AlbumGridSkeleton count={8} size="small" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Medium Size</h3>
            <AlbumGridSkeleton count={6} size="medium" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Large Size</h3>
            <AlbumGridSkeleton count={4} size="large" />
          </div>
        </div>
      </section>

      {/* Download Skeleton */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Download Progress Skeleton</h2>
        <DownloadSkeleton count={3} />
      </section>

      {/* Accessibility Information */}
      <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Accessibility Features</h2>
        <ul className="space-y-2 text-blue-800">
          <li>• All loading states include proper ARIA labels and live regions</li>
          <li>• Screen reader announcements for loading state changes</li>
          <li>• Semantic HTML with appropriate roles (status, presentation)</li>
          <li>• Keyboard navigation support maintained during loading</li>
          <li>• High contrast loading indicators for visibility</li>
          <li>• Smooth transitions that don't cause motion sickness</li>
        </ul>
      </section>
    </div>
  );
};

export default LoadingStatesExample;
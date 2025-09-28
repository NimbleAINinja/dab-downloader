import React, { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DownloadPanel } from './DownloadPanel';
import type { Album } from '../types';

// Mock data for demonstration
const mockAlbums: Album[] = [
  {
    id: 'album-1',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    cover: 'https://via.placeholder.com/300x300/1f2937/ffffff?text=DSOTM',
    totalTracks: 10,
    releaseDate: '1973-03-01',
    genre: 'Progressive Rock',
    tracks: [],
  },
  {
    id: 'album-2',
    title: 'Abbey Road',
    artist: 'The Beatles',
    cover: 'https://via.placeholder.com/300x300/374151/ffffff?text=Abbey+Road',
    totalTracks: 17,
    releaseDate: '1969-09-26',
    genre: 'Rock',
    tracks: [],
  },
  {
    id: 'album-3',
    title: 'Thriller',
    artist: 'Michael Jackson',
    cover: 'https://via.placeholder.com/300x300/dc2626/ffffff?text=Thriller',
    totalTracks: 9,
    releaseDate: '1982-11-30',
    genre: 'Pop',
    tracks: [],
  },
  {
    id: 'album-4',
    title: 'Back in Black',
    artist: 'AC/DC',
    cover: 'https://via.placeholder.com/300x300/000000/ffffff?text=Back+in+Black',
    totalTracks: 10,
    releaseDate: '1980-07-25',
    genre: 'Hard Rock',
    tracks: [],
  },
];

// Create a query client for the example
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

interface AlbumSelectorProps {
  albums: Album[];
  selectedAlbums: Album[];
  onSelectionChange: (albums: Album[]) => void;
}

const AlbumSelector: React.FC<AlbumSelectorProps> = ({
  albums,
  selectedAlbums,
  onSelectionChange,
}) => {
  const selectedIds = new Set(selectedAlbums.map(album => album.id));

  const handleAlbumToggle = (album: Album) => {
    if (selectedIds.has(album.id)) {
      onSelectionChange(selectedAlbums.filter(a => a.id !== album.id));
    } else {
      onSelectionChange([...selectedAlbums, album]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAlbums.length === albums.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...albums]);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Available Albums</h3>
        <button
          onClick={handleSelectAll}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {selectedAlbums.length === albums.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {albums.map((album) => (
          <div
            key={album.id}
            className={`
              flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all
              ${selectedIds.has(album.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
            onClick={() => handleAlbumToggle(album)}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(album.id)}
              onChange={() => handleAlbumToggle(album)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded overflow-hidden">
              <img
                src={album.cover}
                alt={`${album.title} cover`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {album.title}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {album.artist}
              </p>
              <p className="text-xs text-gray-500">
                {album.totalTracks} tracks • {album.genre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DownloadSettingsProps {
  format: 'flac' | 'mp3' | 'aac' | 'ogg';
  bitrate: '128' | '192' | '256' | '320' | 'lossless';
  saveAlbumArt: boolean;
  verifyDownloads: boolean;
  onFormatChange: (format: 'flac' | 'mp3' | 'aac' | 'ogg') => void;
  onBitrateChange: (bitrate: '128' | '192' | '256' | '320' | 'lossless') => void;
  onSaveAlbumArtChange: (save: boolean) => void;
  onVerifyDownloadsChange: (verify: boolean) => void;
}

const DownloadSettings: React.FC<DownloadSettingsProps> = ({
  format,
  bitrate,
  saveAlbumArt,
  verifyDownloads,
  onFormatChange,
  onBitrateChange,
  onSaveAlbumArtChange,
  onVerifyDownloadsChange,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audio Format
          </label>
          <select
            value={format}
            onChange={(e) => onFormatChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="flac">FLAC (Lossless)</option>
            <option value="mp3">MP3</option>
            <option value="aac">AAC</option>
            <option value="ogg">OGG Vorbis</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bitrate/Quality
          </label>
          <select
            value={bitrate}
            onChange={(e) => onBitrateChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={format === 'flac'}
          >
            <option value="lossless">Lossless</option>
            <option value="320">320 kbps</option>
            <option value="256">256 kbps</option>
            <option value="192">192 kbps</option>
            <option value="128">128 kbps</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="saveAlbumArt"
            checked={saveAlbumArt}
            onChange={(e) => onSaveAlbumArtChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="saveAlbumArt" className="ml-2 text-sm text-gray-700">
            Save album artwork
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="verifyDownloads"
            checked={verifyDownloads}
            onChange={(e) => onVerifyDownloadsChange(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="verifyDownloads" className="ml-2 text-sm text-gray-700">
            Verify downloads
          </label>
        </div>
      </div>
    </div>
  );
};

export const DownloadPanelExample: React.FC = () => {
  const [selectedAlbums, setSelectedAlbums] = useState<Album[]>([]);
  const [downloadFormat, setDownloadFormat] = useState<'flac' | 'mp3' | 'aac' | 'ogg'>('flac');
  const [downloadBitrate, setDownloadBitrate] = useState<'128' | '192' | '256' | '320' | 'lossless'>('lossless');
  const [saveAlbumArt, setSaveAlbumArt] = useState(true);
  const [verifyDownloads, setVerifyDownloads] = useState(true);

  const handleDownloadStart = useCallback((albumIds: string[]) => {
    console.log('Download started for albums:', albumIds);
    // In a real app, you might want to show a notification or update UI state
  }, []);

  const handleDownloadCancel = useCallback((downloadId: string) => {
    console.log('Download cancelled:', downloadId);
    // In a real app, you might want to show a notification
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedAlbums([]);
  }, []);

  // Auto-adjust bitrate when format changes
  const handleFormatChange = useCallback((format: 'flac' | 'mp3' | 'aac' | 'ogg') => {
    setDownloadFormat(format);
    if (format === 'flac') {
      setDownloadBitrate('lossless');
    } else if (downloadBitrate === 'lossless') {
      setDownloadBitrate('320');
    }
  }, [downloadBitrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Download Panel Example
            </h1>
            <p className="text-gray-600">
              This example demonstrates the DownloadPanel component with album selection and download management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Album Selection and Settings */}
            <div className="space-y-6">
              <AlbumSelector
                albums={mockAlbums}
                selectedAlbums={selectedAlbums}
                onSelectionChange={setSelectedAlbums}
              />

              <DownloadSettings
                format={downloadFormat}
                bitrate={downloadBitrate}
                saveAlbumArt={saveAlbumArt}
                verifyDownloads={verifyDownloads}
                onFormatChange={handleFormatChange}
                onBitrateChange={setDownloadBitrate}
                onSaveAlbumArtChange={setSaveAlbumArt}
                onVerifyDownloadsChange={setVerifyDownloads}
              />
            </div>

            {/* Right Column - Download Panel */}
            <div>
              <DownloadPanel
                selectedAlbums={selectedAlbums}
                onDownloadStart={handleDownloadStart}
                onDownloadCancel={handleDownloadCancel}
                onClearSelection={handleClearSelection}
                downloadFormat={downloadFormat}
                downloadBitrate={downloadBitrate}
                saveAlbumArt={saveAlbumArt}
                verifyDownloads={verifyDownloads}
              />
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-12 bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              How to Use the Download Panel
            </h2>
            <div className="prose prose-sm text-gray-600">
              <ol className="list-decimal list-inside space-y-2">
                <li>Select one or more albums from the "Available Albums" section</li>
                <li>Adjust download settings (format, bitrate, etc.) as needed</li>
                <li>Click the "Download" button in the Download Panel to start downloading</li>
                <li>Monitor download progress in the Downloads section</li>
                <li>Cancel active downloads using the cancel button (×) next to each download</li>
                <li>Use "Clear All" to deselect all albums</li>
              </ol>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 font-medium">Note:</p>
                <p className="text-blue-700 text-sm mt-1">
                  This is a demonstration component. In a real application, the downloads would 
                  communicate with your backend API to actually download music files.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default DownloadPanelExample;
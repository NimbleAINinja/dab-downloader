// TypeScript interfaces and data models for DAB Music Downloader Frontend

// ============================================================================
// Core Data Models
// ============================================================================

/**
 * Artist interface matching Go backend Artist struct
 */
export interface Artist {
  id: string | number; // Can be string or number based on Go backend
  name: string;
  picture?: string;
  albums?: Album[];
  tracks?: Track[];
  bio?: string;
  country?: string;
  followers?: number;
}

/**
 * Album interface matching Go backend Album struct
 */
export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  releaseDate: string;
  tracks: Track[];
  genre?: string;
  type?: string; // "album", "ep", "single", etc.
  label?: string | number;
  upc?: string;
  copyright?: string;
  year?: string;
  totalTracks?: number;
  totalDiscs?: number;
  musicbrainzId?: string;
}

/**
 * Track interface matching Go backend Track struct
 */
export interface Track {
  id: string | number;
  title: string;
  artist: string;
  artistId?: string | number;
  cover: string; // albumCover from Go backend
  releaseDate: string;
  duration: number;
  album?: string;
  albumArtist?: string;
  genre?: string;
  trackNumber?: number;
  discNumber?: number;
  composer?: string;
  producer?: string;
  year?: string;
  isrc?: string;
  copyright?: string;
  albumId?: string;
  musicbrainzId?: string;
}

/**
 * Download status interface for tracking download progress
 */
export interface DownloadStatus {
  id: string;
  albumId: string;
  albumTitle: string;
  artistName: string;
  status: 'pending' | 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentTrack?: string;
  totalTracks?: number;
  completedTracks?: number;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number; // in seconds
  speed?: number; // bytes per second
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Search results response matching Go backend SearchResults struct
 */
export interface SearchResults {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
}

/**
 * Artist search response
 */
export interface ArtistSearchResponse {
  results: Artist[];
}

/**
 * Album search response
 */
export interface AlbumSearchResponse {
  results: Album[];
}

/**
 * Track search response
 */
export interface TrackSearchResponse {
  results: Track[];
}

/**
 * Individual artist response
 */
export interface ArtistResponse {
  artist: Artist;
}

/**
 * Individual album response
 */
export interface AlbumResponse {
  album: Album;
}

/**
 * Individual track response
 */
export interface TrackResponse {
  track: Track;
}

/**
 * Stream URL response
 */
export interface StreamURLResponse {
  url: string;
}

/**
 * Download initiation response
 */
export interface DownloadResponse {
  downloadId: string;
  status: 'initiated' | 'queued' | 'downloading' | 'completed' | 'failed';
  message: string;
  estimatedTime?: number;
}

/**
 * Download statistics response
 */
export interface DownloadStats {
  successCount: number;
  skippedCount: number;
  failedCount: number;
  failedItems: string[];
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Search state for managing search UI
 */
export interface SearchState {
  query: string;
  results: SearchResults;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

/**
 * Selection state for managing album selections
 */
export interface SelectionState {
  selectedAlbums: Set<string>;
  selectAllState: 'none' | 'some' | 'all';
}

/**
 * Download state for managing download operations
 */
export interface DownloadState {
  downloads: Map<string, DownloadStatus>;
  activeDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  totalDownloads: number;
}

/**
 * Global application state
 */
export interface AppState {
  search: SearchState;
  selection: SelectionState;
  downloads: DownloadState;
  selectedArtist: Artist | null;
  albums: Album[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Error categories for different types of errors
 */
export type ErrorType = 'network' | 'api' | 'client' | 'validation' | 'unknown';

/**
 * Structured error information
 */
export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string | number;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * API error response structure
 */
export interface ApiError {
  error: string;
  message: string;
  code?: number;
  details?: string;
}

/**
 * Network error information
 */
export interface NetworkError extends Error {
  code?: string;
  status?: number;
  response?: {
    data?: any;
    status: number;
    statusText: string;
  };
}

// ============================================================================
// API Client Types
// ============================================================================

/**
 * Query parameters for API requests
 */
export interface QueryParam {
  name: string;
  value: string;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  userAgent: string;
}

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  type: 'artist' | 'album' | 'track' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * Download request parameters
 */
export interface DownloadRequest {
  albumIds: string[];
  format?: string;
  bitrate?: string;
  saveAlbumArt?: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Search bar component props
 */
export interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Album card component props
 */
export interface AlbumCardProps {
  album: Album;
  isSelected: boolean;
  onSelect: (albumId: string, selected: boolean) => void;
  showArtist?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Album grid component props
 */
export interface AlbumGridProps {
  albums: Album[];
  selectedAlbums: Set<string>;
  onAlbumSelect: (albumId: string, selected: boolean) => void;
  onSelectAll: () => void;
  isLoading: boolean;
  error?: string | null;
}

/**
 * Download panel component props
 */
export interface DownloadPanelProps {
  selectedAlbums: Album[];
  onDownload: (albumIds: string[]) => void;
  downloads: DownloadStatus[];
  isDownloading: boolean;
}

/**
 * Progress item component props
 */
export interface ProgressItemProps {
  download: DownloadStatus;
  onCancel?: (downloadId: string) => void;
  onRetry?: (downloadId: string) => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Loading state with data
 */
export interface LoadingState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Custom event types for the application
 */
export interface AppEvents {
  'search:started': { query: string };
  'search:completed': { results: SearchResults; query: string };
  'search:failed': { error: string; query: string };
  'album:selected': { albumId: string; selected: boolean };
  'download:started': { downloadId: string; albumIds: string[] };
  'download:progress': { downloadId: string; progress: number };
  'download:completed': { downloadId: string; success: boolean };
  'download:cancelled': { downloadId: string };
  'error:occurred': { error: ErrorState };
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Application configuration
 */
export interface AppConfig {
  api: ApiClientConfig;
  ui: {
    theme: ThemeConfig;
    searchDebounceMs: number;
    maxConcurrentDownloads: number;
    autoRetryFailedDownloads: boolean;
  };
  download: {
    defaultFormat: string;
    defaultBitrate: string;
    saveAlbumArt: boolean;
    verifyDownloads: boolean;
  };
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: any): error is NetworkError {
  return error && typeof error === 'object' && 'code' in error;
}

/**
 * Type guard to check if an error is an API error
 */
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'error' in error;
}

/**
 * Type guard to check if a value is a valid download status
 */
export function isValidDownloadStatus(status: string): status is DownloadStatus['status'] {
  return ['pending', 'queued', 'downloading', 'completed', 'failed', 'cancelled'].includes(status);
}

/**
 * Type guard to check if a search type is valid
 */
export function isValidSearchType(type: string): type is SearchParams['type'] {
  return ['artist', 'album', 'track', 'all'].includes(type);
}

// ============================================================================
// Re-exports from other type files
// ============================================================================

// Export error handling types and utilities
export * from './errors';

// Export validation types and utilities
export * from './validation';

// Export API-specific types
export * from './api';
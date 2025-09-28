// API-specific types and interfaces for DAB Music Downloader Frontend

import type { Artist, Album, Track, SearchResults, DownloadStatus } from './index';

// ============================================================================
// API Endpoint Types
// ============================================================================

/**
 * API endpoint paths matching Go backend routes
 */
export const API_ENDPOINTS = {
  // Search endpoints
  SEARCH: '/api/search',
  SEARCH_ARTIST: '/api/search/artist',
  SEARCH_ALBUM: '/api/search/album',
  SEARCH_TRACK: '/api/search/track',
  
  // Content endpoints
  ARTIST: '/api/artist',
  ALBUM: '/api/album',
  TRACK: '/api/track',
  DISCOGRAPHY: '/api/discography',
  
  // Stream and download endpoints
  STREAM: '/api/stream',
  DOWNLOAD: '/api/download',
  DOWNLOAD_STATUS: '/api/download/status',
  DOWNLOAD_CANCEL: '/api/download/cancel',
  
  // Utility endpoints
  HEALTH: '/api/health',
  VERSION: '/api/version'
} as const;

// ============================================================================
// Request Parameter Types
// ============================================================================

/**
 * Search request parameters
 */
export interface SearchRequestParams {
  q: string; // query
  type?: 'artist' | 'album' | 'track' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * Artist request parameters
 */
export interface ArtistRequestParams {
  artistId: string;
  includeAlbums?: boolean;
  includeTracks?: boolean;
}

/**
 * Album request parameters
 */
export interface AlbumRequestParams {
  albumId: string;
  includeTracks?: boolean;
}

/**
 * Track request parameters
 */
export interface TrackRequestParams {
  trackId: string;
}

/**
 * Discography request parameters
 */
export interface DiscographyRequestParams {
  artistId: string;
  type?: 'album' | 'ep' | 'single' | 'all';
  limit?: number;
  offset?: number;
}

/**
 * Stream request parameters
 */
export interface StreamRequestParams {
  trackId: string;
  quality?: number; // 1-27, where 27 is highest quality FLAC
  format?: 'flac' | 'mp3' | 'aac';
}

/**
 * Download request parameters
 */
export interface DownloadRequestParams {
  albumIds: string[];
  format?: 'flac' | 'mp3' | 'aac' | 'ogg';
  bitrate?: '128' | '192' | '256' | '320' | 'lossless';
  saveAlbumArt?: boolean;
  verifyDownloads?: boolean;
}

/**
 * Download status request parameters
 */
export interface DownloadStatusRequestParams {
  downloadId: string;
}

/**
 * Download cancel request parameters
 */
export interface DownloadCancelRequestParams {
  downloadId: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Search response from API
 */
export interface SearchApiResponse extends ApiResponse<SearchResults> {
  data: SearchResults;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Artist response from API
 */
export interface ArtistApiResponse extends ApiResponse<{ artist: Artist }> {
  data: {
    artist: Artist;
  };
}

/**
 * Album response from API
 */
export interface AlbumApiResponse extends ApiResponse<{ album: Album }> {
  data: {
    album: Album;
  };
}

/**
 * Track response from API
 */
export interface TrackApiResponse extends ApiResponse<{ track: Track }> {
  data: {
    track: Track;
  };
}

/**
 * Discography response from API
 */
export interface DiscographyApiResponse extends ApiResponse<{ albums: Album[] }> {
  data: {
    albums: Album[];
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Stream URL response from API
 */
export interface StreamApiResponse extends ApiResponse<{ url: string }> {
  data: {
    url: string;
    expiresAt?: string;
    quality?: number;
    format?: string;
  };
}

/**
 * Download initiation response from API
 */
export interface DownloadApiResponse extends ApiResponse<{
  downloadId: string;
  status: string;
  message: string;
}> {
  data: {
    downloadId: string;
    status: 'initiated' | 'queued' | 'downloading' | 'completed' | 'failed';
    message: string;
    estimatedTime?: number;
    albumCount: number;
    trackCount: number;
  };
}

/**
 * Download status response from API
 */
export interface DownloadStatusApiResponse extends ApiResponse<DownloadStatus> {
  data: DownloadStatus;
}

/**
 * Health check response from API
 */
export interface HealthApiResponse extends ApiResponse<{
  status: string;
  version: string;
  uptime: number;
}> {
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    services?: {
      dab: 'online' | 'offline';
      spotify?: 'online' | 'offline';
      navidrome?: 'online' | 'offline';
      musicbrainz?: 'online' | 'offline';
    };
  };
}

/**
 * Version response from API
 */
export interface VersionApiResponse extends ApiResponse<{
  version: string;
  buildDate: string;
  gitCommit: string;
}> {
  data: {
    version: string;
    buildDate: string;
    gitCommit: string;
    updateAvailable?: boolean;
    latestVersion?: string;
  };
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: number;
  details?: string;
  timestamp: string;
  path?: string;
  method?: string;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Record<string, string[]>;
}

/**
 * Rate limit error response
 */
export interface RateLimitErrorResponse extends ApiErrorResponse {
  retryAfter: number; // seconds
  limit: number;
  remaining: number;
  resetTime: string;
}

// ============================================================================
// WebSocket Types (for real-time updates)
// ============================================================================

/**
 * WebSocket message types for real-time updates
 */
export type WebSocketMessageType = 
  | 'download_progress'
  | 'download_completed'
  | 'download_failed'
  | 'download_cancelled'
  | 'system_status'
  | 'error';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = any> {
  type: WebSocketMessageType;
  data: T;
  timestamp: string;
  id?: string;
}

/**
 * Download progress WebSocket message
 */
export interface DownloadProgressMessage extends WebSocketMessage<{
  downloadId: string;
  albumId: string;
  albumTitle: string;
  progress: number;
  currentTrack?: string;
  totalTracks: number;
  completedTracks: number;
  speed?: number; // bytes per second
  eta?: number; // estimated time remaining in seconds
}> {
  type: 'download_progress';
}

/**
 * Download completed WebSocket message
 */
export interface DownloadCompletedMessage extends WebSocketMessage<{
  downloadId: string;
  albumId: string;
  albumTitle: string;
  totalTracks: number;
  successfulTracks: number;
  failedTracks: number;
  duration: number; // total download time in seconds
  size: number; // total size in bytes
}> {
  type: 'download_completed';
}

/**
 * Download failed WebSocket message
 */
export interface DownloadFailedMessage extends WebSocketMessage<{
  downloadId: string;
  albumId: string;
  albumTitle: string;
  error: string;
  details?: string;
  retryable: boolean;
}> {
  type: 'download_failed';
}

/**
 * System status WebSocket message
 */
export interface SystemStatusMessage extends WebSocketMessage<{
  activeDownloads: number;
  queuedDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  systemLoad: number;
  memoryUsage: number;
}> {
  type: 'system_status';
}

// ============================================================================
// HTTP Client Configuration
// ============================================================================

/**
 * HTTP client configuration options
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  retryDelayMultiplier: number;
  maxRetryDelay: number;
  userAgent: string;
  headers: Record<string, string>;
  withCredentials: boolean;
}

/**
 * Request interceptor configuration
 */
export interface RequestInterceptorConfig {
  onRequest?: (config: any) => any;
  onRequestError?: (error: any) => Promise<any>;
}

/**
 * Response interceptor configuration
 */
export interface ResponseInterceptorConfig {
  onResponse?: (response: any) => any;
  onResponseError?: (error: any) => Promise<any>;
}

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache configuration for API responses
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // time to live in milliseconds
  maxSize: number; // maximum number of cached items
  strategy: 'lru' | 'fifo' | 'ttl';
}

/**
 * Cache key configuration
 */
export interface CacheKeyConfig {
  includeParams: boolean;
  includeHeaders: boolean;
  customKeyGenerator?: (url: string, params?: any, headers?: any) => string;
}

// ============================================================================
// Type Guards for API Responses
// ============================================================================

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return response && response.success === false && typeof response.error === 'string';
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(response: any): response is ValidationErrorResponse {
  return isErrorResponse(response) && 'errors' in response && typeof response.errors === 'object';
}

/**
 * Type guard to check if error is a rate limit error
 */
export function isRateLimitError(response: any): response is RateLimitErrorResponse {
  return isErrorResponse(response) && 'retryAfter' in response && typeof response.retryAfter === 'number';
}

/**
 * Type guard to check if message is a WebSocket message
 */
export function isWebSocketMessage(data: any): data is WebSocketMessage {
  return data && typeof data === 'object' && typeof data.type === 'string' && data.timestamp;
}

/**
 * Type guard to check if WebSocket message is download progress
 */
export function isDownloadProgressMessage(message: WebSocketMessage): message is DownloadProgressMessage {
  return message.type === 'download_progress';
}

/**
 * Type guard to check if WebSocket message is download completed
 */
export function isDownloadCompletedMessage(message: WebSocketMessage): message is DownloadCompletedMessage {
  return message.type === 'download_completed';
}

/**
 * Type guard to check if WebSocket message is download failed
 */
export function isDownloadFailedMessage(message: WebSocketMessage): message is DownloadFailedMessage {
  return message.type === 'download_failed';
}
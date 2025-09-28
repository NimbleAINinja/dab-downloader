// DAB API Client Service for communicating with the Go backend
// Implements search and album fetching functionality with error handling and retry logic

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { 
  Artist, 
  Album, 
  SearchResults,
  ErrorState,
  DownloadStatus,
  DownloadResponse
} from '../types';
import type { 
  SearchRequestParams,
  ArtistRequestParams,
  DiscographyRequestParams,
  DownloadRequestParams,
  DownloadStatusRequestParams,
  DownloadCancelRequestParams,
  ApiResponse,
} from '../types/api';
import { API_ENDPOINTS } from '../types/api';
import { ErrorHandler, retryWithBackoff, withTimeout } from '../types/errors';

/**
 * Configuration options for the DAB API client
 */
export interface DabApiClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  userAgent: string;
}

/**
 * Default configuration for the DAB API client
 */
const DEFAULT_CONFIG: DabApiClientConfig = {
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  userAgent: 'DAB-Frontend/1.0'
};

/**
 * DAB API Client class for communicating with the Go backend
 * Provides methods for searching artists and fetching album data
 */
export class DabApiClient {
  private httpClient: AxiosInstance;
  private config: DabApiClientConfig;

  constructor(config: Partial<DabApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.httpClient = this.createHttpClient();
  }

  /**
   * Creates and configures the Axios HTTP client
   */
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.config.userAgent
      }
    });

    // Request interceptor for logging and request modification
    client.interceptors.request.use(
      (config) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error: AxiosError) => {
        console.error('[API Response Error]', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );

    return client;
  }

  /**
   * Generic method for making API requests with retry logic
   */
  private async makeRequest<T>(
    requestConfig: AxiosRequestConfig
  ): Promise<T> {
    const operation = async () => {
      const response = await withTimeout(
        this.httpClient.request<ApiResponse<T>>(requestConfig),
        this.config.timeout,
        'Request timed out'
      );

      // Check if the response indicates success
      if (!response.data.success) {
        throw new Error(response.data.error || 'API request failed');
      }

      return response.data.data as T;
    };

    try {
      return await retryWithBackoff(
        operation,
        this.config.maxRetries,
        this.config.retryDelay
      );
    } catch (error) {
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }

  /**
   * Search for artists using the DAB API
   * @param query - The search query string
   * @param options - Optional search parameters
   * @returns Promise resolving to search results
   */
  async searchArtists(
    query: string, 
    options: Partial<SearchRequestParams> = {}
  ): Promise<Artist[]> {
    if (!query || query.trim().length === 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('Search query cannot be empty')
      );
    }

    const params: SearchRequestParams = {
      q: query.trim(),
      type: 'artist',
      limit: 20,
      ...options
    };

    try {
      const searchResults = await this.makeRequest<SearchResults>({
        method: 'GET',
        url: API_ENDPOINTS.SEARCH,
        params
      });

      return searchResults.artists || [];
    } catch (error) {
      if (error instanceof DabApiError) {
        throw error;
      }
      
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }

  /**
   * Get albums for a specific artist (discography)
   * @param artistId - The artist ID
   * @param options - Optional request parameters
   * @returns Promise resolving to array of albums
   */
  async getArtistAlbums(
    artistId: string,
    options: Partial<DiscographyRequestParams> = {}
  ): Promise<Album[]> {
    if (!artistId || artistId.trim().length === 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('Artist ID cannot be empty')
      );
    }

    const params: DiscographyRequestParams = {
      artistId: artistId.trim(),
      type: 'all',
      limit: 50,
      ...options
    };

    try {
      const response = await this.makeRequest<{ albums: Album[] }>({
        method: 'GET',
        url: API_ENDPOINTS.DISCOGRAPHY,
        params
      });

      return response.albums || [];
    } catch (error) {
      if (error instanceof DabApiError) {
        throw error;
      }
      
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }

  /**
   * Get detailed information about a specific artist
   * @param artistId - The artist ID
   * @param options - Optional request parameters
   * @returns Promise resolving to artist details
   */
  async getArtist(
    artistId: string,
    options: Partial<ArtistRequestParams> = {}
  ): Promise<Artist> {
    if (!artistId || artistId.trim().length === 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('Artist ID cannot be empty')
      );
    }

    const params: ArtistRequestParams = {
      artistId: artistId.trim(),
      includeAlbums: false,
      ...options
    };

    try {
      const response = await this.makeRequest<{ artist: Artist }>({
        method: 'GET',
        url: API_ENDPOINTS.ARTIST,
        params
      });

      return response.artist;
    } catch (error) {
      if (error instanceof DabApiError) {
        throw error;
      }
      
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }

  /**
   * Test the connection to the DAB API
   * @returns Promise resolving to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        url: API_ENDPOINTS.HEALTH,
        timeout: 5000 // Shorter timeout for health check
      });
      return true;
    } catch (error) {
      console.warn('[DAB API] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Update the base URL for the API client
   * @param baseURL - New base URL
   */
  updateBaseURL(baseURL: string): void {
    this.config.baseURL = baseURL;
    this.httpClient.defaults.baseURL = baseURL;
  }

  /**
   * Get current configuration
   */
  getConfig(): DabApiClientConfig {
    return { ...this.config };
  }

  /**
   * Initiate download for one or more albums
   * @param albumIds - Array of album IDs to download
   * @param options - Optional download parameters
   * @returns Promise resolving to download response with download ID and status
   */
  async downloadAlbum(
    albumIds: string[],
    options: Partial<DownloadRequestParams> = {}
  ): Promise<DownloadResponse> {
    if (!albumIds || albumIds.length === 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('At least one album ID is required for download')
      );
    }

    // Validate album IDs
    const invalidIds = albumIds.filter(id => !id || id.trim().length === 0);
    if (invalidIds.length > 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('All album IDs must be non-empty strings')
      );
    }

    const requestData: DownloadRequestParams = {
      albumIds: albumIds.map(id => id.trim()),
      format: 'flac',
      bitrate: 'lossless',
      saveAlbumArt: true,
      verifyDownloads: true,
      ...options
    };

    try {
      const response = await this.makeRequest<{
        downloadId: string;
        status: string;
        message: string;
        estimatedTime?: number;
        albumCount: number;
        trackCount: number;
      }>({
        method: 'POST',
        url: API_ENDPOINTS.DOWNLOAD,
        data: requestData
      });

      return {
        downloadId: response.downloadId,
        status: response.status as DownloadResponse['status'],
        message: response.message,
        estimatedTime: response.estimatedTime
      };
    } catch (error) {
      if (error instanceof DabApiError) {
        throw error;
      }
      
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }

  /**
   * Get download status and progress information
   * @param downloadId - The download ID to check status for
   * @returns Promise resolving to download status information
   */
  async getDownloadStatus(downloadId: string): Promise<DownloadStatus> {
    if (!downloadId || downloadId.trim().length === 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('Download ID cannot be empty')
      );
    }

    const params: DownloadStatusRequestParams = {
      downloadId: downloadId.trim()
    };

    try {
      const response = await this.makeRequest<DownloadStatus>({
        method: 'GET',
        url: API_ENDPOINTS.DOWNLOAD_STATUS,
        params
      });

      // Ensure the response has all required fields with defaults
      return {
        id: response.id || downloadId,
        albumId: response.albumId || '',
        albumTitle: response.albumTitle || 'Unknown Album',
        artistName: response.artistName || 'Unknown Artist',
        status: response.status || 'pending',
        progress: Math.max(0, Math.min(100, response.progress || 0)),
        currentTrack: response.currentTrack,
        totalTracks: response.totalTracks || 0,
        completedTracks: response.completedTracks || 0,
        error: response.error,
        startTime: response.startTime ? new Date(response.startTime) : undefined,
        endTime: response.endTime ? new Date(response.endTime) : undefined,
        estimatedTimeRemaining: response.estimatedTimeRemaining
      };
    } catch (error) {
      if (error instanceof DabApiError) {
        throw error;
      }
      
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }

  /**
   * Cancel an active download
   * @param downloadId - The download ID to cancel
   * @returns Promise resolving when cancellation is successful
   */
  async cancelDownload(downloadId: string): Promise<void> {
    if (!downloadId || downloadId.trim().length === 0) {
      throw new DabApiError(
        ErrorHandler.handleValidationError('Download ID cannot be empty')
      );
    }

    const requestData: DownloadCancelRequestParams = {
      downloadId: downloadId.trim()
    };

    try {
      await this.makeRequest<{ success: boolean; message: string }>({
        method: 'POST',
        url: API_ENDPOINTS.DOWNLOAD_CANCEL,
        data: requestData
      });

      // If we reach here, the cancellation was successful
      // The makeRequest method will throw an error if the API returns an error response
    } catch (error) {
      if (error instanceof DabApiError) {
        throw error;
      }
      
      const errorState = ErrorHandler.handleApiError(error);
      throw new DabApiError(errorState);
    }
  }
}

/**
 * Custom error class for DAB API errors
 */
export class DabApiError extends Error {
  public readonly errorState: ErrorState;

  constructor(errorState: ErrorState) {
    super(errorState.message);
    this.name = 'DabApiError';
    this.errorState = errorState;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(): string {
    return ErrorHandler.getUserFriendlyMessage(this.errorState);
  }

  /**
   * Check if the error is retryable
   */
  isRetryable(): boolean {
    return this.errorState.retryable;
  }

  /**
   * Get error type
   */
  getType(): string {
    return this.errorState.type;
  }

  /**
   * Get error code if available
   */
  getCode(): string | number | undefined {
    return this.errorState.code;
  }
}

/**
 * Create a singleton instance of the DAB API client
 * Only create if not in test environment
 */
let dabApiClient: DabApiClient;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  dabApiClient = new DabApiClient();
}

/**
 * Get or create the singleton DAB API client instance
 */
export function getDabApiClient(): DabApiClient {
  if (!dabApiClient) {
    dabApiClient = new DabApiClient();
  }
  return dabApiClient;
}

/**
 * Export the client getter as default
 */
export default getDabApiClient;
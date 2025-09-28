// Tests for DAB API Client Service

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { DabApiClient, DabApiError } from '../DabApiClient';
import type { Artist, Album } from '../../types';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
    isAxiosError: vi.fn()
  }
}));
const mockedAxios = vi.mocked(axios);

describe('DabApiClient', () => {
  let client: DabApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock axios instance
    mockAxiosInstance = {
      request: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      defaults: { baseURL: '' }
    };
    
    (mockedAxios.create as any).mockReturnValue(mockAxiosInstance);
    
    // Create client instance
    client = new DabApiClient({
      baseURL: 'http://localhost:8080',
      timeout: 5000,
      maxRetries: 1, // Reduce retries for faster tests
      retryDelay: 100
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      new DabApiClient();
      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('should create client with custom config', () => {
      const customConfig = {
        baseURL: 'http://custom.api',
        timeout: 10000
      };
      
      new DabApiClient(customConfig);
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://custom.api',
          timeout: 10000
        })
      );
    });
  });

  describe('searchArtists', () => {
    const mockArtists: Artist[] = [
      {
        id: '1',
        name: 'Arctic Monkeys',
        picture: 'https://example.com/artist1.jpg'
      },
      {
        id: '2',
        name: 'The Strokes',
        picture: 'https://example.com/artist2.jpg'
      }
    ];

    it('should search for artists successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            artists: mockArtists
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.searchArtists('Arctic Monkeys');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/search',
        params: {
          q: 'Arctic Monkeys',
          type: 'artist',
          limit: 20
        }
      });

      expect(result).toEqual(mockArtists);
    });

    it('should handle empty search query', async () => {
      await expect(client.searchArtists('')).rejects.toThrow(DabApiError);
      await expect(client.searchArtists('   ')).rejects.toThrow(DabApiError);
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        data: {
          success: false,
          error: 'Search failed'
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockErrorResponse);

      await expect(client.searchArtists('test')).rejects.toThrow(DabApiError);
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      await expect(client.searchArtists('test')).rejects.toThrow(DabApiError);
    });

    it('should trim search query', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            artists: mockArtists
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.searchArtists('  Arctic Monkeys  ');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Arctic Monkeys'
          })
        })
      );
    });

    it('should handle custom search options', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            artists: mockArtists
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.searchArtists('test', { limit: 10, offset: 5 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 10,
            offset: 5
          })
        })
      );
    });
  });

  describe('getArtistAlbums', () => {
    const mockAlbums: Album[] = [
      {
        id: '1',
        title: 'AM',
        artist: 'Arctic Monkeys',
        cover: 'https://example.com/album1.jpg',
        totalTracks: 12,
        releaseDate: '2013-09-09',
        tracks: []
      },
      {
        id: '2',
        title: 'Whatever People Say I Am, That\'s What I\'m Not',
        artist: 'Arctic Monkeys',
        cover: 'https://example.com/album2.jpg',
        totalTracks: 13,
        releaseDate: '2006-01-23',
        tracks: []
      }
    ];

    it('should get artist albums successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            albums: mockAlbums
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getArtistAlbums('artist1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/discography',
        params: {
          artistId: 'artist1',
          type: 'all',
          limit: 50
        }
      });

      expect(result).toEqual(mockAlbums);
    });

    it('should handle empty artist ID', async () => {
      await expect(client.getArtistAlbums('')).rejects.toThrow(DabApiError);
      await expect(client.getArtistAlbums('   ')).rejects.toThrow(DabApiError);
    });

    it('should handle custom options', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            albums: mockAlbums
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.getArtistAlbums('artist1', { type: 'album', limit: 25 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            type: 'album',
            limit: 25
          })
        })
      );
    });

    it('should trim artist ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            albums: mockAlbums
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.getArtistAlbums('  artist1  ');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            artistId: 'artist1'
          })
        })
      );
    });
  });

  describe('getArtist', () => {
    const mockArtist: Artist = {
      id: 'artist1',
      name: 'Arctic Monkeys',
      picture: 'https://example.com/artist.jpg'
    };

    it('should get artist details successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            artist: mockArtist
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getArtist('artist1');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/artist',
        params: {
          artistId: 'artist1',
          includeAlbums: false
        }
      });

      expect(result).toEqual(mockArtist);
    });

    it('should handle empty artist ID', async () => {
      await expect(client.getArtist('')).rejects.toThrow(DabApiError);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { status: 'healthy' }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/health',
        timeout: 5000
      });
    });

    it('should return false for failed connection', async () => {
      mockAxiosInstance.request.mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('updateBaseURL', () => {
    it('should update base URL', () => {
      const newURL = 'http://new.api.url';
      client.updateBaseURL(newURL);

      expect(mockAxiosInstance.defaults.baseURL).toBe(newURL);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = client.getConfig();
      
      expect(config).toEqual(
        expect.objectContaining({
          baseURL: 'http://localhost:8080',
          timeout: 5000,
          maxRetries: 1,
          retryDelay: 100
        })
      );
    });
  });

  describe('downloadAlbum', () => {
    const mockDownloadResponse = {
      downloadId: 'download-123',
      status: 'initiated',
      message: 'Download started successfully',
      estimatedTime: 300,
      albumCount: 2,
      trackCount: 24
    };

    it('should initiate album download successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockDownloadResponse
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.downloadAlbum(['album1', 'album2']);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/download',
        data: {
          albumIds: ['album1', 'album2'],
          format: 'flac',
          bitrate: 'lossless',
          saveAlbumArt: true,
          verifyDownloads: true
        }
      });

      expect(result).toEqual({
        downloadId: 'download-123',
        status: 'initiated',
        message: 'Download started successfully',
        estimatedTime: 300
      });
    });

    it('should handle empty album IDs array', async () => {
      await expect(client.downloadAlbum([])).rejects.toThrow(DabApiError);
    });

    it('should handle invalid album IDs', async () => {
      await expect(client.downloadAlbum(['', '  ', 'valid-id'])).rejects.toThrow(DabApiError);
    });

    it('should trim album IDs', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockDownloadResponse
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.downloadAlbum(['  album1  ', '  album2  ']);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            albumIds: ['album1', 'album2']
          })
        })
      );
    });

    it('should handle custom download options', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockDownloadResponse
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.downloadAlbum(['album1'], {
        format: 'mp3',
        bitrate: '320',
        saveAlbumArt: false
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            format: 'mp3',
            bitrate: '320',
            saveAlbumArt: false
          })
        })
      );
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        data: {
          success: false,
          error: 'Download failed'
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockErrorResponse);

      await expect(client.downloadAlbum(['album1'])).rejects.toThrow(DabApiError);
    });
  });

  describe('getDownloadStatus', () => {
    const mockDownloadStatus = {
      id: 'download-123',
      albumId: 'album1',
      albumTitle: 'Test Album',
      artistName: 'Test Artist',
      status: 'downloading',
      progress: 45,
      currentTrack: 'Track 5',
      totalTracks: 12,
      completedTracks: 5,
      startTime: '2023-01-01T10:00:00Z',
      estimatedTimeRemaining: 180
    };

    it('should get download status successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockDownloadStatus
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getDownloadStatus('download-123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/download/status',
        params: {
          downloadId: 'download-123'
        }
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: 'download-123',
          albumId: 'album1',
          albumTitle: 'Test Album',
          artistName: 'Test Artist',
          status: 'downloading',
          progress: 45,
          currentTrack: 'Track 5',
          totalTracks: 12,
          completedTracks: 5,
          estimatedTimeRemaining: 180
        })
      );
      expect(result.startTime).toBeInstanceOf(Date);
    });

    it('should handle empty download ID', async () => {
      await expect(client.getDownloadStatus('')).rejects.toThrow(DabApiError);
      await expect(client.getDownloadStatus('   ')).rejects.toThrow(DabApiError);
    });

    it('should trim download ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockDownloadStatus
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.getDownloadStatus('  download-123  ');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            downloadId: 'download-123'
          })
        })
      );
    });

    it('should handle missing fields with defaults', async () => {
      const incompleteStatus = {
        id: 'download-123'
      };

      const mockResponse = {
        data: {
          success: true,
          data: incompleteStatus
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getDownloadStatus('download-123');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'download-123',
          albumId: '',
          albumTitle: 'Unknown Album',
          artistName: 'Unknown Artist',
          status: 'pending',
          progress: 0,
          totalTracks: 0,
          completedTracks: 0
        })
      );
    });

    it('should clamp progress between 0 and 100', async () => {
      const statusWithInvalidProgress = {
        ...mockDownloadStatus,
        progress: 150 // Invalid progress > 100
      };

      const mockResponse = {
        data: {
          success: true,
          data: statusWithInvalidProgress
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.getDownloadStatus('download-123');

      expect(result.progress).toBe(100);
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        data: {
          success: false,
          error: 'Download not found'
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockErrorResponse);

      await expect(client.getDownloadStatus('invalid-id')).rejects.toThrow(DabApiError);
    });
  });

  describe('cancelDownload', () => {
    it('should cancel download successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            success: true,
            message: 'Download cancelled successfully'
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await expect(client.cancelDownload('download-123')).resolves.not.toThrow();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/download/cancel',
        data: {
          downloadId: 'download-123'
        }
      });
    });

    it('should handle empty download ID', async () => {
      await expect(client.cancelDownload('')).rejects.toThrow(DabApiError);
      await expect(client.cancelDownload('   ')).rejects.toThrow(DabApiError);
    });

    it('should trim download ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            success: true,
            message: 'Download cancelled successfully'
          }
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      await client.cancelDownload('  download-123  ');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            downloadId: 'download-123'
          })
        })
      );
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        data: {
          success: false,
          error: 'Cannot cancel completed download'
        }
      };

      mockAxiosInstance.request.mockResolvedValue(mockErrorResponse);

      await expect(client.cancelDownload('download-123')).rejects.toThrow(DabApiError);
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      await expect(client.cancelDownload('download-123')).rejects.toThrow(DabApiError);
    });
  });
});

describe('DabApiError', () => {
  it('should create error with error state', () => {
    const errorState = {
      type: 'api' as const,
      message: 'Test error',
      details: 'Error details',
      retryable: true,
      timestamp: new Date()
    };

    const error = new DabApiError(errorState);

    expect(error.name).toBe('DabApiError');
    expect(error.message).toBe('Test error');
    expect(error.errorState).toEqual(errorState);
    expect(error.isRetryable()).toBe(true);
    expect(error.getType()).toBe('api');
  });

  it('should provide user-friendly message', () => {
    const errorState = {
      type: 'network' as const,
      message: 'Network error',
      retryable: true,
      timestamp: new Date()
    };

    const error = new DabApiError(errorState);
    const friendlyMessage = error.getUserFriendlyMessage();

    expect(friendlyMessage).toContain('Connection lost');
  });
});
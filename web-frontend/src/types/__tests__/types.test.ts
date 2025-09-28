// Tests for TypeScript interfaces and data models

import { describe, it, expect } from 'vitest';
import type {
  Artist,
  Album,
  Track,
  DownloadStatus,
  SearchResults,
} from '../index';
import {
  isNetworkError,
  isApiError,
  isValidDownloadStatus,
  isValidSearchType,
  validateSearchQuery,
  validateAlbumIds,
  sanitizeSearchQuery,
  ErrorHandler
} from '../index';

describe('Type Definitions', () => {
  describe('Core Data Models', () => {
    it('should create valid Artist interface', () => {
      const artist: Artist = {
        id: '123',
        name: 'Test Artist',
        picture: 'https://example.com/artist.jpg'
      };
      
      expect(artist.id).toBe('123');
      expect(artist.name).toBe('Test Artist');
      expect(artist.picture).toBe('https://example.com/artist.jpg');
    });

    it('should create valid Album interface', () => {
      const album: Album = {
        id: 'album123',
        title: 'Test Album',
        artist: 'Test Artist',
        cover: 'https://example.com/cover.jpg',
        releaseDate: '2023-01-01',
        tracks: []
      };
      
      expect(album.id).toBe('album123');
      expect(album.title).toBe('Test Album');
      expect(album.tracks).toEqual([]);
    });

    it('should create valid Track interface', () => {
      const track: Track = {
        id: 'track123',
        title: 'Test Track',
        artist: 'Test Artist',
        cover: 'https://example.com/cover.jpg',
        releaseDate: '2023-01-01',
        duration: 180
      };
      
      expect(track.id).toBe('track123');
      expect(track.duration).toBe(180);
    });

    it('should create valid DownloadStatus interface', () => {
      const downloadStatus: DownloadStatus = {
        id: 'download123',
        albumId: 'album123',
        albumTitle: 'Test Album',
        artistName: 'Test Artist',
        status: 'downloading',
        progress: 50
      };
      
      expect(downloadStatus.status).toBe('downloading');
      expect(downloadStatus.progress).toBe(50);
    });
  });

  describe('Type Guards', () => {
    it('should validate download status correctly', () => {
      expect(isValidDownloadStatus('downloading')).toBe(true);
      expect(isValidDownloadStatus('completed')).toBe(true);
      expect(isValidDownloadStatus('invalid')).toBe(false);
    });

    it('should validate search type correctly', () => {
      expect(isValidSearchType('artist')).toBe(true);
      expect(isValidSearchType('album')).toBe(true);
      expect(isValidSearchType('invalid')).toBe(false);
    });

    it('should identify network errors', () => {
      const networkError = { code: 'ECONNREFUSED', message: 'Connection refused' };
      const regularError = { message: 'Regular error' };
      
      expect(isNetworkError(networkError)).toBe(true);
      expect(isNetworkError(regularError)).toBe(false);
    });

    it('should identify API errors', () => {
      const apiError = { error: 'API Error', message: 'Something went wrong' };
      const regularError = { message: 'Regular error' };
      
      expect(isApiError(apiError)).toBe(true);
      expect(isApiError(regularError)).toBe(false);
    });
  });

  describe('Validation Functions', () => {
    it('should validate search queries', () => {
      const validQuery = validateSearchQuery('Arctic Monkeys');
      expect(validQuery.isValid).toBe(true);
      expect(validQuery.errors).toEqual({});

      const emptyQuery = validateSearchQuery('');
      expect(emptyQuery.isValid).toBe(false);
      expect(emptyQuery.errors.query).toBeDefined();

      const longQuery = validateSearchQuery('a'.repeat(101));
      expect(longQuery.isValid).toBe(false);
      expect(longQuery.errors.query).toBeDefined();
    });

    it('should validate album IDs', () => {
      const validIds = validateAlbumIds(['album1', 'album2']);
      expect(validIds.isValid).toBe(true);

      const emptyIds = validateAlbumIds([]);
      expect(emptyIds.isValid).toBe(false);
      expect(emptyIds.errors.albumIds).toBeDefined();

      const duplicateIds = validateAlbumIds(['album1', 'album1']);
      expect(duplicateIds.isValid).toBe(false);
      expect(duplicateIds.errors.albumIds).toContain('Duplicate');
    });

    it('should sanitize search queries', () => {
      expect(sanitizeSearchQuery('  Arctic   Monkeys  ')).toBe('Arctic Monkeys');
      expect(sanitizeSearchQuery('')).toBe('');
      expect(sanitizeSearchQuery('a'.repeat(101))).toHaveLength(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', () => {
      const mockApiError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' }
        },
        config: { url: '/api/test', method: 'GET' }
      };

      const errorState = ErrorHandler.handleApiError(mockApiError);
      
      expect(errorState.type).toBe('api');
      expect(errorState.code).toBe(404);
      expect(errorState.message).toBe('Resource not found');
      expect(errorState.retryable).toBe(false);
    });

    it('should handle network errors correctly', () => {
      const networkError = new Error('Network connection failed');
      const errorState = ErrorHandler.handleNetworkError(networkError);
      
      expect(errorState.type).toBe('network');
      expect(errorState.retryable).toBe(true);
      expect(errorState.message).toContain('connection');
    });

    it('should provide user-friendly error messages', () => {
      const networkError = {
        type: 'network' as const,
        message: 'Connection failed',
        retryable: true,
        timestamp: new Date()
      };

      const userMessage = ErrorHandler.getUserFriendlyMessage(networkError);
      expect(userMessage).toContain('Connection lost');
    });
  });
});

describe('SearchResults Interface', () => {
  it('should create valid SearchResults', () => {
    const searchResults: SearchResults = {
      artists: [
        {
          id: '1',
          name: 'Test Artist',
          picture: 'https://example.com/artist.jpg'
        }
      ],
      albums: [
        {
          id: 'album1',
          title: 'Test Album',
          artist: 'Test Artist',
          cover: 'https://example.com/cover.jpg',
          releaseDate: '2023-01-01',
          tracks: []
        }
      ],
      tracks: []
    };

    expect(searchResults.artists).toHaveLength(1);
    expect(searchResults.albums).toHaveLength(1);
    expect(searchResults.tracks).toHaveLength(0);
  });
});
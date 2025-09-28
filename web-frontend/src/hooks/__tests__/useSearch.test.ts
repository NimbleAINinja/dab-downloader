// Tests for search hooks
// Ensures React Query integration works correctly for search functionality

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchArtists, useSearchHistory } from '../useSearch';
import { getDabApiClient } from '../../services/DabApiClient';
import type { Artist } from '../../types';

// Mock the API client
vi.mock('../../services/DabApiClient');

const mockGetDabApiClient = vi.mocked(getDabApiClient);

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useSearchArtists', () => {
  const mockArtists: Artist[] = [
    {
      id: '1',
      name: 'Test Artist 1',
      picture: 'https://example.com/artist1.jpg',
    },
    {
      id: '2',
      name: 'Test Artist 2',
      picture: 'https://example.com/artist2.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return loading state initially', () => {
    const mockClient = {
      searchArtists: vi.fn().mockResolvedValue(mockArtists),
    };
    mockGetDabApiClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(
      () => useSearchArtists('test query'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });

  it('should fetch artists successfully', async () => {
    const mockClient = {
      searchArtists: vi.fn().mockResolvedValue(mockArtists),
    };
    mockGetDabApiClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(
      () => useSearchArtists('test query'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockArtists);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.searchArtists).toHaveBeenCalledWith('test query');
  });

  it('should handle search errors', async () => {
    const mockError = new Error('Search failed');
    const mockClient = {
      searchArtists: vi.fn().mockRejectedValue(mockError),
    };
    mockGetDabApiClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(
      () => useSearchArtists('test query'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    }, { timeout: 3000 });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should not search for empty queries', () => {
    const mockClient = {
      searchArtists: vi.fn().mockResolvedValue(mockArtists),
    };
    mockGetDabApiClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(
      () => useSearchArtists(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockClient.searchArtists).not.toHaveBeenCalled();
  });

  it('should not search for queries shorter than 2 characters', () => {
    const mockClient = {
      searchArtists: vi.fn().mockResolvedValue(mockArtists),
    };
    mockGetDabApiClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(
      () => useSearchArtists('a'),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockClient.searchArtists).not.toHaveBeenCalled();
  });

  it('should respect enabled option', () => {
    const mockClient = {
      searchArtists: vi.fn().mockResolvedValue(mockArtists),
    };
    mockGetDabApiClient.mockReturnValue(mockClient as any);

    const { result } = renderHook(
      () => useSearchArtists('test query', { enabled: false }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockClient.searchArtists).not.toHaveBeenCalled();
  });
});

describe('useSearchHistory', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should return empty history initially', () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    expect(result.current.searchHistory).toEqual([]);
  });

  it('should add items to history', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('test query');
    });

    await waitFor(() => {
      expect(result.current.searchHistory).toContain('test query');
    });
  });

  it('should not add empty queries to history', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('');
      result.current.addToHistory('   ');
    });

    await waitFor(() => {
      expect(result.current.searchHistory).toEqual([]);
    });
  });

  it('should limit history to maxItems', async () => {
    const { result } = renderHook(() => useSearchHistory(3), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('query 1');
      result.current.addToHistory('query 2');
      result.current.addToHistory('query 3');
      result.current.addToHistory('query 4');
    });

    await waitFor(() => {
      expect(result.current.searchHistory).toHaveLength(3);
    });
    expect(result.current.searchHistory).toEqual(['query 4', 'query 3', 'query 2']);
  });

  it('should move existing items to top when added again', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('query 1');
      result.current.addToHistory('query 2');
      result.current.addToHistory('query 1'); // Add again
    });

    await waitFor(() => {
      expect(result.current.searchHistory).toEqual(['query 1', 'query 2']);
    });
  });

  it('should clear history', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('query 1');
      result.current.addToHistory('query 2');
      result.current.clearHistory();
    });

    await waitFor(() => {
      expect(result.current.searchHistory).toEqual([]);
    });
  });

  it('should remove specific items from history', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('query 1');
      result.current.addToHistory('query 2');
      result.current.addToHistory('query 3');
      result.current.removeFromHistory('query 2');
    });

    await waitFor(() => {
      expect(result.current.searchHistory).toEqual(['query 3', 'query 1']);
    });
  });

  it('should persist history in localStorage', async () => {
    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    act(() => {
      result.current.addToHistory('persistent query');
    });

    await waitFor(() => {
      const stored = localStorage.getItem('dab-search-history');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toContain('persistent query');
    });
  });

  it('should load history from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem('dab-search-history', JSON.stringify(['existing query']));

    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    expect(result.current.searchHistory).toContain('existing query');
  });

  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage to throw errors
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => useSearchHistory(), { wrapper: createWrapper() });

    // Should not throw error
    act(() => {
      expect(() => result.current.addToHistory('test')).not.toThrow();
    });

    // Restore original implementation
    localStorage.setItem = originalSetItem;
  });
});
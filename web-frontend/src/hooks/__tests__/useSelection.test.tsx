/**
 * Unit tests for useSelection hook
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider } from '../../contexts/AppContext';
import { useSelection } from '../useSelection';
import type { Album, Artist } from '../../types';

// ============================================================================
// Test Data
// ============================================================================

const mockAlbums: Album[] = [
  {
    id: 'album1',
    title: 'Album 1',
    artist: 'Artist 1',
    cover: 'cover1.jpg',
    releaseDate: '2023-01-01',
    tracks: []
  },
  {
    id: 'album2',
    title: 'Album 2',
    artist: 'Artist 1',
    cover: 'cover2.jpg',
    releaseDate: '2023-02-01',
    tracks: []
  },
  {
    id: 'album3',
    title: 'Album 3',
    artist: 'Artist 1',
    cover: 'cover3.jpg',
    releaseDate: '2023-03-01',
    tracks: []
  },
  {
    id: 'album4',
    title: 'Album 4',
    artist: 'Artist 2',
    cover: 'cover4.jpg',
    releaseDate: '2023-04-01',
    tracks: []
  }
];

const mockArtist: Artist = {
  id: 'artist1',
  name: 'Test Artist'
};

// ============================================================================
// Test Wrapper
// ============================================================================

interface WrapperProps {
  children: React.ReactNode;
  initialState?: any;
}

const createWrapper = (initialState?: any) => {
  return ({ children }: WrapperProps) => (
    <AppProvider initialState={initialState}>
      {children}
    </AppProvider>
  );
};

// ============================================================================
// Mock localStorage
// ============================================================================

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// Hook Tests
// ============================================================================

describe('useSelection', () => {
  describe('Initial State', () => {
    it('should initialize with empty selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.selectedAlbums.size).toBe(0);
      expect(result.current.selectAllState).toBe('none');
      expect(result.current.selectedAlbumsList).toHaveLength(0);
      expect(result.current.selectionStats.selectedCount).toBe(0);
      expect(result.current.hasSelection()).toBe(false);
    });

    it('should initialize with existing selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.selectedAlbums.size).toBe(2);
      expect(result.current.selectAllState).toBe('some');
      expect(result.current.selectedAlbumsList).toHaveLength(2);
      expect(result.current.selectionStats.selectedCount).toBe(2);
      expect(result.current.hasSelection()).toBe(true);
    });
  });

  describe('Selection Actions', () => {
    it('should toggle album selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.toggleAlbumSelection('album1');
      });

      expect(result.current.isAlbumSelected('album1')).toBe(true);
      expect(result.current.selectedAlbums.has('album1')).toBe(true);
    });

    it('should set album selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.setAlbumSelection('album1', true);
      });

      expect(result.current.isAlbumSelected('album1')).toBe(true);

      act(() => {
        result.current.setAlbumSelection('album1', false);
      });

      expect(result.current.isAlbumSelected('album1')).toBe(false);
    });

    it('should select all albums', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.selectAllAlbums();
      });

      expect(result.current.selectedAlbums.size).toBe(mockAlbums.length);
      expect(result.current.selectAllState).toBe('all');
      expect(result.current.isFullSelection()).toBe(true);
    });

    it('should deselect all albums', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.deselectAllAlbums();
      });

      expect(result.current.selectedAlbums.size).toBe(0);
      expect(result.current.selectAllState).toBe('none');
      expect(result.current.hasSelection()).toBe(false);
    });

    it('should handle select all toggle', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      // Toggle from none to all
      act(() => {
        result.current.handleSelectAllToggle();
      });

      expect(result.current.selectAllState).toBe('all');

      // Toggle from all to none
      act(() => {
        result.current.handleSelectAllToggle();
      });

      expect(result.current.selectAllState).toBe('none');
    });

    it('should clear selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedAlbums.size).toBe(0);
      expect(result.current.selectAllState).toBe('none');
    });
  });

  describe('Bulk Operations', () => {
    it('should select albums by indices', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.selectAlbumsByIndices([0, 2]);
      });

      expect(result.current.isAlbumSelected('album1')).toBe(true);
      expect(result.current.isAlbumSelected('album3')).toBe(true);
      expect(result.current.selectedAlbums.size).toBe(2);
    });

    it('should select albums by range', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.selectAlbumsByRange(1, 3);
      });

      expect(result.current.isAlbumSelected('album2')).toBe(true);
      expect(result.current.isAlbumSelected('album3')).toBe(true);
      expect(result.current.isAlbumSelected('album4')).toBe(true);
      expect(result.current.selectedAlbums.size).toBe(3);
    });

    it('should select albums by filter', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.selectAlbumsByFilter((album) => album.artist === 'Artist 1');
      });

      expect(result.current.selectedAlbums.size).toBe(3);
      expect(result.current.isAlbumSelected('album1')).toBe(true);
      expect(result.current.isAlbumSelected('album2')).toBe(true);
      expect(result.current.isAlbumSelected('album3')).toBe(true);
      expect(result.current.isAlbumSelected('album4')).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard selection without modifiers', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.handleKeyboardSelection('album2');
      });

      expect(result.current.selectedAlbums.size).toBe(1);
      expect(result.current.isAlbumSelected('album2')).toBe(true);
      expect(result.current.isAlbumSelected('album1')).toBe(false);
    });

    it('should handle keyboard selection with ctrl key', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.handleKeyboardSelection('album2', { ctrlKey: true });
      });

      expect(result.current.selectedAlbums.size).toBe(2);
      expect(result.current.isAlbumSelected('album1')).toBe(true);
      expect(result.current.isAlbumSelected('album2')).toBe(true);
    });

    it('should handle keyboard selection with shift key', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      // First select album1 to set the lastSelectedIndex
      act(() => {
        result.current.toggleAlbumSelection('album1');
      });

      // Then use shift+click to select range
      act(() => {
        result.current.handleKeyboardSelection('album3', { shiftKey: true });
      });

      expect(result.current.selectedAlbums.size).toBe(3);
      expect(result.current.isAlbumSelected('album1')).toBe(true);
      expect(result.current.isAlbumSelected('album2')).toBe(true);
      expect(result.current.isAlbumSelected('album3')).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should save selection to localStorage', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some',
        selectedArtist: mockArtist
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.saveSelection();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dab-selection-state',
        expect.stringContaining('"selectedAlbums":["album1","album2"]')
      );
    });

    it('should load selection from localStorage', () => {
      const mockData = {
        selectedAlbums: ['album1', 'album2'],
        timestamp: Date.now(),
        artistId: 'artist1'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none',
        selectedArtist: mockArtist
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        const loaded = result.current.loadSelection();
        expect(loaded).toBe(true);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('dab-selection-state');
    });

    it('should clear saved selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.clearSavedSelection();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dab-selection-state');
    });

    it('should check for saved selection', () => {
      const mockData = {
        selectedAlbums: ['album1', 'album2'],
        timestamp: Date.now(),
        artistId: 'artist1'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none',
        selectedArtist: mockArtist
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      const hasSaved = result.current.hasSavedSelection();
      expect(hasSaved).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate and clean selection', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'invalid1', 'album2', 'invalid2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      act(() => {
        result.current.validateAndCleanSelection();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Removed 2 invalid album selections'),
        ['invalid1', 'invalid2']
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Utility Functions', () => {
    it('should check if album is selected', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.isAlbumSelected('album1')).toBe(true);
      expect(result.current.isAlbumSelected('album3')).toBe(false);
    });

    it('should get selected albums count', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.getSelectedAlbumsCount()).toBe(2);
    });

    it('should check if has selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.hasSelection()).toBe(true);
    });

    it('should check if is full selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2', 'album3', 'album4']),
        selectAllState: 'all'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.isFullSelection()).toBe(true);
    });

    it('should check if is partial selection', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      expect(result.current.isPartialSelection()).toBe(true);
    });
  });

  describe('Selection Stats', () => {
    it('should provide correct selection statistics', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album2']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      const stats = result.current.selectionStats;

      expect(stats.selectedCount).toBe(2);
      expect(stats.unselectedCount).toBe(2);
      expect(stats.totalAlbums).toBe(4);
      expect(stats.selectionPercentage).toBe(50);
      expect(stats.hasSelection).toBe(true);
      expect(stats.isFullSelection).toBe(false);
      expect(stats.isPartialSelection).toBe(true);
    });
  });

  describe('Selected Albums List', () => {
    it('should provide list of selected albums', () => {
      const wrapper = createWrapper({
        albums: mockAlbums,
        selectedAlbums: new Set(['album1', 'album3']),
        selectAllState: 'some'
      });

      const { result } = renderHook(() => useSelection(), { wrapper });

      const selectedList = result.current.selectedAlbumsList;

      expect(selectedList).toHaveLength(2);
      expect(selectedList[0].id).toBe('album1');
      expect(selectedList[1].id).toBe('album3');
    });
  });
});
/**
 * Unit tests for selection utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateSelectAllState,
  toggleAlbumSelection,
  setAlbumSelection,
  selectAllAlbums,
  deselectAllAlbums,
  handleSelectAllToggle,
  getSelectedAlbums,
  getUnselectedAlbums,
  isAlbumSelected,
  getSelectionStats,
  selectAlbumsByIndices,
  selectAlbumsByRange,
  selectAlbumsByFilter,
  mergeSelections,
  intersectSelections,
  subtractSelections,
  saveSelectionState,
  loadSelectionState,
  clearSelectionState,
  hasSavedSelectionState,
  validateSelection,
  cleanupSelection,
  handleKeyboardSelection,
  SelectionUtils
} from '../selectionUtils';
import type { Album } from '../../types';

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

// ============================================================================
// Core Selection Utilities Tests
// ============================================================================

describe('calculateSelectAllState', () => {
  it('should return "none" when no albums are selected', () => {
    const selectedAlbums = new Set<string>();
    const result = calculateSelectAllState(selectedAlbums, 4);
    expect(result).toBe('none');
  });

  it('should return "all" when all albums are selected', () => {
    const selectedAlbums = new Set(['album1', 'album2', 'album3', 'album4']);
    const result = calculateSelectAllState(selectedAlbums, 4);
    expect(result).toBe('all');
  });

  it('should return "some" when some albums are selected', () => {
    const selectedAlbums = new Set(['album1', 'album2']);
    const result = calculateSelectAllState(selectedAlbums, 4);
    expect(result).toBe('some');
  });

  it('should return "none" when total albums is 0', () => {
    const selectedAlbums = new Set<string>();
    const result = calculateSelectAllState(selectedAlbums, 0);
    expect(result).toBe('none');
  });
});

describe('toggleAlbumSelection', () => {
  it('should add album to selection when not selected', () => {
    const currentSelection = new Set(['album1']);
    const result = toggleAlbumSelection(currentSelection, 'album2');
    
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('should remove album from selection when already selected', () => {
    const currentSelection = new Set(['album1', 'album2']);
    const result = toggleAlbumSelection(currentSelection, 'album2');
    
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(false);
    expect(result.size).toBe(1);
  });

  it('should not modify original selection', () => {
    const currentSelection = new Set(['album1']);
    const result = toggleAlbumSelection(currentSelection, 'album2');
    
    expect(currentSelection.size).toBe(1);
    expect(result.size).toBe(2);
  });
});

describe('setAlbumSelection', () => {
  it('should add album when selected is true', () => {
    const currentSelection = new Set(['album1']);
    const result = setAlbumSelection(currentSelection, 'album2', true);
    
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('should remove album when selected is false', () => {
    const currentSelection = new Set(['album1', 'album2']);
    const result = setAlbumSelection(currentSelection, 'album2', false);
    
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(false);
    expect(result.size).toBe(1);
  });

  it('should handle selecting already selected album', () => {
    const currentSelection = new Set(['album1']);
    const result = setAlbumSelection(currentSelection, 'album1', true);
    
    expect(result.has('album1')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should handle deselecting non-selected album', () => {
    const currentSelection = new Set(['album1']);
    const result = setAlbumSelection(currentSelection, 'album2', false);
    
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(false);
    expect(result.size).toBe(1);
  });
});

describe('selectAllAlbums', () => {
  it('should select all albums', () => {
    const result = selectAllAlbums(mockAlbums);
    
    expect(result.size).toBe(4);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
    expect(result.has('album4')).toBe(true);
  });

  it('should handle empty albums array', () => {
    const result = selectAllAlbums([]);
    expect(result.size).toBe(0);
  });
});

describe('deselectAllAlbums', () => {
  it('should return empty set', () => {
    const result = deselectAllAlbums();
    expect(result.size).toBe(0);
  });
});

describe('handleSelectAllToggle', () => {
  it('should select all when state is "none"', () => {
    const currentSelection = new Set<string>();
    const result = handleSelectAllToggle(currentSelection, mockAlbums, 'none');
    
    expect(result.size).toBe(4);
    mockAlbums.forEach(album => {
      expect(result.has(album.id)).toBe(true);
    });
  });

  it('should select all when state is "some"', () => {
    const currentSelection = new Set(['album1']);
    const result = handleSelectAllToggle(currentSelection, mockAlbums, 'some');
    
    expect(result.size).toBe(4);
    mockAlbums.forEach(album => {
      expect(result.has(album.id)).toBe(true);
    });
  });

  it('should deselect all when state is "all"', () => {
    const currentSelection = new Set(['album1', 'album2', 'album3', 'album4']);
    const result = handleSelectAllToggle(currentSelection, mockAlbums, 'all');
    
    expect(result.size).toBe(0);
  });
});

describe('getSelectedAlbums', () => {
  it('should return selected albums', () => {
    const selectedAlbums = new Set(['album1', 'album3']);
    const result = getSelectedAlbums(mockAlbums, selectedAlbums);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('album1');
    expect(result[1].id).toBe('album3');
  });

  it('should return empty array when no albums selected', () => {
    const selectedAlbums = new Set<string>();
    const result = getSelectedAlbums(mockAlbums, selectedAlbums);
    
    expect(result).toHaveLength(0);
  });
});

describe('getUnselectedAlbums', () => {
  it('should return unselected albums', () => {
    const selectedAlbums = new Set(['album1', 'album3']);
    const result = getUnselectedAlbums(mockAlbums, selectedAlbums);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('album2');
    expect(result[1].id).toBe('album4');
  });

  it('should return all albums when none selected', () => {
    const selectedAlbums = new Set<string>();
    const result = getUnselectedAlbums(mockAlbums, selectedAlbums);
    
    expect(result).toHaveLength(4);
  });
});

describe('isAlbumSelected', () => {
  it('should return true for selected album', () => {
    const selectedAlbums = new Set(['album1', 'album2']);
    expect(isAlbumSelected(selectedAlbums, 'album1')).toBe(true);
  });

  it('should return false for unselected album', () => {
    const selectedAlbums = new Set(['album1', 'album2']);
    expect(isAlbumSelected(selectedAlbums, 'album3')).toBe(false);
  });
});

describe('getSelectionStats', () => {
  it('should return correct stats for partial selection', () => {
    const selectedAlbums = new Set(['album1', 'album2']);
    const result = getSelectionStats(selectedAlbums, 4);
    
    expect(result.selectedCount).toBe(2);
    expect(result.unselectedCount).toBe(2);
    expect(result.totalAlbums).toBe(4);
    expect(result.selectionPercentage).toBe(50);
    expect(result.hasSelection).toBe(true);
    expect(result.isFullSelection).toBe(false);
    expect(result.isPartialSelection).toBe(true);
  });

  it('should return correct stats for no selection', () => {
    const selectedAlbums = new Set<string>();
    const result = getSelectionStats(selectedAlbums, 4);
    
    expect(result.selectedCount).toBe(0);
    expect(result.unselectedCount).toBe(4);
    expect(result.totalAlbums).toBe(4);
    expect(result.selectionPercentage).toBe(0);
    expect(result.hasSelection).toBe(false);
    expect(result.isFullSelection).toBe(false);
    expect(result.isPartialSelection).toBe(false);
  });

  it('should return correct stats for full selection', () => {
    const selectedAlbums = new Set(['album1', 'album2', 'album3', 'album4']);
    const result = getSelectionStats(selectedAlbums, 4);
    
    expect(result.selectedCount).toBe(4);
    expect(result.unselectedCount).toBe(0);
    expect(result.totalAlbums).toBe(4);
    expect(result.selectionPercentage).toBe(100);
    expect(result.hasSelection).toBe(true);
    expect(result.isFullSelection).toBe(true);
    expect(result.isPartialSelection).toBe(false);
  });
});

// ============================================================================
// Bulk Operations Tests
// ============================================================================

describe('selectAlbumsByIndices', () => {
  it('should select albums by valid indices', () => {
    const result = selectAlbumsByIndices(mockAlbums, [0, 2]);
    
    expect(result.size).toBe(2);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album3')).toBe(true);
  });

  it('should ignore invalid indices', () => {
    const result = selectAlbumsByIndices(mockAlbums, [-1, 0, 10]);
    
    expect(result.size).toBe(1);
    expect(result.has('album1')).toBe(true);
  });

  it('should handle empty indices array', () => {
    const result = selectAlbumsByIndices(mockAlbums, []);
    expect(result.size).toBe(0);
  });
});

describe('selectAlbumsByRange', () => {
  it('should select albums in range (forward)', () => {
    const result = selectAlbumsByRange(mockAlbums, 1, 3);
    
    expect(result.size).toBe(3);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
    expect(result.has('album4')).toBe(true);
  });

  it('should select albums in range (backward)', () => {
    const result = selectAlbumsByRange(mockAlbums, 3, 1);
    
    expect(result.size).toBe(3);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
    expect(result.has('album4')).toBe(true);
  });

  it('should handle single index range', () => {
    const result = selectAlbumsByRange(mockAlbums, 2, 2);
    
    expect(result.size).toBe(1);
    expect(result.has('album3')).toBe(true);
  });

  it('should clamp to valid range', () => {
    const result = selectAlbumsByRange(mockAlbums, -5, 10);
    
    expect(result.size).toBe(4);
    mockAlbums.forEach(album => {
      expect(result.has(album.id)).toBe(true);
    });
  });
});

describe('selectAlbumsByFilter', () => {
  it('should select albums matching filter', () => {
    const predicate = (album: Album) => album.artist === 'Artist 1';
    const result = selectAlbumsByFilter(mockAlbums, predicate);
    
    expect(result.size).toBe(3);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
    expect(result.has('album4')).toBe(false);
  });

  it('should return empty set when no albums match', () => {
    const predicate = (album: Album) => album.artist === 'Nonexistent Artist';
    const result = selectAlbumsByFilter(mockAlbums, predicate);
    
    expect(result.size).toBe(0);
  });
});

describe('mergeSelections', () => {
  it('should merge multiple selections', () => {
    const selection1 = new Set(['album1', 'album2']);
    const selection2 = new Set(['album2', 'album3']);
    const selection3 = new Set(['album3', 'album4']);
    
    const result = mergeSelections(selection1, selection2, selection3);
    
    expect(result.size).toBe(4);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
    expect(result.has('album4')).toBe(true);
  });

  it('should handle empty selections', () => {
    const selection1 = new Set(['album1']);
    const selection2 = new Set<string>();
    
    const result = mergeSelections(selection1, selection2);
    
    expect(result.size).toBe(1);
    expect(result.has('album1')).toBe(true);
  });
});

describe('intersectSelections', () => {
  it('should return intersection of selections', () => {
    const selection1 = new Set(['album1', 'album2', 'album3']);
    const selection2 = new Set(['album2', 'album3', 'album4']);
    
    const result = intersectSelections(selection1, selection2);
    
    expect(result.size).toBe(2);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
  });

  it('should return empty set when no intersection', () => {
    const selection1 = new Set(['album1', 'album2']);
    const selection2 = new Set(['album3', 'album4']);
    
    const result = intersectSelections(selection1, selection2);
    expect(result.size).toBe(0);
  });

  it('should handle single selection', () => {
    const selection1 = new Set(['album1', 'album2']);
    
    const result = intersectSelections(selection1);
    
    expect(result.size).toBe(2);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
  });

  it('should handle empty selections array', () => {
    const result = intersectSelections();
    expect(result.size).toBe(0);
  });
});

describe('subtractSelections', () => {
  it('should return difference between selections', () => {
    const selection1 = new Set(['album1', 'album2', 'album3']);
    const selection2 = new Set(['album2', 'album4']);
    
    const result = subtractSelections(selection1, selection2);
    
    expect(result.size).toBe(2);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album3')).toBe(true);
  });

  it('should return first selection when second is empty', () => {
    const selection1 = new Set(['album1', 'album2']);
    const selection2 = new Set<string>();
    
    const result = subtractSelections(selection1, selection2);
    
    expect(result.size).toBe(2);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
  });
});

// ============================================================================
// Selection Persistence Tests
// ============================================================================

describe('Selection Persistence', () => {
  // Mock localStorage
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

  describe('saveSelectionState', () => {
    it('should save selection to localStorage', () => {
      const selectedAlbums = new Set(['album1', 'album2']);
      const artistId = 'artist1';
      
      saveSelectionState(selectedAlbums, artistId);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dab-selection-state',
        expect.stringContaining('"selectedAlbums":["album1","album2"]')
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const selectedAlbums = new Set(['album1']);
      
      expect(() => saveSelectionState(selectedAlbums)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadSelectionState', () => {
    it('should load valid selection from localStorage', () => {
      const mockData = {
        selectedAlbums: ['album1', 'album2'],
        timestamp: Date.now(),
        artistId: 'artist1'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = loadSelectionState('artist1');
      
      expect(result).toBeInstanceOf(Set);
      expect(result?.size).toBe(2);
      expect(result?.has('album1')).toBe(true);
      expect(result?.has('album2')).toBe(true);
    });

    it('should return null for expired data', () => {
      const mockData = {
        selectedAlbums: ['album1', 'album2'],
        timestamp: Date.now() - (31 * 60 * 1000), // 31 minutes ago
        artistId: 'artist1'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = loadSelectionState('artist1');
      
      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dab-selection-state');
    });

    it('should return null for different artist', () => {
      const mockData = {
        selectedAlbums: ['album1', 'album2'],
        timestamp: Date.now(),
        artistId: 'artist1'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = loadSelectionState('artist2');
      
      expect(result).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = loadSelectionState();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('clearSelectionState', () => {
    it('should remove selection from localStorage', () => {
      clearSelectionState();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dab-selection-state');
    });
  });

  describe('hasSavedSelectionState', () => {
    it('should return true for valid saved selection', () => {
      const mockData = {
        selectedAlbums: ['album1', 'album2'],
        timestamp: Date.now(),
        artistId: 'artist1'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));
      
      const result = hasSavedSelectionState('artist1');
      
      expect(result).toBe(true);
    });

    it('should return false for no saved selection', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = hasSavedSelectionState();
      
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// Selection Validation Tests
// ============================================================================

describe('validateSelection', () => {
  it('should return valid and invalid album IDs', () => {
    const selectedAlbums = new Set(['album1', 'album2', 'invalid1', 'album3', 'invalid2']);
    
    const result = validateSelection(selectedAlbums, mockAlbums);
    
    expect(result.validSelection.size).toBe(3);
    expect(result.validSelection.has('album1')).toBe(true);
    expect(result.validSelection.has('album2')).toBe(true);
    expect(result.validSelection.has('album3')).toBe(true);
    
    expect(result.invalidAlbumIds).toHaveLength(2);
    expect(result.invalidAlbumIds).toContain('invalid1');
    expect(result.invalidAlbumIds).toContain('invalid2');
  });

  it('should handle all valid selection', () => {
    const selectedAlbums = new Set(['album1', 'album2']);
    
    const result = validateSelection(selectedAlbums, mockAlbums);
    
    expect(result.validSelection.size).toBe(2);
    expect(result.invalidAlbumIds).toHaveLength(0);
  });

  it('should handle all invalid selection', () => {
    const selectedAlbums = new Set(['invalid1', 'invalid2']);
    
    const result = validateSelection(selectedAlbums, mockAlbums);
    
    expect(result.validSelection.size).toBe(0);
    expect(result.invalidAlbumIds).toHaveLength(2);
  });
});

describe('cleanupSelection', () => {
  it('should return only valid album IDs', () => {
    const selectedAlbums = new Set(['album1', 'album2', 'invalid1', 'album3']);
    
    const result = cleanupSelection(selectedAlbums, mockAlbums);
    
    expect(result.size).toBe(3);
    expect(result.has('album1')).toBe(true);
    expect(result.has('album2')).toBe(true);
    expect(result.has('album3')).toBe(true);
    expect(result.has('invalid1')).toBe(false);
  });
});

// ============================================================================
// Keyboard Navigation Tests
// ============================================================================

describe('handleKeyboardSelection', () => {
  it('should handle single selection (no modifiers)', () => {
    const currentSelection = new Set(['album1', 'album2']);
    
    const result = handleKeyboardSelection(
      mockAlbums,
      currentSelection,
      'album3',
      {}
    );
    
    expect(result.newSelection.size).toBe(1);
    expect(result.newSelection.has('album3')).toBe(true);
    expect(result.newLastSelectedIndex).toBe(2);
  });

  it('should handle ctrl+click (toggle selection)', () => {
    const currentSelection = new Set(['album1', 'album2']);
    
    const result = handleKeyboardSelection(
      mockAlbums,
      currentSelection,
      'album3',
      { ctrlKey: true }
    );
    
    expect(result.newSelection.size).toBe(3);
    expect(result.newSelection.has('album1')).toBe(true);
    expect(result.newSelection.has('album2')).toBe(true);
    expect(result.newSelection.has('album3')).toBe(true);
    expect(result.newLastSelectedIndex).toBe(2);
  });

  it('should handle shift+click (range selection)', () => {
    const currentSelection = new Set(['album1']);
    
    const result = handleKeyboardSelection(
      mockAlbums,
      currentSelection,
      'album3',
      { shiftKey: true, lastSelectedIndex: 0 }
    );
    
    expect(result.newSelection.size).toBe(3);
    expect(result.newSelection.has('album1')).toBe(true);
    expect(result.newSelection.has('album2')).toBe(true);
    expect(result.newSelection.has('album3')).toBe(true);
    expect(result.newLastSelectedIndex).toBe(2);
  });

  it('should handle invalid album ID', () => {
    const currentSelection = new Set(['album1']);
    
    const result = handleKeyboardSelection(
      mockAlbums,
      currentSelection,
      'invalid',
      {}
    );
    
    expect(result.newSelection).toBe(currentSelection);
    expect(result.newLastSelectedIndex).toBe(-1);
  });
});

// ============================================================================
// SelectionUtils Export Tests
// ============================================================================

describe('SelectionUtils export', () => {
  it('should export all utility functions', () => {
    expect(SelectionUtils.calculateSelectAllState).toBeDefined();
    expect(SelectionUtils.toggleAlbumSelection).toBeDefined();
    expect(SelectionUtils.setAlbumSelection).toBeDefined();
    expect(SelectionUtils.selectAllAlbums).toBeDefined();
    expect(SelectionUtils.deselectAllAlbums).toBeDefined();
    expect(SelectionUtils.handleSelectAllToggle).toBeDefined();
    expect(SelectionUtils.getSelectedAlbums).toBeDefined();
    expect(SelectionUtils.getUnselectedAlbums).toBeDefined();
    expect(SelectionUtils.isAlbumSelected).toBeDefined();
    expect(SelectionUtils.getSelectionStats).toBeDefined();
    expect(SelectionUtils.selectAlbumsByIndices).toBeDefined();
    expect(SelectionUtils.selectAlbumsByRange).toBeDefined();
    expect(SelectionUtils.selectAlbumsByFilter).toBeDefined();
    expect(SelectionUtils.mergeSelections).toBeDefined();
    expect(SelectionUtils.intersectSelections).toBeDefined();
    expect(SelectionUtils.subtractSelections).toBeDefined();
    expect(SelectionUtils.saveSelectionState).toBeDefined();
    expect(SelectionUtils.loadSelectionState).toBeDefined();
    expect(SelectionUtils.clearSelectionState).toBeDefined();
    expect(SelectionUtils.hasSavedSelectionState).toBeDefined();
    expect(SelectionUtils.validateSelection).toBeDefined();
    expect(SelectionUtils.cleanupSelection).toBeDefined();
    expect(SelectionUtils.handleKeyboardSelection).toBeDefined();
  });
});
/**
 * Selection utilities for managing album selection state
 * Provides utilities for individual and bulk selection operations
 */

import type { Album } from '../types';

// ============================================================================
// Types
// ============================================================================

export type SelectAllState = 'none' | 'some' | 'all';

export interface SelectionState {
  selectedAlbums: Set<string>;
  selectAllState: SelectAllState;
}

export interface SelectionPersistence {
  selectedAlbums: string[];
  timestamp: number;
  artistId?: string | number;
}

// ============================================================================
// Core Selection Utilities
// ============================================================================

/**
 * Calculate the select all state based on selected albums and total albums
 */
export function calculateSelectAllState(
  selectedAlbums: Set<string>,
  totalAlbums: number
): SelectAllState {
  const selectedCount = selectedAlbums.size;
  
  if (selectedCount === 0) {
    return 'none';
  } else if (selectedCount === totalAlbums) {
    return 'all';
  } else {
    return 'some';
  }
}

/**
 * Toggle selection of a single album
 */
export function toggleAlbumSelection(
  currentSelection: Set<string>,
  albumId: string
): Set<string> {
  const newSelection = new Set(currentSelection);
  
  if (newSelection.has(albumId)) {
    newSelection.delete(albumId);
  } else {
    newSelection.add(albumId);
  }
  
  return newSelection;
}

/**
 * Set selection state for a specific album
 */
export function setAlbumSelection(
  currentSelection: Set<string>,
  albumId: string,
  selected: boolean
): Set<string> {
  const newSelection = new Set(currentSelection);
  
  if (selected) {
    newSelection.add(albumId);
  } else {
    newSelection.delete(albumId);
  }
  
  return newSelection;
}

/**
 * Select all albums from the provided list
 */
export function selectAllAlbums(albums: Album[]): Set<string> {
  return new Set(albums.map(album => album.id));
}

/**
 * Deselect all albums
 */
export function deselectAllAlbums(): Set<string> {
  return new Set<string>();
}

/**
 * Handle select all/deselect all toggle based on current state
 */
export function handleSelectAllToggle(
  currentSelection: Set<string>,
  albums: Album[],
  currentSelectAllState: SelectAllState
): Set<string> {
  switch (currentSelectAllState) {
    case 'none':
    case 'some':
      // If none or some are selected, select all
      return selectAllAlbums(albums);
    case 'all':
      // If all are selected, deselect all
      return deselectAllAlbums();
    default:
      return currentSelection;
  }
}

/**
 * Get selected albums from the albums list based on selection state
 */
export function getSelectedAlbums(
  albums: Album[],
  selectedAlbums: Set<string>
): Album[] {
  return albums.filter(album => selectedAlbums.has(album.id));
}

/**
 * Get unselected albums from the albums list based on selection state
 */
export function getUnselectedAlbums(
  albums: Album[],
  selectedAlbums: Set<string>
): Album[] {
  return albums.filter(album => !selectedAlbums.has(album.id));
}

/**
 * Check if a specific album is selected
 */
export function isAlbumSelected(
  selectedAlbums: Set<string>,
  albumId: string
): boolean {
  return selectedAlbums.has(albumId);
}

/**
 * Get selection statistics
 */
export function getSelectionStats(
  selectedAlbums: Set<string>,
  totalAlbums: number
) {
  const selectedCount = selectedAlbums.size;
  const unselectedCount = totalAlbums - selectedCount;
  const selectionPercentage = totalAlbums > 0 ? (selectedCount / totalAlbums) * 100 : 0;
  
  return {
    selectedCount,
    unselectedCount,
    totalAlbums,
    selectionPercentage,
    hasSelection: selectedCount > 0,
    isFullSelection: selectedCount === totalAlbums,
    isPartialSelection: selectedCount > 0 && selectedCount < totalAlbums
  };
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Select albums by indices
 */
export function selectAlbumsByIndices(
  albums: Album[],
  indices: number[]
): Set<string> {
  const selection = new Set<string>();
  
  indices.forEach(index => {
    if (index >= 0 && index < albums.length) {
      selection.add(albums[index].id);
    }
  });
  
  return selection;
}

/**
 * Select albums by range (inclusive)
 */
export function selectAlbumsByRange(
  albums: Album[],
  startIndex: number,
  endIndex: number
): Set<string> {
  const selection = new Set<string>();
  const start = Math.max(0, Math.min(startIndex, endIndex));
  const end = Math.min(albums.length - 1, Math.max(startIndex, endIndex));
  
  for (let i = start; i <= end; i++) {
    selection.add(albums[i].id);
  }
  
  return selection;
}

/**
 * Select albums by filter predicate
 */
export function selectAlbumsByFilter(
  albums: Album[],
  predicate: (album: Album) => boolean
): Set<string> {
  const selection = new Set<string>();
  
  albums.forEach(album => {
    if (predicate(album)) {
      selection.add(album.id);
    }
  });
  
  return selection;
}

/**
 * Merge multiple selections
 */
export function mergeSelections(...selections: Set<string>[]): Set<string> {
  const merged = new Set<string>();
  
  selections.forEach(selection => {
    selection.forEach(albumId => merged.add(albumId));
  });
  
  return merged;
}

/**
 * Get intersection of multiple selections
 */
export function intersectSelections(...selections: Set<string>[]): Set<string> {
  if (selections.length === 0) {
    return new Set<string>();
  }
  
  if (selections.length === 1) {
    return new Set(selections[0]);
  }
  
  const intersection = new Set<string>();
  const firstSelection = selections[0];
  
  firstSelection.forEach(albumId => {
    const inAllSelections = selections.every(selection => selection.has(albumId));
    if (inAllSelections) {
      intersection.add(albumId);
    }
  });
  
  return intersection;
}

/**
 * Get difference between two selections (items in first but not in second)
 */
export function subtractSelections(
  firstSelection: Set<string>,
  secondSelection: Set<string>
): Set<string> {
  const difference = new Set<string>();
  
  firstSelection.forEach(albumId => {
    if (!secondSelection.has(albumId)) {
      difference.add(albumId);
    }
  });
  
  return difference;
}

// ============================================================================
// Selection Persistence
// ============================================================================

const SELECTION_STORAGE_KEY = 'dab-selection-state';
const SELECTION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Save selection state to localStorage
 */
export function saveSelectionState(
  selectedAlbums: Set<string>,
  artistId?: string | number
): void {
  try {
    const persistenceData: SelectionPersistence = {
      selectedAlbums: Array.from(selectedAlbums),
      timestamp: Date.now(),
      artistId
    };
    
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(persistenceData));
  } catch (error) {
    console.warn('Failed to save selection state to localStorage:', error);
  }
}

/**
 * Load selection state from localStorage
 */
export function loadSelectionState(
  currentArtistId?: string | number
): Set<string> | null {
  try {
    const stored = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const persistenceData: SelectionPersistence = JSON.parse(stored);
    
    // Check if the data has expired
    const isExpired = Date.now() - persistenceData.timestamp > SELECTION_EXPIRY_MS;
    if (isExpired) {
      clearSelectionState();
      return null;
    }
    
    // Check if the artist matches (if provided)
    if (currentArtistId !== undefined && persistenceData.artistId !== currentArtistId) {
      return null;
    }
    
    return new Set(persistenceData.selectedAlbums);
  } catch (error) {
    console.warn('Failed to load selection state from localStorage:', error);
    clearSelectionState();
    return null;
  }
}

/**
 * Clear selection state from localStorage
 */
export function clearSelectionState(): void {
  try {
    localStorage.removeItem(SELECTION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear selection state from localStorage:', error);
  }
}

/**
 * Check if there is a valid saved selection state
 */
export function hasSavedSelectionState(
  currentArtistId?: string | number
): boolean {
  const savedSelection = loadSelectionState(currentArtistId);
  return savedSelection !== null && savedSelection.size > 0;
}

// ============================================================================
// Selection Validation
// ============================================================================

/**
 * Validate that selected album IDs exist in the current albums list
 */
export function validateSelection(
  selectedAlbums: Set<string>,
  availableAlbums: Album[]
): {
  validSelection: Set<string>;
  invalidAlbumIds: string[];
} {
  const availableAlbumIds = new Set(availableAlbums.map(album => album.id));
  const validSelection = new Set<string>();
  const invalidAlbumIds: string[] = [];
  
  selectedAlbums.forEach(albumId => {
    if (availableAlbumIds.has(albumId)) {
      validSelection.add(albumId);
    } else {
      invalidAlbumIds.push(albumId);
    }
  });
  
  return {
    validSelection,
    invalidAlbumIds
  };
}

/**
 * Clean up selection by removing invalid album IDs
 */
export function cleanupSelection(
  selectedAlbums: Set<string>,
  availableAlbums: Album[]
): Set<string> {
  const { validSelection } = validateSelection(selectedAlbums, availableAlbums);
  return validSelection;
}

// ============================================================================
// Keyboard Navigation Utilities
// ============================================================================

/**
 * Handle keyboard-based selection (Ctrl+Click, Shift+Click equivalent)
 */
export function handleKeyboardSelection(
  albums: Album[],
  currentSelection: Set<string>,
  targetAlbumId: string,
  options: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    lastSelectedIndex?: number;
  } = {}
): {
  newSelection: Set<string>;
  newLastSelectedIndex: number;
} {
  const { ctrlKey = false, shiftKey = false, lastSelectedIndex } = options;
  const targetIndex = albums.findIndex(album => album.id === targetAlbumId);
  
  if (targetIndex === -1) {
    return {
      newSelection: currentSelection,
      newLastSelectedIndex: lastSelectedIndex ?? -1
    };
  }
  
  let newSelection = new Set(currentSelection);
  
  if (shiftKey && lastSelectedIndex !== undefined && lastSelectedIndex >= 0) {
    // Range selection
    const rangeSelection = selectAlbumsByRange(albums, lastSelectedIndex, targetIndex);
    newSelection = mergeSelections(currentSelection, rangeSelection);
  } else if (ctrlKey) {
    // Toggle selection
    newSelection = toggleAlbumSelection(currentSelection, targetAlbumId);
  } else {
    // Single selection (replace current selection)
    newSelection = new Set([targetAlbumId]);
  }
  
  return {
    newSelection,
    newLastSelectedIndex: targetIndex
  };
}

// ============================================================================
// Export all utilities
// ============================================================================

export const SelectionUtils = {
  // Core utilities
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
  
  // Bulk operations
  selectAlbumsByIndices,
  selectAlbumsByRange,
  selectAlbumsByFilter,
  mergeSelections,
  intersectSelections,
  subtractSelections,
  
  // Persistence
  saveSelectionState,
  loadSelectionState,
  clearSelectionState,
  hasSavedSelectionState,
  
  // Validation
  validateSelection,
  cleanupSelection,
  
  // Keyboard navigation
  handleKeyboardSelection
};

export default SelectionUtils;
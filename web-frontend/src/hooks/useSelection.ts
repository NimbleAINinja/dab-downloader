/**
 * Custom hook for managing album selection state
 * Provides utilities and actions for selection management with persistence
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import {
  SelectionUtils,
  handleSelectAllToggle,
  getSelectedAlbums,
  getSelectionStats,
  saveSelectionState,
  loadSelectionState,
  clearSelectionState,
  validateSelection,
  handleKeyboardSelection,
  type SelectAllState
} from '../utils/selectionUtils';
import type { Album } from '../types';

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseSelectionReturn {
  // Current state
  selectedAlbums: Set<string>;
  selectAllState: SelectAllState;
  selectedAlbumsList: Album[];
  selectionStats: ReturnType<typeof getSelectionStats>;
  
  // Actions
  toggleAlbumSelection: (albumId: string) => void;
  setAlbumSelection: (albumId: string, selected: boolean) => void;
  selectAllAlbums: () => void;
  deselectAllAlbums: () => void;
  handleSelectAllToggle: () => void;
  clearSelection: () => void;
  
  // Bulk operations
  selectAlbumsByIndices: (indices: number[]) => void;
  selectAlbumsByRange: (startIndex: number, endIndex: number) => void;
  selectAlbumsByFilter: (predicate: (album: Album) => boolean) => void;
  
  // Keyboard navigation
  handleKeyboardSelection: (
    targetAlbumId: string,
    options?: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
    }
  ) => void;
  
  // Persistence
  saveSelection: () => void;
  loadSelection: () => void;
  clearSavedSelection: () => void;
  hasSavedSelection: () => boolean;
  
  // Validation
  validateAndCleanSelection: () => void;
  
  // Utilities
  isAlbumSelected: (albumId: string) => boolean;
  getSelectedAlbumsCount: () => number;
  hasSelection: () => boolean;
  isFullSelection: () => boolean;
  isPartialSelection: () => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSelection(): UseSelectionReturn {
  const { state, actions } = useAppContext();
  const { selectedAlbums, selectAllState, albums, selectedArtist } = state;
  
  // Track last selected index for keyboard navigation
  const lastSelectedIndexRef = React.useRef<number>(-1);
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  const selectedAlbumsList = useMemo(() => {
    return getSelectedAlbums(albums, selectedAlbums);
  }, [albums, selectedAlbums]);
  
  const selectionStats = useMemo(() => {
    return getSelectionStats(selectedAlbums, albums.length);
  }, [selectedAlbums, albums.length]);
  
  // ============================================================================
  // Core Actions
  // ============================================================================
  
  const toggleAlbumSelection = useCallback((albumId: string) => {
    actions.toggleAlbumSelection(albumId);
    
    // Update last selected index
    const albumIndex = albums.findIndex(album => album.id === albumId);
    if (albumIndex >= 0) {
      lastSelectedIndexRef.current = albumIndex;
    }
  }, [actions, albums]);
  
  const setAlbumSelection = useCallback((albumId: string, selected: boolean) => {
    actions.setAlbumSelection(albumId, selected);
    
    // Update last selected index if selecting
    if (selected) {
      const albumIndex = albums.findIndex(album => album.id === albumId);
      if (albumIndex >= 0) {
        lastSelectedIndexRef.current = albumIndex;
      }
    }
  }, [actions, albums]);
  
  const selectAllAlbums = useCallback(() => {
    actions.selectAllAlbums();
  }, [actions]);
  
  const deselectAllAlbums = useCallback(() => {
    actions.deselectAllAlbums();
    lastSelectedIndexRef.current = -1;
  }, [actions]);
  
  const handleSelectAllToggleAction = useCallback(() => {
    const newSelection = handleSelectAllToggle(selectedAlbums, albums, selectAllState);
    
    if (newSelection.size === 0) {
      actions.deselectAllAlbums();
      lastSelectedIndexRef.current = -1;
    } else {
      actions.selectAllAlbums();
    }
  }, [selectedAlbums, albums, selectAllState, actions]);
  
  const clearSelection = useCallback(() => {
    actions.clearSelection();
    lastSelectedIndexRef.current = -1;
  }, [actions]);
  
  // ============================================================================
  // Bulk Operations
  // ============================================================================
  
  const selectAlbumsByIndices = useCallback((indices: number[]) => {
    const newSelection = SelectionUtils.selectAlbumsByIndices(albums, indices);
    const mergedSelection = SelectionUtils.mergeSelections(selectedAlbums, newSelection);
    
    // Clear and apply the merged selection
    actions.clearSelection();
    mergedSelection.forEach(albumId => {
      actions.setAlbumSelection(albumId, true);
    });
  }, [albums, selectedAlbums, actions]);
  
  const selectAlbumsByRange = useCallback((startIndex: number, endIndex: number) => {
    const newSelection = SelectionUtils.selectAlbumsByRange(albums, startIndex, endIndex);
    const mergedSelection = SelectionUtils.mergeSelections(selectedAlbums, newSelection);
    
    // Clear and apply the merged selection
    actions.clearSelection();
    mergedSelection.forEach(albumId => {
      actions.setAlbumSelection(albumId, true);
    });
    
    // Update last selected index
    lastSelectedIndexRef.current = Math.max(startIndex, endIndex);
  }, [albums, selectedAlbums, actions]);
  
  const selectAlbumsByFilter = useCallback((predicate: (album: Album) => boolean) => {
    const newSelection = SelectionUtils.selectAlbumsByFilter(albums, predicate);
    const mergedSelection = SelectionUtils.mergeSelections(selectedAlbums, newSelection);
    
    // Clear and apply the merged selection
    actions.clearSelection();
    mergedSelection.forEach(albumId => {
      actions.setAlbumSelection(albumId, true);
    });
  }, [albums, selectedAlbums, actions]);
  
  // ============================================================================
  // Keyboard Navigation
  // ============================================================================
  
  const handleKeyboardSelectionAction = useCallback((
    targetAlbumId: string,
    options: {
      ctrlKey?: boolean;
      shiftKey?: boolean;
    } = {}
  ) => {
    const result = handleKeyboardSelection(
      albums,
      selectedAlbums,
      targetAlbumId,
      {
        ...options,
        lastSelectedIndex: lastSelectedIndexRef.current
      }
    );
    
    // Clear current selection and set new selection
    actions.clearSelection();
    
    // Apply the new selection
    result.newSelection.forEach(albumId => {
      actions.setAlbumSelection(albumId, true);
    });
    
    // Update last selected index
    lastSelectedIndexRef.current = result.newLastSelectedIndex;
  }, [albums, selectedAlbums, actions]);
  
  // ============================================================================
  // Persistence
  // ============================================================================
  
  const saveSelection = useCallback(() => {
    const artistId = selectedArtist?.id;
    saveSelectionState(selectedAlbums, artistId);
  }, [selectedAlbums, selectedArtist]);
  
  const loadSelection = useCallback(() => {
    const artistId = selectedArtist?.id;
    const savedSelection = loadSelectionState(artistId);
    
    if (savedSelection && savedSelection.size > 0) {
      // Validate the saved selection against current albums
      const { validSelection } = validateSelection(savedSelection, albums);
      
      if (validSelection.size > 0) {
        // Clear current selection and apply the valid selection
        actions.clearSelection();
        validSelection.forEach(albumId => {
          actions.setAlbumSelection(albumId, true);
        });
        
        return true; // Successfully loaded
      }
    }
    
    return false; // Nothing to load or invalid
  }, [selectedArtist, albums, selectedAlbums, actions]);
  
  const clearSavedSelection = useCallback(() => {
    clearSelectionState();
  }, []);
  
  const hasSavedSelection = useCallback(() => {
    const artistId = selectedArtist?.id;
    const savedSelection = loadSelectionState(artistId);
    return savedSelection !== null && savedSelection.size > 0;
  }, [selectedArtist]);
  
  // ============================================================================
  // Validation
  // ============================================================================
  
  const validateAndCleanSelection = useCallback(() => {
    const { validSelection, invalidAlbumIds } = validateSelection(selectedAlbums, albums);
    
    if (invalidAlbumIds.length > 0) {
      console.warn(`Removed ${invalidAlbumIds.length} invalid album selections:`, invalidAlbumIds);
      
      // Clear current selection and set only valid selections
      actions.clearSelection();
      validSelection.forEach(albumId => {
        actions.setAlbumSelection(albumId, true);
      });
    }
  }, [selectedAlbums, albums, actions]);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  const isAlbumSelected = useCallback((albumId: string) => {
    return selectedAlbums.has(albumId);
  }, [selectedAlbums]);
  
  const getSelectedAlbumsCount = useCallback(() => {
    return selectedAlbums.size;
  }, [selectedAlbums]);
  
  const hasSelection = useCallback(() => {
    return selectedAlbums.size > 0;
  }, [selectedAlbums]);
  
  const isFullSelection = useCallback(() => {
    return albums.length > 0 && selectedAlbums.size === albums.length;
  }, [selectedAlbums, albums]);
  
  const isPartialSelection = useCallback(() => {
    return selectedAlbums.size > 0 && selectedAlbums.size < albums.length;
  }, [selectedAlbums, albums]);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Auto-save selection when it changes
  useEffect(() => {
    if (selectedAlbums.size > 0) {
      saveSelection();
    }
  }, [selectedAlbums, saveSelection]);
  
  // Validate selection when albums change
  useEffect(() => {
    if (albums.length > 0 && selectedAlbums.size > 0) {
      validateAndCleanSelection();
    }
  }, [albums, validateAndCleanSelection]);
  
  // Load saved selection when artist changes
  useEffect(() => {
    if (selectedArtist && albums.length > 0) {
      loadSelection();
    }
  }, [selectedArtist, albums.length]); // Don't include loadSelection to avoid infinite loop
  
  // Clear selection when artist changes
  useEffect(() => {
    return () => {
      // Cleanup: save selection before unmounting or artist change
      if (selectedAlbums.size > 0) {
        saveSelection();
      }
    };
  }, [selectedArtist?.id]); // Only trigger when artist ID changes
  
  // ============================================================================
  // Return Hook Interface
  // ============================================================================
  
  return {
    // Current state
    selectedAlbums,
    selectAllState,
    selectedAlbumsList,
    selectionStats,
    
    // Actions
    toggleAlbumSelection,
    setAlbumSelection,
    selectAllAlbums,
    deselectAllAlbums,
    handleSelectAllToggle: handleSelectAllToggleAction,
    clearSelection,
    
    // Bulk operations
    selectAlbumsByIndices,
    selectAlbumsByRange,
    selectAlbumsByFilter,
    
    // Keyboard navigation
    handleKeyboardSelection: handleKeyboardSelectionAction,
    
    // Persistence
    saveSelection,
    loadSelection,
    clearSavedSelection,
    hasSavedSelection,
    
    // Validation
    validateAndCleanSelection,
    
    // Utilities
    isAlbumSelected,
    getSelectedAlbumsCount,
    hasSelection,
    isFullSelection,
    isPartialSelection
  };
}

export default useSelection;
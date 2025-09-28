import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { 
  Artist, 
  Album, 
  DownloadStatus, 
  SearchResults, 
  ErrorState 
} from '../types';

// ============================================================================
// State Types
// ============================================================================

export interface AppState {
  // Search state
  searchResults: SearchResults;
  selectedArtist: Artist | null;
  albums: Album[];
  isSearching: boolean;
  
  // Selection state
  selectedAlbums: Set<string>;
  selectAllState: 'none' | 'some' | 'all';
  
  // Download state
  downloads: Map<string, DownloadStatus>;
  activeDownloads: number;
  completedDownloads: number;
  failedDownloads: number;
  
  // Global state
  isLoading: boolean;
  error: ErrorState | null;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

// ============================================================================
// Action Types
// ============================================================================

export type AppAction =
  // Search actions
  | { type: 'SEARCH_START'; payload: { query: string } }
  | { type: 'SEARCH_SUCCESS'; payload: { results: SearchResults; query: string } }
  | { type: 'SEARCH_ERROR'; payload: { error: ErrorState; query: string } }
  | { type: 'SELECT_ARTIST'; payload: { artist: Artist } }
  | { type: 'SET_ALBUMS'; payload: { albums: Album[] } }
  | { type: 'CLEAR_SEARCH' }
  
  // Selection actions
  | { type: 'TOGGLE_ALBUM_SELECTION'; payload: { albumId: string } }
  | { type: 'SELECT_ALL_ALBUMS' }
  | { type: 'DESELECT_ALL_ALBUMS' }
  | { type: 'SET_ALBUM_SELECTION'; payload: { albumId: string; selected: boolean } }
  | { type: 'CLEAR_SELECTION' }
  
  // Download actions
  | { type: 'START_DOWNLOAD'; payload: { downloadId: string; albumIds: string[] } }
  | { type: 'UPDATE_DOWNLOAD'; payload: { downloadId: string; status: Partial<DownloadStatus> } }
  | { type: 'COMPLETE_DOWNLOAD'; payload: { downloadId: string } }
  | { type: 'FAIL_DOWNLOAD'; payload: { downloadId: string; error: string } }
  | { type: 'CANCEL_DOWNLOAD'; payload: { downloadId: string } }
  | { type: 'REMOVE_DOWNLOAD'; payload: { downloadId: string } }
  | { type: 'CLEAR_DOWNLOADS' }
  
  // Global state actions
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: ErrorState | null } }
  | { type: 'CLEAR_ERROR' }
  
  // Notification actions
  | { type: 'ADD_NOTIFICATION'; payload: { notification: Omit<Notification, 'id' | 'timestamp'> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } }
  | { type: 'CLEAR_NOTIFICATIONS' };

// ============================================================================
// Initial State
// ============================================================================

const initialState: AppState = {
  // Search state
  searchResults: { artists: [], albums: [], tracks: [] },
  selectedArtist: null,
  albums: [],
  isSearching: false,
  
  // Selection state
  selectedAlbums: new Set<string>(),
  selectAllState: 'none',
  
  // Download state
  downloads: new Map<string, DownloadStatus>(),
  activeDownloads: 0,
  completedDownloads: 0,
  failedDownloads: 0,
  
  // Global state
  isLoading: false,
  error: null,
  notifications: []
};

// ============================================================================
// Reducer
// ============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // Search actions
    case 'SEARCH_START':
      return {
        ...state,
        isSearching: true,
        error: null
      };
      
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        searchResults: action.payload.results,
        isSearching: false,
        error: null
      };
      
    case 'SEARCH_ERROR':
      return {
        ...state,
        isSearching: false,
        error: action.payload.error,
        searchResults: { artists: [], albums: [], tracks: [] }
      };
      
    case 'SELECT_ARTIST':
      return {
        ...state,
        selectedArtist: action.payload.artist,
        albums: [],
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      };
      
    case 'SET_ALBUMS':
      return {
        ...state,
        albums: action.payload.albums,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      };
      
    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchResults: { artists: [], albums: [], tracks: [] },
        selectedArtist: null,
        albums: [],
        selectedAlbums: new Set<string>(),
        selectAllState: 'none',
        isSearching: false
      };
      
    // Selection actions
    case 'TOGGLE_ALBUM_SELECTION': {
      const newSelectedAlbums = new Set(state.selectedAlbums);
      const { albumId } = action.payload;
      
      if (newSelectedAlbums.has(albumId)) {
        newSelectedAlbums.delete(albumId);
      } else {
        newSelectedAlbums.add(albumId);
      }
      
      const selectAllState = 
        newSelectedAlbums.size === 0 ? 'none' :
        newSelectedAlbums.size === state.albums.length ? 'all' : 'some';
      
      return {
        ...state,
        selectedAlbums: newSelectedAlbums,
        selectAllState
      };
    }
    
    case 'SELECT_ALL_ALBUMS': {
      const allAlbumIds = new Set(state.albums.map(album => album.id));
      return {
        ...state,
        selectedAlbums: allAlbumIds,
        selectAllState: 'all'
      };
    }
    
    case 'DESELECT_ALL_ALBUMS':
      return {
        ...state,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      };
      
    case 'SET_ALBUM_SELECTION': {
      const newSelectedAlbums = new Set(state.selectedAlbums);
      const { albumId, selected } = action.payload;
      
      if (selected) {
        newSelectedAlbums.add(albumId);
      } else {
        newSelectedAlbums.delete(albumId);
      }
      
      const selectAllState = 
        newSelectedAlbums.size === 0 ? 'none' :
        newSelectedAlbums.size === state.albums.length ? 'all' : 'some';
      
      return {
        ...state,
        selectedAlbums: newSelectedAlbums,
        selectAllState
      };
    }
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedAlbums: new Set<string>(),
        selectAllState: 'none'
      };
      
    // Download actions
    case 'START_DOWNLOAD': {
      const { downloadId, albumIds } = action.payload;
      const newDownloads = new Map(state.downloads);
      
      // Create download status for each album
      albumIds.forEach(albumId => {
        const album = state.albums.find(a => a.id === albumId);
        if (album) {
          newDownloads.set(downloadId, {
            id: downloadId,
            albumId,
            albumTitle: album.title,
            artistName: album.artist,
            status: 'pending',
            progress: 0,
            startTime: new Date()
          });
        }
      });
      
      return {
        ...state,
        downloads: newDownloads,
        activeDownloads: state.activeDownloads + 1
      };
    }
    
    case 'UPDATE_DOWNLOAD': {
      const { downloadId, status } = action.payload;
      const newDownloads = new Map(state.downloads);
      const existingDownload = newDownloads.get(downloadId);
      
      if (existingDownload) {
        newDownloads.set(downloadId, {
          ...existingDownload,
          ...status
        });
      }
      
      return {
        ...state,
        downloads: newDownloads
      };
    }
    
    case 'COMPLETE_DOWNLOAD': {
      const { downloadId } = action.payload;
      const newDownloads = new Map(state.downloads);
      const existingDownload = newDownloads.get(downloadId);
      
      if (existingDownload) {
        newDownloads.set(downloadId, {
          ...existingDownload,
          status: 'completed',
          progress: 100,
          endTime: new Date()
        });
      }
      
      return {
        ...state,
        downloads: newDownloads,
        activeDownloads: Math.max(0, state.activeDownloads - 1),
        completedDownloads: state.completedDownloads + 1
      };
    }
    
    case 'FAIL_DOWNLOAD': {
      const { downloadId, error } = action.payload;
      const newDownloads = new Map(state.downloads);
      const existingDownload = newDownloads.get(downloadId);
      
      if (existingDownload) {
        newDownloads.set(downloadId, {
          ...existingDownload,
          status: 'failed',
          error,
          endTime: new Date()
        });
      }
      
      return {
        ...state,
        downloads: newDownloads,
        activeDownloads: Math.max(0, state.activeDownloads - 1),
        failedDownloads: state.failedDownloads + 1
      };
    }
    
    case 'CANCEL_DOWNLOAD': {
      const { downloadId } = action.payload;
      const newDownloads = new Map(state.downloads);
      const existingDownload = newDownloads.get(downloadId);
      
      if (existingDownload) {
        newDownloads.set(downloadId, {
          ...existingDownload,
          status: 'cancelled',
          endTime: new Date()
        });
      }
      
      return {
        ...state,
        downloads: newDownloads,
        activeDownloads: Math.max(0, state.activeDownloads - 1)
      };
    }
    
    case 'REMOVE_DOWNLOAD': {
      const { downloadId } = action.payload;
      const newDownloads = new Map(state.downloads);
      const existingDownload = newDownloads.get(downloadId);
      
      if (existingDownload) {
        newDownloads.delete(downloadId);
        
        // Update counters based on the removed download's status
        let activeDownloads = state.activeDownloads;
        let completedDownloads = state.completedDownloads;
        let failedDownloads = state.failedDownloads;
        
        if (existingDownload.status === 'downloading' || existingDownload.status === 'pending') {
          activeDownloads = Math.max(0, activeDownloads - 1);
        } else if (existingDownload.status === 'completed') {
          completedDownloads = Math.max(0, completedDownloads - 1);
        } else if (existingDownload.status === 'failed') {
          failedDownloads = Math.max(0, failedDownloads - 1);
        }
        
        return {
          ...state,
          downloads: newDownloads,
          activeDownloads,
          completedDownloads,
          failedDownloads
        };
      }
      
      return state;
    }
    
    case 'CLEAR_DOWNLOADS':
      return {
        ...state,
        downloads: new Map<string, DownloadStatus>(),
        activeDownloads: 0,
        completedDownloads: 0,
        failedDownloads: 0
      };
      
    // Global state actions
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error
      };
      
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
      
    // Notification actions
    case 'ADD_NOTIFICATION': {
      const notification: Notification = {
        ...action.payload.notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      
      return {
        ...state,
        notifications: [...state.notifications, notification]
      };
    }
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload.id)
      };
      
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: []
      };
      
    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Convenience action creators
  actions: {
    // Search actions
    startSearch: (query: string) => void;
    searchSuccess: (results: SearchResults, query: string) => void;
    searchError: (error: ErrorState, query: string) => void;
    selectArtist: (artist: Artist) => void;
    setAlbums: (albums: Album[]) => void;
    clearSearch: () => void;
    
    // Selection actions
    toggleAlbumSelection: (albumId: string) => void;
    selectAllAlbums: () => void;
    deselectAllAlbums: () => void;
    setAlbumSelection: (albumId: string, selected: boolean) => void;
    clearSelection: () => void;
    
    // Download actions
    startDownload: (downloadId: string, albumIds: string[]) => void;
    updateDownload: (downloadId: string, status: Partial<DownloadStatus>) => void;
    completeDownload: (downloadId: string) => void;
    failDownload: (downloadId: string, error: string) => void;
    cancelDownload: (downloadId: string) => void;
    removeDownload: (downloadId: string) => void;
    clearDownloads: () => void;
    
    // Global state actions
    setLoading: (isLoading: boolean) => void;
    setError: (error: ErrorState | null) => void;
    clearError: () => void;
    
    // Notification actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    clearNotifications: () => void;
    
    // Utility actions
    showSuccessNotification: (title: string, message: string) => void;
    showErrorNotification: (title: string, message: string) => void;
    showWarningNotification: (title: string, message: string) => void;
    showInfoNotification: (title: string, message: string) => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export function AppProvider({ children, initialState: providedInitialState }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    ...providedInitialState
  });
  
  // Action creators for convenience
  const actions = {
    // Search actions
    startSearch: (query: string) => dispatch({ type: 'SEARCH_START', payload: { query } }),
    searchSuccess: (results: SearchResults, query: string) => dispatch({ type: 'SEARCH_SUCCESS', payload: { results, query } }),
    searchError: (error: ErrorState, query: string) => dispatch({ type: 'SEARCH_ERROR', payload: { error, query } }),
    selectArtist: (artist: Artist) => dispatch({ type: 'SELECT_ARTIST', payload: { artist } }),
    setAlbums: (albums: Album[]) => dispatch({ type: 'SET_ALBUMS', payload: { albums } }),
    clearSearch: () => dispatch({ type: 'CLEAR_SEARCH' }),
    
    // Selection actions
    toggleAlbumSelection: (albumId: string) => dispatch({ type: 'TOGGLE_ALBUM_SELECTION', payload: { albumId } }),
    selectAllAlbums: () => dispatch({ type: 'SELECT_ALL_ALBUMS' }),
    deselectAllAlbums: () => dispatch({ type: 'DESELECT_ALL_ALBUMS' }),
    setAlbumSelection: (albumId: string, selected: boolean) => dispatch({ type: 'SET_ALBUM_SELECTION', payload: { albumId, selected } }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    
    // Download actions
    startDownload: (downloadId: string, albumIds: string[]) => dispatch({ type: 'START_DOWNLOAD', payload: { downloadId, albumIds } }),
    updateDownload: (downloadId: string, status: Partial<DownloadStatus>) => dispatch({ type: 'UPDATE_DOWNLOAD', payload: { downloadId, status } }),
    completeDownload: (downloadId: string) => dispatch({ type: 'COMPLETE_DOWNLOAD', payload: { downloadId } }),
    failDownload: (downloadId: string, error: string) => dispatch({ type: 'FAIL_DOWNLOAD', payload: { downloadId, error } }),
    cancelDownload: (downloadId: string) => dispatch({ type: 'CANCEL_DOWNLOAD', payload: { downloadId } }),
    removeDownload: (downloadId: string) => dispatch({ type: 'REMOVE_DOWNLOAD', payload: { downloadId } }),
    clearDownloads: () => dispatch({ type: 'CLEAR_DOWNLOADS' }),
    
    // Global state actions
    setLoading: (isLoading: boolean) => dispatch({ type: 'SET_LOADING', payload: { isLoading } }),
    setError: (error: ErrorState | null) => dispatch({ type: 'SET_ERROR', payload: { error } }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    
    // Notification actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => dispatch({ type: 'ADD_NOTIFICATION', payload: { notification } }),
    removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id } }),
    clearNotifications: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
    
    // Utility notification actions
    showSuccessNotification: (title: string, message: string) => {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          notification: { 
            type: 'success', 
            title, 
            message, 
            autoClose: true, 
            duration: 5000 
          } 
        } 
      });
    },
    showErrorNotification: (title: string, message: string) => {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          notification: { 
            type: 'error', 
            title, 
            message, 
            autoClose: false 
          } 
        } 
      });
    },
    showWarningNotification: (title: string, message: string) => {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          notification: { 
            type: 'warning', 
            title, 
            message, 
            autoClose: true, 
            duration: 7000 
          } 
        } 
      });
    },
    showInfoNotification: (title: string, message: string) => {
      dispatch({ 
        type: 'ADD_NOTIFICATION', 
        payload: { 
          notification: { 
            type: 'info', 
            title, 
            message, 
            autoClose: true, 
            duration: 4000 
          } 
        } 
      });
    }
  };
  
  const contextValue: AppContextType = {
    state,
    dispatch,
    actions
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// ============================================================================
// Selector Hooks for Performance
// ============================================================================

export function useSearchState() {
  const { state } = useAppContext();
  return {
    searchResults: state.searchResults,
    selectedArtist: state.selectedArtist,
    albums: state.albums,
    isSearching: state.isSearching
  };
}

export function useSelectionState() {
  const { state } = useAppContext();
  return {
    selectedAlbums: state.selectedAlbums,
    selectAllState: state.selectAllState
  };
}

export function useDownloadState() {
  const { state } = useAppContext();
  return {
    downloads: state.downloads,
    activeDownloads: state.activeDownloads,
    completedDownloads: state.completedDownloads,
    failedDownloads: state.failedDownloads
  };
}

export function useErrorState() {
  const { state } = useAppContext();
  return {
    error: state.error,
    isLoading: state.isLoading
  };
}

export function useNotifications() {
  const { state } = useAppContext();
  return state.notifications;
}
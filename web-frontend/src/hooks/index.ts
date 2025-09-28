// Export all custom React Query hooks
// Provides a centralized export point for all hooks

// Search hooks
export {
  useSearchArtists,
  useSearchSuggestions,
  useSearch,
  useSearchHistory,
  usePrefetchArtistAlbums,
  useCachedSearchResults,
} from './useSearch';

// Album hooks
export {
  useArtistAlbums,
  useArtistDetail,
  useAlbumSelection,
  useSelectedAlbumsData,
  usePrefetchAlbumDetails,
  useAlbumFilters,
  useAlbumStats,
} from './useAlbums';

// Download hooks
export {
  useDownloadAlbums,
  useDownloadStatus,
  useCancelDownload,
  useDownloadsList,
  useDownloadStats,
  useBatchDownload,
  useDownloadQueue,
} from './useDownloads';

// Selection hooks
export {
  useSelection,
  type UseSelectionReturn,
} from './useSelection';

// Error handling hooks
export { 
  default as useErrorHandler,
  useApiErrorHandler,
  useNetworkErrorHandler,
  useSilentErrorHandler
} from './useErrorHandler';
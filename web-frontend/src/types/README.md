# TypeScript Types and Interfaces

This directory contains all TypeScript type definitions, interfaces, and utility functions for the DAB Music Downloader frontend application.

## File Structure

```
types/
├── index.ts          # Main type definitions and core interfaces
├── api.ts           # API-specific types and endpoint definitions
├── errors.ts        # Error handling types and utilities
├── validation.ts    # Input validation types and functions
├── README.md        # This documentation file
└── __tests__/       # Type definition tests
    └── types.test.ts
```

## Core Data Models

### Artist
Represents a music artist with their metadata and optional albums/tracks.

```typescript
interface Artist {
  id: string | number;
  name: string;
  picture?: string;
  albums?: Album[];
  tracks?: Track[];
  bio?: string;
  country?: string;
  followers?: number;
}
```

### Album
Represents a music album with tracks and metadata.

```typescript
interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  releaseDate: string;
  tracks: Track[];
  genre?: string;
  type?: string; // "album", "ep", "single", etc.
  // ... additional optional fields
}
```

### Track
Represents an individual music track.

```typescript
interface Track {
  id: string | number;
  title: string;
  artist: string;
  cover: string;
  releaseDate: string;
  duration: number;
  // ... additional optional fields
}
```

### DownloadStatus
Tracks the progress and status of album downloads.

```typescript
interface DownloadStatus {
  id: string;
  albumId: string;
  albumTitle: string;
  artistName: string;
  status: 'pending' | 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  // ... additional optional fields
}
```

## API Types

### Request Parameters
All API request parameter types are defined in `api.ts`:

- `SearchRequestParams` - For search operations
- `AlbumRequestParams` - For album retrieval
- `DownloadRequestParams` - For download initiation
- And more...

### Response Types
API response types follow a consistent structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}
```

Specific response types include:
- `SearchApiResponse`
- `AlbumApiResponse`
- `DownloadApiResponse`
- And more...

## Error Handling

### ErrorState
Structured error information for consistent error handling:

```typescript
interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string | number;
  retryable: boolean;
  timestamp: Date;
  context?: Record<string, any>;
}
```

### ErrorHandler Class
Utility class for processing different types of errors:

```typescript
// Handle API errors
const errorState = ErrorHandler.handleApiError(axiosError);

// Get user-friendly messages
const message = ErrorHandler.getUserFriendlyMessage(errorState);

// Check if error should be retried
const shouldRetry = ErrorHandler.shouldRetry(errorState, attemptCount, maxRetries);
```

## Validation

### Validation Functions
Input validation utilities for common operations:

```typescript
// Validate search queries
const result = validateSearchQuery("Arctic Monkeys");
if (result.isValid) {
  // Query is valid
} else {
  console.log(result.errors); // Validation errors
}

// Validate album IDs
const albumResult = validateAlbumIds(["album1", "album2"]);

// Sanitize input
const cleanQuery = sanitizeSearchQuery("  Arctic   Monkeys  ");
```

### Pre-built Validators
Common validators are available in the `VALIDATORS` object:

```typescript
import { VALIDATORS } from './types';

const queryValidation = VALIDATORS.searchQuery.validate(userInput);
const albumIdValidation = VALIDATORS.albumId.validate(albumId);
```

## UI State Management

### Application State
Global application state structure:

```typescript
interface AppState {
  search: SearchState;
  selection: SelectionState;
  downloads: DownloadState;
  selectedArtist: Artist | null;
  albums: Album[];
  isLoading: boolean;
  error: string | null;
}
```

### Component Props
Type-safe component props for all UI components:

```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  debounceMs?: number;
}

interface AlbumCardProps {
  album: Album;
  isSelected: boolean;
  onSelect: (albumId: string, selected: boolean) => void;
  showArtist?: boolean;
  size?: 'small' | 'medium' | 'large';
}
```

## Type Guards

Type guards are provided for runtime type checking:

```typescript
// Check error types
if (isNetworkError(error)) {
  // Handle network error
}

if (isApiError(error)) {
  // Handle API error
}

// Validate enum values
if (isValidDownloadStatus(status)) {
  // Status is valid
}

if (isValidSearchType(type)) {
  // Search type is valid
}
```

## Usage Examples

### Basic Usage

```typescript
import { 
  Artist, 
  Album, 
  SearchResults, 
  validateSearchQuery,
  ErrorHandler 
} from './types';

// Create type-safe objects
const artist: Artist = {
  id: '123',
  name: 'Arctic Monkeys',
  picture: 'https://example.com/artist.jpg'
};

// Validate input
const validation = validateSearchQuery(userInput);
if (!validation.isValid) {
  console.error('Invalid query:', validation.errors);
  return;
}

// Handle errors
try {
  const response = await apiCall();
} catch (error) {
  const errorState = ErrorHandler.handleApiError(error);
  const userMessage = ErrorHandler.getUserFriendlyMessage(errorState);
  showErrorToUser(userMessage);
}
```

### API Integration

```typescript
import { 
  SearchRequestParams, 
  SearchApiResponse, 
  isSuccessResponse 
} from './types';

async function searchArtists(query: string): Promise<Artist[]> {
  const params: SearchRequestParams = {
    q: query,
    type: 'artist',
    limit: 20
  };
  
  const response = await apiClient.get<SearchApiResponse>('/api/search', { params });
  
  if (isSuccessResponse(response.data)) {
    return response.data.data.artists;
  } else {
    throw new Error(response.data.error);
  }
}
```

### Form Validation

```typescript
import { VALIDATORS, ValidationResult } from './types';

function validateSearchForm(formData: { query: string }): ValidationResult {
  return VALIDATORS.searchQuery.validate(formData.query);
}

// In component
const handleSubmit = (formData: { query: string }) => {
  const validation = validateSearchForm(formData);
  if (!validation.isValid) {
    setErrors(validation.errors);
    return;
  }
  
  // Proceed with search
  onSearch(formData.query);
};
```

## Testing

All types include comprehensive tests in the `__tests__` directory. Run tests with:

```bash
npm run test:run src/types/__tests__/types.test.ts
```

The tests cover:
- Type creation and validation
- Type guards functionality
- Validation functions
- Error handling utilities
- Edge cases and error conditions

## Best Practices

1. **Always use type guards** when working with data from external sources
2. **Validate user input** using the provided validation functions
3. **Handle errors consistently** using the ErrorHandler class
4. **Use specific types** instead of `any` whenever possible
5. **Leverage TypeScript's strict mode** for better type safety
6. **Document complex types** with JSDoc comments
7. **Test type definitions** to ensure they work as expected

## Contributing

When adding new types:

1. Add the type definition to the appropriate file
2. Export it from `index.ts` if it's a core type
3. Add type guards if needed
4. Include validation functions for user input types
5. Write tests for the new types
6. Update this documentation

## Migration Notes

These types are designed to match the Go backend data structures. When the backend changes:

1. Update the corresponding TypeScript interfaces
2. Update validation rules if needed
3. Run tests to ensure compatibility
4. Update API endpoint types if routes change
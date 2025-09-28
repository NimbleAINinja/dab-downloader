// Validation utilities and types for DAB Music Downloader Frontend

import type { ValidationResult, SearchParams, DownloadRequest } from './index';

// ============================================================================
// Validation Rules and Constants
// ============================================================================

export const VALIDATION_RULES = {
  SEARCH_QUERY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-_.,!?'"()&]+$/
  },
  ALBUM_ID: {
    PATTERN: /^[a-zA-Z0-9\-_]+$/
  },
  DOWNLOAD_LIMIT: {
    MAX_CONCURRENT: 5,
    MAX_BATCH_SIZE: 50
  }
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates a search query
 */
export function validateSearchQuery(query: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!query || query.trim().length === 0) {
    errors.query = 'Search query cannot be empty';
  } else if (query.trim().length < VALIDATION_RULES.SEARCH_QUERY.MIN_LENGTH) {
    errors.query = `Search query must be at least ${VALIDATION_RULES.SEARCH_QUERY.MIN_LENGTH} character(s)`;
  } else if (query.length > VALIDATION_RULES.SEARCH_QUERY.MAX_LENGTH) {
    errors.query = `Search query cannot exceed ${VALIDATION_RULES.SEARCH_QUERY.MAX_LENGTH} characters`;
  } else if (!VALIDATION_RULES.SEARCH_QUERY.PATTERN.test(query)) {
    errors.query = 'Search query contains invalid characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates search parameters
 */
export function validateSearchParams(params: SearchParams): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate query
  const queryValidation = validateSearchQuery(params.query);
  if (!queryValidation.isValid) {
    Object.assign(errors, queryValidation.errors);
  }
  
  // Validate search type
  const validTypes = ['artist', 'album', 'track', 'all'];
  if (!validTypes.includes(params.type)) {
    errors.type = `Search type must be one of: ${validTypes.join(', ')}`;
  }
  
  // Validate limit
  if (params.limit !== undefined) {
    if (params.limit < 1) {
      errors.limit = 'Limit must be at least 1';
    } else if (params.limit > 100) {
      errors.limit = 'Limit cannot exceed 100';
    }
  }
  
  // Validate offset
  if (params.offset !== undefined && params.offset < 0) {
    errors.offset = 'Offset cannot be negative';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates an album ID
 */
export function validateAlbumId(albumId: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!albumId || albumId.trim().length === 0) {
    errors.albumId = 'Album ID cannot be empty';
  } else if (!VALIDATION_RULES.ALBUM_ID.PATTERN.test(albumId)) {
    errors.albumId = 'Album ID contains invalid characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates a list of album IDs
 */
export function validateAlbumIds(albumIds: string[]): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!Array.isArray(albumIds)) {
    errors.albumIds = 'Album IDs must be an array';
    return { isValid: false, errors };
  }
  
  if (albumIds.length === 0) {
    errors.albumIds = 'At least one album ID is required';
  } else if (albumIds.length > VALIDATION_RULES.DOWNLOAD_LIMIT.MAX_BATCH_SIZE) {
    errors.albumIds = `Cannot download more than ${VALIDATION_RULES.DOWNLOAD_LIMIT.MAX_BATCH_SIZE} albums at once`;
  }
  
  // Validate each album ID
  const invalidIds: string[] = [];
  albumIds.forEach((id, index) => {
    const validation = validateAlbumId(id);
    if (!validation.isValid) {
      invalidIds.push(`Position ${index + 1}: ${validation.errors.albumId}`);
    }
  });
  
  if (invalidIds.length > 0) {
    errors.albumIds = `Invalid album IDs: ${invalidIds.join(', ')}`;
  }
  
  // Check for duplicates
  const uniqueIds = new Set(albumIds);
  if (uniqueIds.size !== albumIds.length) {
    errors.albumIds = 'Duplicate album IDs are not allowed';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates download request parameters
 */
export function validateDownloadRequest(request: DownloadRequest): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate album IDs
  const albumIdsValidation = validateAlbumIds(request.albumIds);
  if (!albumIdsValidation.isValid) {
    Object.assign(errors, albumIdsValidation.errors);
  }
  
  // Validate format
  if (request.format !== undefined) {
    const validFormats = ['flac', 'mp3', 'aac', 'ogg'];
    if (!validFormats.includes(request.format.toLowerCase())) {
      errors.format = `Format must be one of: ${validFormats.join(', ')}`;
    }
  }
  
  // Validate bitrate
  if (request.bitrate !== undefined) {
    const validBitrates = ['128', '192', '256', '320', 'lossless'];
    if (!validBitrates.includes(request.bitrate)) {
      errors.bitrate = `Bitrate must be one of: ${validBitrates.join(', ')}`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!url || url.trim().length === 0) {
    errors.url = 'URL cannot be empty';
  } else {
    try {
      new URL(url);
    } catch {
      errors.url = 'Invalid URL format';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates email format (for future use)
 */
export function validateEmail(email: string): ValidationResult {
  const errors: Record<string, string> = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim().length === 0) {
    errors.email = 'Email cannot be empty';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Invalid email format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// Input Sanitization
// ============================================================================

/**
 * Sanitizes search query input
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  
  return query
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, VALIDATION_RULES.SEARCH_QUERY.MAX_LENGTH); // Truncate if too long
}

/**
 * Sanitizes album ID input
 */
export function sanitizeAlbumId(albumId: string): string {
  if (!albumId) return '';
  
  return albumId.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
}

/**
 * Sanitizes a list of album IDs
 */
export function sanitizeAlbumIds(albumIds: string[]): string[] {
  if (!Array.isArray(albumIds)) return [];
  
  return albumIds
    .map(sanitizeAlbumId)
    .filter(id => id.length > 0)
    .slice(0, VALIDATION_RULES.DOWNLOAD_LIMIT.MAX_BATCH_SIZE);
}

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Generic form field validator
 */
export interface FieldValidator<T> {
  validate: (value: T) => ValidationResult;
  sanitize?: (value: T) => T;
}

/**
 * Creates a validator for required fields
 */
export function createRequiredValidator<T>(
  fieldName: string,
  isEmpty: (value: T) => boolean = (value) => !value
): FieldValidator<T> {
  return {
    validate: (value: T) => ({
      isValid: !isEmpty(value),
      errors: isEmpty(value) ? { [fieldName]: `${fieldName} is required` } : {}
    })
  };
}

/**
 * Creates a validator for string length
 */
export function createLengthValidator(
  fieldName: string,
  minLength: number = 0,
  maxLength: number = Infinity
): FieldValidator<string> {
  return {
    validate: (value: string) => {
      const errors: Record<string, string> = {};
      const length = value ? value.length : 0;
      
      if (length < minLength) {
        errors[fieldName] = `${fieldName} must be at least ${minLength} characters`;
      } else if (length > maxLength) {
        errors[fieldName] = `${fieldName} cannot exceed ${maxLength} characters`;
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    },
    sanitize: (value: string) => value ? value.slice(0, maxLength) : ''
  };
}

/**
 * Creates a validator for pattern matching
 */
export function createPatternValidator(
  fieldName: string,
  pattern: RegExp,
  errorMessage?: string
): FieldValidator<string> {
  return {
    validate: (value: string) => {
      const errors: Record<string, string> = {};
      
      if (value && !pattern.test(value)) {
        errors[fieldName] = errorMessage || `${fieldName} format is invalid`;
      }
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }
  };
}

/**
 * Combines multiple validators for a single field
 */
export function combineValidators<T>(...validators: FieldValidator<T>[]): FieldValidator<T> {
  return {
    validate: (value: T) => {
      const allErrors: Record<string, string> = {};
      let isValid = true;
      
      for (const validator of validators) {
        const result = validator.validate(value);
        if (!result.isValid) {
          isValid = false;
          Object.assign(allErrors, result.errors);
        }
      }
      
      return {
        isValid,
        errors: allErrors
      };
    },
    sanitize: (value: T) => {
      let sanitizedValue = value;
      for (const validator of validators) {
        if (validator.sanitize) {
          sanitizedValue = validator.sanitize(sanitizedValue);
        }
      }
      return sanitizedValue;
    }
  };
}

// ============================================================================
// Pre-built Validators
// ============================================================================

export const VALIDATORS = {
  searchQuery: combineValidators(
    createRequiredValidator<string>('query', (value) => !value || value.trim().length === 0),
    createLengthValidator('query', VALIDATION_RULES.SEARCH_QUERY.MIN_LENGTH, VALIDATION_RULES.SEARCH_QUERY.MAX_LENGTH),
    createPatternValidator('query', VALIDATION_RULES.SEARCH_QUERY.PATTERN, 'Query contains invalid characters')
  ),
  
  albumId: combineValidators(
    createRequiredValidator<string>('albumId', (value) => !value || value.trim().length === 0),
    createPatternValidator('albumId', VALIDATION_RULES.ALBUM_ID.PATTERN, 'Album ID contains invalid characters')
  ),
  
  url: {
    validate: validateUrl
  },
  
  email: {
    validate: validateEmail
  }
} as const;
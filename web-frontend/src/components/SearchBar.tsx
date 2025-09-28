import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onResults?: (results: any[]) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onResults,
  placeholder = "Search for artists...",
  className = "",
  autoFocus = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setIsLoading(true);
        onSearch(query.trim());

        // Simulate API delay and provide mock results
        setTimeout(() => {
          const mockResults = [
            { id: '1', name: 'Test Artist 1' },
            { id: '2', name: 'Test Artist 2' },
            { id: '3', name: 'Test Artist 3' },
          ].filter(artist =>
            artist.name.toLowerCase().includes(query.toLowerCase())
          );

          if (onResults) {
            onResults(mockResults);
          }
          setIsLoading(false);
        }, 500);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch, onResults]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto focus on mount if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">🔍</span>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-12 py-3
            border border-gray-300 rounded-lg
            bg-white text-gray-900 placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-all duration-200
          `}
          aria-label="Search for artists"
        />

        {/* Right side icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading && (
            <div className="mr-2 animate-spin">⏳</div>
          )}

          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

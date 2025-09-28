import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SearchBar from '../SearchBar';
import * as useSearchModule from '../../hooks/useSearch';

// Mock the search hooks
vi.mock('../../hooks/useSearch');
vi.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: ({ className, ...props }: any) => (
    <div data-testid="magnifying-glass-icon" className={className} {...props} />
  ),
  XMarkIcon: ({ className, ...props }: any) => (
    <div data-testid="x-mark-icon" className={className} {...props} />
  ),
}));

const mockUseSearchArtists = vi.mocked(useSearchModule.useSearchArtists);
const mockUseSearchHistory = vi.mocked(useSearchModule.useSearchHistory);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();
  const mockOnResults = vi.fn();
  const mockAddToHistory = vi.fn();
  const mockClearHistory = vi.fn();
  const mockRemoveFromHistory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseSearchArtists.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isFetching: false,
      isSuccess: true,
    } as any);

    mockUseSearchHistory.mockReturnValue({
      searchHistory: [],
      addToHistory: mockAddToHistory,
      clearHistory: mockClearHistory,
      removeFromHistory: mockRemoveFromHistory,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search for artists...')).toBeInTheDocument();
      expect(screen.getByTestId('magnifying-glass-icon')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} placeholder="Custom placeholder" />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} className="custom-class" />
        </TestWrapper>
      );

      expect(screen.getByRole('combobox').closest('.custom-class')).toBeInTheDocument();
    });

    it('can be disabled', () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} disabled />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      expect(input).toBeDisabled();
    });

    it('auto focuses when autoFocus is true', () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} autoFocus />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveFocus();
    });
  });

  describe('Input Handling', () => {
    it('updates input value when typing', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'test query');

      expect(input).toHaveValue('test query');
    });

    it('shows clear button when input has value', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'test');

      expect(screen.getByTestId('x-mark-icon')).toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('debounces search queries with 300ms delay', async () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      
      // Type quickly
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Should not call onSearch immediately
      expect(mockOnSearch).not.toHaveBeenCalled();
      
      // Advance timers by 300ms
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Now should call onSearch
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });

    it('cancels previous debounce when typing continues', async () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      
      // Type first part
      fireEvent.change(input, { target: { value: 'te' } });
      
      // Advance time partially
      act(() => {
        vi.advanceTimersByTime(200);
      });
      
      // Type more (should reset debounce)
      fireEvent.change(input, { target: { value: 'test' } });
      
      // Advance remaining time from first debounce
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      // Should not have called onSearch yet
      expect(mockOnSearch).not.toHaveBeenCalled();
      
      // Advance full debounce time from second typing
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Now should call with full query
      expect(mockOnSearch).toHaveBeenCalledWith('test');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('submits search on Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'test query');
      await user.keyboard('{Enter}');

      expect(mockOnSearch).toHaveBeenCalledWith('test query');
      expect(mockAddToHistory).toHaveBeenCalledWith('test query');
    });

    it('clears input on Escape key', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      await user.keyboard('{Escape}');

      expect(input).toHaveValue('');
    });

    it('prevents default behavior for arrow keys', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      
      // These should not cause any errors or unexpected behavior
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      
      // Input should still be focused
      expect(input).toHaveFocus();
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows loading indicator when searching', () => {
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: true,
        isSuccess: false,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      // Need to have a debounced query for loading to show
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'test' } });

      // Simulate debounced query being set
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByLabelText('Searching...')).toBeInTheDocument();
    });

    it('hides loading indicator when not searching', () => {
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when search fails', () => {
      const errorMessage = 'Search failed';
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error(errorMessage),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays generic error message for non-Error objects', () => {
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: false,
        error: 'String error',
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
    });

    it('applies error styling when there is an error', () => {
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Test error'),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveClass('border-red-300');
    });
  });

  describe('Search History', () => {
    it('displays search history when focused and no query', async () => {
      const mockHistory = ['previous search', 'another search'];
      mockUseSearchHistory.mockReturnValue({
        searchHistory: mockHistory,
        addToHistory: mockAddToHistory,
        clearHistory: mockClearHistory,
        removeFromHistory: mockRemoveFromHistory,
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('previous search')).toBeInTheDocument();
      expect(screen.getByText('another search')).toBeInTheDocument();
    });

    it('selects history item when clicked', async () => {
      const mockHistory = ['previous search'];
      mockUseSearchHistory.mockReturnValue({
        searchHistory: mockHistory,
        addToHistory: mockAddToHistory,
        clearHistory: mockClearHistory,
        removeFromHistory: mockRemoveFromHistory,
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      const historyItem = screen.getByText('previous search');
      await user.click(historyItem);

      expect(input).toHaveValue('previous search');
      expect(mockOnSearch).toHaveBeenCalledWith('previous search');
    });

    it('limits history display to 5 items', async () => {
      const mockHistory = Array.from({ length: 10 }, (_, i) => `search ${i + 1}`);
      mockUseSearchHistory.mockReturnValue({
        searchHistory: mockHistory,
        addToHistory: mockAddToHistory,
        clearHistory: mockClearHistory,
        removeFromHistory: mockRemoveFromHistory,
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      // Should only show first 5 items
      expect(screen.getByText('search 1')).toBeInTheDocument();
      expect(screen.getByText('search 5')).toBeInTheDocument();
      expect(screen.queryByText('search 6')).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('applies focus styles when focused', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      expect(input).toHaveClass('shadow-lg');
    });

    it('removes focus styles when blurred', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.tab(); // Move focus away

      await waitFor(() => {
        expect(input).toHaveClass('shadow-sm');
      });
    });
  });

  describe('Results Callback', () => {
    it('calls onResults when search results change', () => {
      const mockResults = [{ id: '1', name: 'Test Artist' }];
      mockUseSearchArtists.mockReturnValue({
        data: mockResults,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isFetching: false,
        isSuccess: true,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} onResults={mockOnResults} />
        </TestWrapper>
      );

      expect(mockOnResults).toHaveBeenCalledWith(mockResults);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-label', 'Search for artists');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('updates aria-expanded when focused with history', async () => {
      mockUseSearchHistory.mockReturnValue({
        searchHistory: ['test'],
        addToHistory: mockAddToHistory,
        clearHistory: mockClearHistory,
        removeFromHistory: mockRemoveFromHistory,
      });

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      expect(input).toHaveAttribute('aria-expanded', 'true');
    });

    it('associates error message with input', () => {
      mockUseSearchArtists.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Test error'),
        refetch: vi.fn(),
        isError: true,
        isFetching: false,
        isSuccess: false,
      } as any);

      render(
        <TestWrapper>
          <SearchBar onSearch={mockOnSearch} />
        </TestWrapper>
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-describedby', 'search-error');
    });
  });
});
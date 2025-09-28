import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    
    const srText = screen.getByText('Loading...');
    expect(srText).toHaveClass('sr-only');
  });

  it('renders with custom label', () => {
    const customLabel = 'Searching for albums...';
    render(<LoadingSpinner label={customLabel} />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', customLabel);
    
    const srText = screen.getByText(customLabel);
    expect(srText).toHaveClass('sr-only');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass('w-4', 'h-4', 'border-2');

    rerender(<LoadingSpinner size="medium" />);
    spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass('w-6', 'h-6', 'border-2');

    rerender(<LoadingSpinner size="large" />);
    spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass('w-8', 'h-8');
  });

  it('applies color classes correctly', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    let spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass('border-blue-500', 'border-t-transparent');

    rerender(<LoadingSpinner color="white" />);
    spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass('border-white', 'border-t-transparent');

    rerender(<LoadingSpinner color="gray" />);
    spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass('border-gray-300', 'border-t-gray-500');
  });

  it('renders inline when specified', () => {
    render(<LoadingSpinner inline />);
    
    const container = screen.getByRole('status');
    expect(container).toHaveClass('inline-flex');
  });

  it('applies custom className', () => {
    const customClass = 'custom-spinner-class';
    render(<LoadingSpinner className={customClass} />);
    
    const spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveClass(customClass);
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner label="Custom loading message" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });
});
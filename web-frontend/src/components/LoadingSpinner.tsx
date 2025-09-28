import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  label?: string;
  inline?: boolean;
}

/**
 * Accessible loading spinner component with smooth animations
 * Provides visual loading indication with proper ARIA labels
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  label = 'Loading...',
  inline = false,
}) => {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2',
    large: 'w-8 h-8 border-3',
  };

  // Color classes
  const colorClasses = {
    primary: 'border-blue-500 border-t-transparent',
    secondary: 'border-gray-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-gray-500',
  };

  const spinnerClasses = `
    ${sizeClasses[size]}
    ${colorClasses[color]}
    rounded-full
    animate-spin
    transition-all
    duration-200
    ${className}
  `;

  const containerClasses = inline 
    ? 'inline-flex items-center justify-center'
    : 'flex items-center justify-center';

  return (
    <div 
      className={containerClasses}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className={spinnerClasses} />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
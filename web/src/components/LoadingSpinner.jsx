import React from 'react';

const LoadingSpinner = ({
  message = "Loading data...",
  size = "md" // sm, md, lg
}) => {
  const sizeStyles = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full">
      <div className={`animate-spin rounded-full border-t-transparent border-medical-500 ${currentSize}`} />
      {message && (
        <p className="mt-4 text-sm font-semibold text-slate-400 uppercase tracking-wider animate-pulse-slow">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;

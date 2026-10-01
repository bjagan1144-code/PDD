import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md',        // sm, md, lg
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon = null,
  iconPosition = 'left'
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0f19] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-medical-600 to-biotech-600 hover:from-medical-500 hover:to-biotech-500 text-white shadow-lg shadow-medical-500/10 hover:shadow-medical-500/20 focus:ring-medical-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500',
    outline: 'bg-transparent border border-medical-500/50 hover:bg-medical-500/10 text-medical-400 focus:ring-medical-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/15 focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-100 focus:ring-slate-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className={`h-4 w-4 mr-2 ${size === 'sm' ? 'h-3.5 w-3.5' : ''}`} />
      ) : null}
      
      {children}
      
      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className={`h-4 w-4 ml-2 ${size === 'sm' ? 'h-3.5 w-3.5' : ''}`} />
      ) : null}
    </button>
  );
};

export default Button;

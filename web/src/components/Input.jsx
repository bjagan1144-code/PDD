import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4.5 w-4.5 text-slate-500" aria-hidden="true" />
          </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-lg border bg-slate-900/60 text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm
            ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5
            ${error ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-medical-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : 'hover:border-slate-700'}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;

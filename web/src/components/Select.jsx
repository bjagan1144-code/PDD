import React from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [], // [{ value: '...', label: '...' }] or array of strings
  error = '',
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select option',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor={name}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-lg border bg-slate-900/60 text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm px-3.5 py-2.5 cursor-pointer
          ${error ? 'border-red-500/80 focus:ring-red-500' : 'border-slate-800 focus:border-medical-500'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : 'hover:border-slate-700'}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-slate-900 text-slate-500">
            {placeholder}
          </option>
        )}
        {options.map((opt, idx) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const val = isObj ? opt.value : opt;
          const lbl = isObj ? opt.label : opt;
          
          return (
            <option key={idx} value={val} className="bg-slate-900 text-slate-100">
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Select;

import React from 'react';

const Slider = ({
  label,
  name,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  unit = '',
  className = '',
  disabled = false
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1.5">
        {label && (
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider" htmlFor={name}>
            {label}
          </label>
        )}
        <span className="text-sm font-semibold text-medical-400 bg-medical-500/10 px-2.5 py-0.5 rounded border border-medical-500/20 shadow-sm shadow-medical-500/5">
          {value}
          <span className="text-xs text-slate-400 ml-0.5 font-normal">{unit}</span>
        </span>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className="text-xs text-slate-500 font-medium w-8">{min}</span>
        <input
          type="range"
          id={name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500 hover:accent-medical-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-xs text-slate-500 font-medium w-8 text-right">{max}</span>
      </div>
    </div>
  );
};

export default Slider;

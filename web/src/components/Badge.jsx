import React from 'react';

const Badge = ({
  children,
  variant = 'info', // success, warning, danger, info, neutral
  className = '',
  hasDot = false
}) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    neutral: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  const dotColors = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
    neutral: 'bg-slate-400'
  };

  const activeStyle = styles[variant] || styles.info;
  const dotColor = dotColors[variant] || dotColors.info;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${activeStyle} ${className}`}>
      {hasDot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;

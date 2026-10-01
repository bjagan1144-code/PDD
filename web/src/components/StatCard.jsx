import React from 'react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend = null, // { value: '12%', positive: true }
  variant = 'cyan' // blue, teal, cyan, purple
}) => {
  const accentColors = {
    blue: 'text-medical-400 bg-medical-500/10 border-medical-500/20 shadow-medical-500/5',
    teal: 'text-biotech-400 bg-biotech-500/10 border-biotech-500/20 shadow-biotech-500/5',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/5',
    purple: 'text-science-400 bg-science-500/10 border-science-500/20 shadow-science-500/5'
  };

  const currentAccent = accentColors[variant] || accentColors.cyan;

  return (
    <div className="glass-card glass-card-hover p-6 flex flex-col justify-between relative overflow-hidden interactive-glow">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-1.5">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border shadow-inner ${currentAccent}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(trend || description) && (
        <div className="flex items-center mt-4 pt-4 border-t border-slate-800/80 text-xs">
          {trend && (
            <span className={`font-semibold mr-2 px-1.5 py-0.5 rounded ${
              trend.positive 
                ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' 
                : 'text-rose-400 bg-rose-500/5 border border-rose-500/10'
            }`}>
              {trend.positive ? '+' : ''}{trend.value}
            </span>
          )}
          <span className="text-slate-400 font-medium">
            {description}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

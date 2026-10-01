import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const Toast = ({
  message,
  type = 'success', // success, error, info, warning
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400" />,
    info: <Info className="h-5 w-5 text-cyan-400" />
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    error: 'border-rose-500/20 bg-rose-500/5',
    info: 'border-cyan-500/20 bg-cyan-500/5'
  };

  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 max-w-sm ${borderColors[type] || borderColors.success}`}>
      <div className="flex-shrink-0 mr-3">
        {icons[type]}
      </div>
      <div className="mr-6 text-sm font-medium text-slate-200">
        {message}
      </div>
      <button
        onClick={onClose}
        className="ml-auto text-slate-500 hover:text-slate-300 focus:outline-none transition-colors p-0.5 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;

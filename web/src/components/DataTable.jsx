import React from 'react';

const DataTable = ({
  headers = [], // [{ key: '...', label: '...' }]
  data = [],
  onRowClick = null,
  emptyMessage = "No records found.",
  isLoading = false
}) => {
  return (
    <div className="w-full overflow-hidden border border-slate-800 bg-slate-900/40 rounded-xl">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0e121e]">
              {headers.map((h, i) => (
                <th 
                  key={i} 
                  className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-12 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-medical-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-slate-400 font-medium">Fetching records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-12 text-center text-slate-400 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr 
                  key={i}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-800/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {headers.map((h, j) => {
                    const value = row[h.key];
                    return (
                      <td key={j} className="px-5 py-4 whitespace-nowrap text-slate-300 font-medium">
                        {h.render ? h.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

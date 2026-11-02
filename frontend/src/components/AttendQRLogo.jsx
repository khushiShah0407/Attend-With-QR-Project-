import React from 'react';

export const AttendQRLogo = ({
  className = '',
  showTagline = true,
  size = 'md',
  theme = 'light',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Mark: Dynamic QR Pattern + Verification Crest */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-500 shadow-sm shadow-indigo-500/25 text-white p-1.5 shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Top-Left Finder */}
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="5.5" y="5.5" width="2" height="2" fill="currentColor" stroke="none" />

          {/* Top-Right Finder */}
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="16.5" y="5.5" width="2" height="2" fill="currentColor" stroke="none" />

          {/* Bottom-Left Finder */}
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="5.5" y="16.5" width="2" height="2" fill="currentColor" stroke="none" />

          {/* Verification checkmark at bottom right */}
          <path d="M14 17l2.5 2.5 4.5 -4.5" stroke="#38BDF8" strokeWidth="2.5" />
        </svg>
      </div>

      <div className="flex flex-col whitespace-nowrap">
        <div className={`font-bold tracking-tight whitespace-nowrap ${textSizes[size]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Attend With <span className="text-indigo-600 dark:text-indigo-400">QR</span>
        </div>
        {showTagline && (
          <div
            className={`text-[9px] font-semibold tracking-widest uppercase -mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            SCAN • VERIFY • ATTEND
          </div>
        )}
      </div>
    </div>
  );
};

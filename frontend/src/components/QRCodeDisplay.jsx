import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { RefreshCw, Maximize2 } from 'lucide-react';

export const QRCodeDisplay = ({
  value,
  size = 240,
  remainingSec = 15,
  totalSec = 15,
  onOpenProjector,
  darkDisplay = false,
}) => {
  const [generation, setGeneration] = useState({ value: '', dataUrl: '', error: false });
  const [generationAttempt, setGenerationAttempt] = useState(0);
  const dataUrl = generation.value === value ? generation.dataUrl : '';
  const generationError = generation.value === value && generation.error;

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setGeneration({ value: '', dataUrl: '', error: false });
      return () => {
        cancelled = true;
      };
    }

    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: {
        dark: darkDisplay ? '#FFFFFF' : '#0F172A',
        light: darkDisplay ? '#00000000' : '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!cancelled) setGeneration({ value, dataUrl: url, error: false });
      })
      .catch(() => {
        if (!cancelled) setGeneration({ value, dataUrl: '', error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, darkDisplay, generationAttempt]);

  const percentage = Math.min(100, Math.max(0, (remainingSec / totalSec) * 100));
  const qrSizeStyle = {
    width: `min(${size}px, calc(100vw - 10rem))`,
    height: `min(${size}px, calc(100vw - 10rem))`,
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
        darkDisplay
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-2xl'
          : 'bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      {/* High-Contrast QR Code Surface */}
      <div
        aria-busy={!dataUrl && !generationError}
        className={`relative p-3 rounded-xl transition-transform duration-300 ${
          darkDisplay
            ? 'bg-slate-950 border border-slate-800'
            : 'bg-slate-50/80 border border-slate-100'
        }`}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Dynamic Rotating Attendance QR"
            className="rounded-lg object-contain transition-opacity duration-200"
            style={qrSizeStyle}
          />
        ) : (
          <div
            role={generationError ? 'alert' : 'status'}
            aria-live="polite"
            className={`flex flex-col items-center justify-center gap-2 rounded-lg text-center ${
              generationError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                : 'qr-code-skeleton'
            }`}
            style={qrSizeStyle}
          >
            {generationError ? (
              <>
                <span className="px-3 text-xs font-semibold">QR display unavailable</span>
                <button
                  type="button"
                  onClick={() => {
                    setGeneration({ value, dataUrl: '', error: false });
                    setGenerationAttempt((attempt) => attempt + 1);
                  }}
                  className="rounded-lg bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  Generating QR…
                </span>
              </>
            )}
          </div>
        )}

        {/* Center verified security badge */}
        {!generationError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md ${
              darkDisplay
                ? 'bg-slate-900 text-indigo-400 border border-indigo-500/30'
                : 'bg-white text-indigo-600 border border-slate-200'
            }`}
          >
            <div className="w-3 h-3 rounded-sm bg-indigo-600" />
          </div>
        </div>
        )}
      </div>

      {/* Rotation Countdown Row */}
      <div className="w-full mt-5 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {/* Circular Countdown Ring */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className={darkDisplay ? 'text-slate-800' : 'text-slate-200'}
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 transition-all duration-1000 ease-linear"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-[10px] font-bold text-indigo-600">
              {remainingSec}
            </div>
          </div>

          <div className="font-semibold text-slate-700 dark:text-slate-300">
            <span>Rotates in </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              {remainingSec}s
            </span>
          </div>
        </div>

        {onOpenProjector && (
          <button
            onClick={onOpenProjector}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              darkDisplay
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
            Projector mode
          </button>
        )}
      </div>

      <div
        className={`w-full mt-3 pt-3 border-t text-xs flex items-center justify-between font-mono ${
          darkDisplay ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
        }`}
      >
        <span className="truncate max-w-[170px]">TOKEN: {value.slice(0, 16)}...</span>
        <span className="flex items-center gap-1 text-emerald-500 font-sans font-medium text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          ACTIVE
        </span>
      </div>
    </div>
  );
};

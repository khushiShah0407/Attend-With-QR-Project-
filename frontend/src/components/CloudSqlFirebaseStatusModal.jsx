import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, RefreshCw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../utils/api.js';

export const CloudSqlFirebaseStatusModal = () => {
  const { isCloudSqlModalOpen, setIsCloudSqlModalOpen } = useApp();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  const refreshStatus = useCallback(async () => {
    setStatus('checking');
    setError('');
    try {
      await apiRequest('/ready');
      setStatus('ready');
    } catch (requestError) {
      setStatus('unavailable');
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    if (isCloudSqlModalOpen) refreshStatus();
  }, [isCloudSqlModalOpen, refreshStatus]);

  if (!isCloudSqlModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsCloudSqlModalOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-status-title"
        className="my-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="service-status-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Service status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live readiness check from the Attend With QR API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCloudSqlModalOpen(false)}
            aria-label="Close service status"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            {status === 'ready' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : status === 'unavailable' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : (
              <RefreshCw className="h-5 w-5 shrink-0 animate-spin text-indigo-600 dark:text-indigo-400" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {status === 'ready' ? 'API and database are ready' : status === 'unavailable' ? 'Service is unavailable' : 'Checking service…'}
              </p>
              {error && <p role="alert" className="mt-1 break-words text-xs leading-5 text-rose-700 dark:text-rose-300">{error}</p>}
              {status === 'ready' && (
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                  The API reports a database connection. This does not mean attendance, notifications, or other product modules are implemented.
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={refreshStatus}
          disabled={status === 'checking'}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
          Retry readiness check
        </button>
      </section>
    </div>
  );
};

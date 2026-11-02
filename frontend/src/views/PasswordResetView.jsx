import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { apiRequest } from '../utils/api.js';

export const PasswordResetView = () => {
  const { setIsAuthModalOpen, setCurrentView } = useApp();
  const tokenLoaded = useRef(false);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tokenLoaded.current) return;
    tokenLoaded.current = true;
    const resetToken = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('token');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#reset-password`
    );
    if (!resetToken || !/^[A-Za-z0-9_-]{43}$/.test(resetToken)) {
      setStatus('error');
      setMessage('This password reset link is missing a valid token. Request a new link from sign in.');
      return;
    }
    setToken(resetToken);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (password.length < 12 || new TextEncoder().encode(password).length > 128) {
      setStatus('error');
      setMessage('Choose a password between 12 and 128 bytes.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('The passwords do not match.');
      return;
    }

    setStatus('submitting');
    try {
      await apiRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: { token, password },
      });
      setPassword('');
      setConfirmPassword('');
      setStatus('success');
      setMessage('Your password has been changed. All existing sessions have been signed out.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'This password reset link is invalid or expired.');
    }
  };

  const isReady = Boolean(token) && status !== 'success';
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center px-4 py-8 sm:py-10">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          {status === 'success' ? (
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          ) : status === 'error' && !token ? (
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          ) : (
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          )}
        </div>
        <h1 className="mt-4 text-center text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
          {status === 'success' ? 'Password updated' : 'Choose a new password'}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
          {status === 'success'
            ? 'Your account is secure with the new password.'
            : 'Use at least 12 characters. For your security, all current sessions will be revoked.'}
        </p>

        {isReady && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" aria-busy={status === 'submitting'}>
            <div className="min-w-0">
              <label htmlFor="reset-password" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                New password
              </label>
              <input
                id="reset-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="reset-password-confirm" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirm new password
              </label>
              <input
                id="reset-password-confirm"
                name="confirm-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            {message && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{message}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'submitting' && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {status === 'submitting' ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
            {message}
          </p>
        )}
        {status === 'error' && !token && (
          <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
            {message}
          </p>
        )}

        {(status === 'success' || (status === 'error' && !token)) && (
          <button
            type="button"
            onClick={() => {
              setCurrentView('home');
              setIsAuthModalOpen(true);
            }}
            className="mt-5 min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {status === 'success' ? 'Return to sign in' : 'Request another reset link'}
          </button>
        )}
      </section>
    </div>
  );
};

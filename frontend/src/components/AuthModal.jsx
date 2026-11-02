import React, { useEffect, useState } from 'react';
import { AlertCircle, Lock, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiRequest } from '../utils/api.js';

export const AuthModal = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    completeAuthentication,
    currentView,
    setCurrentView,
  } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setNotice('');
      setIsSubmitting(false);
      setMode('login');
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (mode === 'login' && (!password || new TextEncoder().encode(password).length > 128)) {
      setError('Enter your password (maximum 128 bytes).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'recovery') {
        await apiRequest('/auth/password-reset/request', {
          method: 'POST',
          body: { email: normalizedEmail },
        });
        setNotice('If an active account uses that email, a password reset link will be sent.');
        return;
      }
      const { user } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: normalizedEmail, password },
      });
      completeAuthentication(user);
      setIsAuthModalOpen(false);
      if (currentView !== 'accept-invitation') setCurrentView('student');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) setIsAuthModalOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        className="relative my-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          disabled={isSubmitting}
          aria-label="Close sign-in dialog"
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Lock className="h-6 w-6" />
          </div>
          <h2 id="auth-dialog-title" className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'recovery' ? 'Reset your password' : 'Sign in to Attend With QR'}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {mode === 'recovery'
              ? 'Enter your account email and we’ll send a secure reset link if it matches an active account.'
              : 'Use your registered email and password.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Email address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {mode === 'login' && <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <p role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? (mode === 'recovery' ? 'Sending…' : 'Signing in…') : mode === 'recovery' ? 'Send reset link' : 'Sign in'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setMode('recovery');
              setError('');
              setNotice('');
            }}
            className="mt-4 block min-h-10 w-full text-center text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Forgot password?
          </button>
        )}
        {mode === 'recovery' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
              setNotice('');
            }}
            className="mt-4 block min-h-10 w-full text-center text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Back to sign in
          </button>
        )}
        {mode === 'login' && (
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            SMS, email OTP, and Google sign-in are unavailable until their providers and workflows are configured.
          </p>
        )}
        <p className="mt-3 text-center text-xs text-slate-600 dark:text-slate-300">
          New to Attend With QR?{' '}
          <button
            type="button"
            onClick={() => {
              setIsAuthModalOpen(false);
              setCurrentView('register');
            }}
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create a student account
          </button>
        </p>
      </section>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, MailCheck, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { apiRequest } from '../utils/api.js';

export const EmailVerificationView = () => {
  const { refreshSession, setCurrentView } = useApp();
  const verificationStarted = useRef(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Checking your verification link…');

  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;
    const token = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('token');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#verify-email`
    );

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token. Request a new email from your profile.');
      return;
    }

    apiRequest('/auth/email-verification/confirm', {
      method: 'POST',
      body: { token },
    })
      .then(async () => {
        await refreshSession();
        setStatus('success');
        setMessage('Your email is verified. You can now set up an institution workspace.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || 'This verification link is invalid or expired.');
      });
  }, [refreshSession]);

  const Icon = status === 'success' ? CheckCircle2 : status === 'error' ? ShieldAlert : MailCheck;

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
          status === 'error'
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
        }`}>
          {status === 'loading' ? (
            <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className="h-7 w-7" aria-hidden="true" />
          )}
        </div>
        <h1 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">
          {status === 'success' ? 'Email verified' : status === 'error' ? 'Could not verify email' : 'Verifying email'}
        </h1>
        <p role={status === 'error' ? 'alert' : 'status'} aria-live="polite" className="mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
          {message}
        </p>
        {status !== 'loading' && (
          <button
            type="button"
            onClick={() => setCurrentView(status === 'success' ? 'profile' : 'home')}
            className="mt-6 min-h-11 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            {status === 'success' ? 'Continue to profile' : 'Return home'}
          </button>
        )}
      </section>
    </div>
  );
};

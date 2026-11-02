import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowLeft, QrCode } from 'lucide-react';

export const StudentScanView = () => {
  const { setCurrentView } = useApp();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-8 sm:px-6">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          <QrCode className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
          QR attendance is not available yet
        </h1>
        <div role="alert" className="mx-auto mt-4 flex max-w-lg items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            This app does not yet validate QR tokens or persist check-ins on the server. No attendance has been recorded. The camera, enrollment, and location checks shown in the prototype are not active verification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('student')}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>
      </section>
    </div>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, CheckCircle2, CircleUserRound, ShieldAlert } from 'lucide-react';

export const StudentDashboardView = () => {
  const { user } = useApp();

  const profileFields = [
    { label: 'Institution', value: user.collegeName },
    { label: 'Department', value: user.department },
    { label: 'Program', value: user.program },
    { label: 'Enrollment number', value: user.enrollmentNumber },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Namaste, {user.name}
          </h1>
          <p className="mt-1 break-all text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
          <CircleUserRound className="h-4 w-4" />
          Student account
        </span>
      </header>

      <section
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-sm font-bold">Attendance data is not connected yet</h2>
          <p className="mt-1 text-sm leading-6">
            This account is registered, but there are no database-backed attendance records or timetable entries available. Attendance percentages and check-ins will appear only after your institution connects verified records.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-2">
            <CircleUserRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Account profile</h2>
          </div>
          <dl className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {profileFields.map(({ label, value }) => (
              <div key={label} className="grid min-w-0 grid-cols-1 gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:gap-4">
                <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="break-words text-sm text-slate-900 dark:text-slate-100">{value || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Institution and enrollment details are user-submitted profile claims and have not been verified by a college administrator.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center gap-2">
            {user.emailVerified ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Account status</h2>
          </div>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            Email verification: <span className="font-semibold">{user.emailVerified ? 'Verified' : 'Not verified'}</span>
          </p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              Timetable unavailable
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Your institution has not published database-backed classes for this account.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

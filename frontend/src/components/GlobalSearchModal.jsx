import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Home, Search, UserRound, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GlobalSearchModal = () => {
  const { isSearchOpen, setIsSearchOpen, setCurrentView, user } = useApp();
  const [query, setQuery] = useState('');

  const destinations = useMemo(() => {
    if (!user) {
      return [
        { label: 'Home', view: 'home', detail: 'Product overview', icon: Home },
        { label: 'Pricing', view: 'pricing', detail: 'Plans and pricing', icon: UserRound },
        { label: 'Create student account', view: 'register', detail: 'Student registration', icon: UserRound },
      ];
    }

    return [
      { label: 'Student dashboard', view: 'student', detail: 'Profile and attendance availability', icon: Home },
      { label: 'Timetable', view: 'timetable', detail: 'Published schedule status', icon: CalendarDays },
      { label: 'Profile', view: 'profile', detail: 'Account settings', icon: UserRound },
      { label: 'Notifications', view: 'notifications', detail: 'Notification service status', icon: UserRound },
      { label: 'QR attendance', view: 'scan', detail: 'Check-in availability', icon: Search },
    ];
  }, [user]);

  const results = destinations.filter((item) =>
    `${item.label} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    if (!isSearchOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const navigate = (view) => {
    setCurrentView(view);
    setIsSearchOpen(false);
    setQuery('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 pt-16 backdrop-blur-xs sm:pt-20"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsSearchOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-search-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
          <Search className="h-5 w-5 shrink-0 text-indigo-500" />
          <label id="global-search-title" htmlFor="global-navigation-search" className="sr-only">
            Search application pages
          </label>
          <input
            id="global-navigation-search"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search application pages"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close search"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 sm:p-4">
          <p className="mb-3 px-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            This palette searches application pages only. Searching student, faculty, attendance, or report records is not connected yet.
          </p>
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map(({ label, view, detail, icon: Icon }) => (
                <li key={view}>
                  <button
                    type="button"
                    onClick={() => navigate(view)}
                    className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:bg-indigo-950/40"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{detail}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              No application pages match “{query}”.
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Press Ctrl+K to toggle search. Press Escape or close to dismiss.
        </div>
      </section>
    </div>
  );
};

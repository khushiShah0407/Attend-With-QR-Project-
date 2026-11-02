import React, { useState, useRef, useEffect } from 'react';
import { AttendQRLogo } from './AttendQRLogo.jsx';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  Search,
  Bell,
  Database,
  LogIn,
} from 'lucide-react';

export const Navbar = () => {
  const {
    currentView,
    setCurrentView,
    user,
    signOut,
    theme,
    toggleTheme,
    notifications,
    setIsSearchOpen,
    setIsCloudSqlModalOpen,
    setIsAuthModalOpen,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Home', view: 'home' },
    { label: 'Pricing', view: 'pricing' },
    { label: 'Analytics', view: 'analytics' },
    { label: 'Projector', view: 'projector' },
    { label: 'Scanner', view: 'scan' },
    { label: 'Campus Map', view: 'campus-map' },
    { label: 'Contacts', view: 'contacts' },
    { label: 'Timetable', view: 'timetable' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('home')}
          className="cursor-pointer hover:opacity-95 transition-opacity shrink-0"
        >
          <AttendQRLogo theme={theme} size="md" />
        </div>

        {/* Center Desktop Navigation */}
        <nav className="hidden 2xl:flex items-center gap-1 xl:gap-2">
          {navLinks.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/70 dark:bg-indigo-950/40'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Global Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            title="Search (Ctrl + K)"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden 2xl:inline">Search...</span>
            <kbd className="hidden 2xl:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* API service readiness */}
          <button
            onClick={() => setIsCloudSqlModalOpen(true)}
            title="Check API and database readiness"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>Service status</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setCurrentView('notifications')}
            title="Notifications"
            className="hidden sm:inline-flex relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sign In Modal Trigger */}
          {!user && <button
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sign In</span>
          </button>}

          {/* User Account / Role Switcher Menu matching screenshots */}
          {user && <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden 2xl:flex flex-col text-left pr-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">
                  {user.name}
                </span>
                <span className="text-[10px] font-medium text-slate-500 capitalize">
                  {user.role} view
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Dropdown Menu matching screenshot page 1 & 5 */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {user.collegeName}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setCurrentView('profile');
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile & Settings
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>}

          {/* Quick CTA button */}
          {user && <button
            onClick={() => {
              if (user.role === 'student') setCurrentView('student');
              else if (user.role === 'faculty') setCurrentView('faculty');
              else setCurrentView('admin');
            }}
            className="hidden 2xl:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all hover:shadow-md"
          >
            <span>Workspace</span>
          </button>}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="2xl:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="sr-only">Open navigation menu</span>
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className="w-full h-0.5 bg-slate-600 dark:bg-slate-300 rounded" />
              <span className="w-full h-0.5 bg-slate-600 dark:bg-slate-300 rounded" />
              <span className="w-full h-0.5 bg-slate-600 dark:bg-slate-300 rounded" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="2xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          <div className="grid grid-cols-2 gap-2 pb-3">
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Search
            </button>
            <button
              onClick={() => {
                setCurrentView('notifications');
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </button>
            {!user && <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Sign in
            </button>}
            {user && <button
              onClick={() => {
                signOut();
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40"
            >
              Sign out
            </button>}
            <button
              onClick={() => {
                setIsCloudSqlModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Service status
            </button>
            {user && <button
              onClick={() => {
                setCurrentView('profile');
                setIsMobileMenuOpen(false);
              }}
              className="col-span-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
            >
              Profile &amp; settings — {user.name}
            </button>}
          </div>
          {navLinks.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentView === item.view
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button
              onClick={() => {
                setCurrentView('scan');
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs font-bold bg-indigo-600 text-white rounded-lg"
            >
              Scan QR
            </button>
            <button
              onClick={() => {
                setCurrentView('projector');
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs font-bold bg-slate-800 text-white rounded-lg"
            >
              Projector
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

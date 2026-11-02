import React, { useState } from 'react';
import { useApp } from './context/AppContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { DashboardSidebar } from './components/DashboardSidebar.jsx';
import { GlobalSearchModal } from './components/GlobalSearchModal.jsx';
import { CloudSqlFirebaseStatusModal } from './components/CloudSqlFirebaseStatusModal.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { CampusMapGeofence } from './components/CampusMapGeofence.jsx';
import { ContactsDirectory } from './components/ContactsDirectory.jsx';

import { LandingView } from './views/LandingView.jsx';
import { PricingView } from './views/PricingView.jsx';
import { AdminOverviewView } from './views/AdminOverviewView.jsx';
import { FacultyLiveSessionView } from './views/FacultyLiveSessionView.jsx';
import { ProjectorModeView } from './views/ProjectorModeView.jsx';
import { StudentScanView } from './views/StudentScanView.jsx';
import { StudentDashboardView } from './views/StudentDashboardView.jsx';
import { TimetableView } from './views/TimetableView.jsx';
import { AnalyticsView } from './views/AnalyticsView.jsx';
import { NotificationsView } from './views/NotificationsView.jsx';
import { ProfileView } from './views/ProfileView.jsx';
import { RegisterView } from './views/RegisterView.jsx';
import { EmailVerificationView } from './views/EmailVerificationView.jsx';
import { PasswordResetView } from './views/PasswordResetView.jsx';
import { InvitationAcceptanceView, OrganizationView } from './views/OrganizationView.jsx';
import { AttendanceCorrectionModal } from './views/AttendanceCorrectionModal.jsx';
import { AttendanceCorrectionsReviewView } from './views/AttendanceCorrectionsReviewView.jsx';

import {
  Menu,
  X,
  Search,
  Bell,
  Sun,
  Moon,
  Database,
  QrCode,
  Calendar,
  BarChart3,
  User,
  LayoutDashboard,
} from 'lucide-react';

export default function App() {
  const {
    currentView,
    setCurrentView,
    theme,
    toggleTheme,
    user,
    authError,
    authStatus,
    refreshSession,
    setIsAuthModalOpen,
    setAuthError,
    signOut,
    notifications,
    setIsSearchOpen,
    setIsCloudSqlModalOpen,
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isPublicView = ['home', 'pricing', 'register', 'verify-email', 'reset-password', 'accept-invitation'].includes(currentView);
  const requiredRoles = {
    faculty: ['faculty'],
    admin: ['admin'],
    analytics: ['admin', 'faculty'],
    'corrections-review': ['admin', 'faculty'],
    projector: ['faculty'],
  };
  const allowedRoles = requiredRoles[currentView];

  if (!isPublicView && authStatus === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 dark:bg-slate-950">
        <p role="status" className="animate-pulse text-sm font-medium text-slate-600 dark:text-slate-300">
          Checking your secure session…
        </p>
      </main>
    );
  }

  if (!isPublicView && authStatus === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 dark:bg-slate-950">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Could not verify your session</h1>
          <p role="alert" className="mt-2 break-words text-sm text-rose-700 dark:text-rose-300">{authError}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button onClick={refreshSession} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Retry
            </button>
            <button onClick={() => setCurrentView('home')} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Return home
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!isPublicView && !user) {
    return (
      <>
        <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 dark:bg-slate-950">
          <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to continue</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This workspace requires an authenticated account.</p>
            <button onClick={() => setIsAuthModalOpen(true)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Sign in
            </button>
            <button onClick={() => setCurrentView('home')} className="ml-3 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Return home
            </button>
          </section>
        </main>
        <AuthModal />
      </>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 dark:bg-slate-950">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Workspace access unavailable</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Your account role is <span className="font-semibold capitalize">{user.role}</span>. Access to this workspace must be granted by your institution.
          </p>
          <button onClick={() => setCurrentView(user.role)} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Open my workspace
          </button>
        </section>
      </main>
    );
  }

  // If in dedicated Projector Mode, render the fullscreen dark projector view directly
  if (currentView === 'projector') {
    return <ProjectorModeView />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. PUBLIC MARKETING LAYOUT (Pages 12-16 in PDF) */}
      {isPublicView ? (
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 pb-16">
            {currentView === 'home' && <LandingView />}
            {currentView === 'pricing' && <PricingView />}
            {currentView === 'register' && <RegisterView />}
            {currentView === 'verify-email' && <EmailVerificationView />}
            {currentView === 'reset-password' && <PasswordResetView />}
            {currentView === 'accept-invitation' && <InvitationAcceptanceView />}
          </main>

          {/* Public Footer */}
          <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 py-8 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span>© 2026 Attend With QR. Built for Indian higher education.</span>
              </div>

              <div className="flex items-center gap-6 font-semibold">
                <button
                  onClick={() => setCurrentView('pricing')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Pricing
                </button>
                <button
                  onClick={() => setCurrentView('analytics')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Analytics
                </button>
                <button
                  onClick={() => setCurrentView('contacts')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Contacts
                </button>
                <button
                  onClick={() => setCurrentView('campus-map')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Campus Map
                </button>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* 2. AUTHENTIC DASHBOARD SIDEBAR LAYOUT (Pages 1-10 in PDF) */
        <div className="flex-1 flex min-h-screen">
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block shrink-0">
            <DashboardSidebar
              activeTab={currentView}
              onSelectTab={(tab) => {
                if (tab === 'departments') {
                  setCurrentView('admin');
                } else {
                  setCurrentView(tab);
                }
              }}
            />
          </div>

          {/* Mobile Slide-Over Drawer for Sidebar */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close dashboard navigation"
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <DashboardSidebar
                  activeTab={currentView}
                  onSelectTab={(tab) => {
                    if (tab === 'departments') {
                      setCurrentView('admin');
                    } else {
                      setCurrentView(tab);
                    }
                    setMobileSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Dashboard Bar matching Screenshots */}
            <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors">
              <div className="flex items-center gap-3">
                {/* Mobile Hamburger to open sidebar */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  aria-label="Open dashboard navigation"
                  aria-expanded={mobileSidebarOpen}
                  className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div>
                  <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="max-w-[42vw] truncate">
                      {user.collegeName ? `${user.collegeName} • unverified profile` : 'Institution not configured'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                    {user.role} Console
                  </div>
                </div>
              </div>

              {/* Right Tools */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Search Bar Trigger */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Search...</span>
                  <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    Ctrl+K
                  </kbd>
                </button>

                {/* API service readiness */}
                <button
                  onClick={() => setIsCloudSqlModalOpen(true)}
                  title="Check API and database readiness"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors border border-slate-200/60 dark:border-slate-700/60"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Service status</span>
                </button>

                {/* Notifications */}
                <button
                  onClick={() => setCurrentView('notifications')}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>

                {/* User Avatar & Role Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {user.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 capitalize">
                        {user.role} view
                      </span>
                    </div>
                  </button>

                  {userMenuOpen && (
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
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Profile
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        <div className="px-4 py-2 text-xs text-slate-500">
                          Account role: <span className="font-semibold capitalize">{user.role}</span>
                        </div>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        <button
                          onClick={() => {
                            signOut();
                            setUserMenuOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {authError && (
              <div role="alert" className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 sm:mx-6 lg:mx-8">
                <span className="break-words">{authError}</span>
                <button onClick={() => setAuthError('')} aria-label="Dismiss error" className="shrink-0 font-semibold">×</button>
              </div>
            )}

            {/* Scrollable View Container */}
            <main className="min-w-0 flex-1 pb-24 lg:pb-12">
              {currentView === 'admin' && <AdminOverviewView />}
              {currentView === 'faculty' && <FacultyLiveSessionView />}
              {currentView === 'student' && <StudentDashboardView />}
              {currentView === 'scan' && <StudentScanView />}
              {currentView === 'analytics' && <AnalyticsView />}
              {currentView === 'timetable' && <TimetableView />}
              {currentView === 'notifications' && <NotificationsView />}
              {currentView === 'profile' && <ProfileView />}
              {currentView === 'organizations' && <OrganizationView />}
              {currentView === 'corrections-review' && <AttendanceCorrectionsReviewView />}
              {currentView === 'campus-map' && (
                <div className="max-w-5xl mx-auto px-4 py-8">
                  <CampusMapGeofence />
                </div>
              )}
              {currentView === 'contacts' && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                  <ContactsDirectory />
                </div>
              )}
            </main>

            {/* Mobile Bottom Navigation Bar (Visible only on mobile) */}
            <nav
              aria-label="Primary mobile navigation"
              className="lg:hidden fixed bottom-0 left-0 right-0 z-30 min-h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-1 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)] text-[10px] font-semibold text-slate-500"
            >
              <button
                onClick={() => {
                  if (user.role === 'student') setCurrentView('student');
                  else if (user.role === 'faculty') setCurrentView('faculty');
                  else setCurrentView('admin');
                }}
                aria-current={['student', 'faculty', 'admin'].includes(currentView) ? 'page' : undefined}
                className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-1 ${
                  ['student', 'faculty', 'admin'].includes(currentView)
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setCurrentView('scan')}
                aria-current={currentView === 'scan' ? 'page' : undefined}
                className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-1 ${
                  currentView === 'scan'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR</span>
              </button>

              <button
                onClick={() => setCurrentView('timetable')}
                aria-current={currentView === 'timetable' ? 'page' : undefined}
                className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-1 ${
                  currentView === 'timetable'
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Timetable</span>
              </button>

              <button
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open dashboard navigation"
                aria-expanded={mobileSidebarOpen}
                className="flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-1 hover:text-slate-900 dark:hover:text-white"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <GlobalSearchModal />
      <CloudSqlFirebaseStatusModal />
      <AuthModal />
      <AttendanceCorrectionModal />
    </div>
  );
}

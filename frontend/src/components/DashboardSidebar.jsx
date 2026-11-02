import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { AttendQRLogo } from './AttendQRLogo.jsx';
import {
  LayoutDashboard,
  QrCode,
  BarChart3,
  Building2,
  Users,
  Bell,
  User,
  LogOut,
  MapPin,
  Calendar,
  Database,
  CheckSquare,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';

export const DashboardSidebar = ({ activeTab, onSelectTab }) => {
  const { user, notifications, theme, toggleTheme, setCurrentView, setIsCloudSqlModalOpen, signOut } =
    useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Navigation items customized by active role
  const getNavItems = () => {
    if (user.role === 'admin') {
      return [
        { id: 'admin', label: 'Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'corrections-review', label: 'Corrections', icon: CheckSquare },
        { id: 'contacts', label: 'People / Contacts', icon: Users },
        { id: 'campus-map', label: 'Google Map', icon: MapPin },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    } else if (user.role === 'faculty') {
      return [
        { id: 'faculty', label: 'Overview', icon: LayoutDashboard },
        { id: 'projector', label: 'Projector Mode', icon: QrCode },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'corrections-review', label: 'Corrections', icon: CheckSquare },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'contacts', label: 'Directory', icon: Users },
        { id: 'campus-map', label: 'Google Map', icon: MapPin },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    } else {
      // Student
      return [
        { id: 'student', label: 'Overview', icon: LayoutDashboard },
        { id: 'scan', label: 'Scan QR', icon: QrCode },
        { id: 'timetable', label: 'Timetable', icon: Calendar },
        { id: 'contacts', label: 'Contacts', icon: Users },
        { id: 'campus-map', label: 'Google Map', icon: MapPin },
        { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
        { id: 'profile', label: 'Profile', icon: User },
      ];
    }
  };

  const navItems = getNavItems();

  const getRoleBadge = () => {
    const roleLabel = {
      admin: 'College admin',
      faculty: 'Faculty',
      student: 'Student',
    }[user.role] ?? 'Account';
    return {
      title: `${roleLabel} workspace`,
      sub: user.collegeName || 'Institution not provided',
    };
  };

  const roleInfo = getRoleBadge();

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors select-none z-30">
      {/* Top Sidebar Header matching Screenshot Pages 1, 2, 3, 4, 5, 7, 8, 10 */}
      <div>
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('home')}
          className="p-5 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
        >
          <AttendQRLogo theme={theme} size="md" />
        </div>

        {/* College Role Pill matching Screenshot */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs">
            <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
              <span>{roleInfo.title}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {roleInfo.sub}
            </div>
          </div>
        </div>

        {/* Navigation Items matching Screenshot sidebar */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'departments' && activeTab === 'admin') ||
              (item.id === 'admin' && activeTab === 'admin' && item.label === 'Overview');

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Service status, theme, and sign out */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <button
          onClick={() => setIsCloudSqlModalOpen(true)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold">Service status</span>
          </div>
          <span className="text-[10px] text-slate-500">Check</span>
        </button>

        <div className="flex items-center justify-end px-2">
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            className="p-1 hover:text-slate-900 dark:hover:text-white"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sign Out Button matching Screenshot Pages 1, 2, 3, 5, 7, 8 */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

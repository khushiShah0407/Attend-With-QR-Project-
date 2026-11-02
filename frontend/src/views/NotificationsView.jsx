import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Radio,
  Check,
} from 'lucide-react';

export const NotificationsView = () => {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'info':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'session':
        return <Radio className="w-5 h-5 text-cyan-500 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header matching Screenshot Page 7 */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread alerts` : notifications.length > 0 ? 'All alerts caught up' : 'Notification service is not connected'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List matching Screenshot Page 7 */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <Bell className="mx-auto h-7 w-7 text-slate-400" />
            <h2 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No notifications available</h2>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
              Notifications are not stored on the server yet. This page will not show locally fabricated alerts.
            </p>
          </div>
        ) : notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => markNotificationRead(item.id)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
              !item.read
                ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-80'
            }`}
          >
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0">
              {getIcon(item.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {item.title}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {item.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>

            {!item.read && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

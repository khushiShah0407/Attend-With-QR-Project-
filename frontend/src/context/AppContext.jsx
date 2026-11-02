import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEPARTMENTS,
  INITIAL_LIVE_SESSION,
  SUBJECTS_BREAKDOWN,
} from '../data/mockData.js';
import {
  generateRotatingToken,
} from '../utils/qrCrypto.js';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../utils/storage.js';
import { apiRequest, toAppUser } from '../utils/api.js';

const AppContext = createContext(null);

// Pillai College of Engineering (Panvel, Mumbai / Navi Mumbai) Campus GPS
const PCE_CAMPUS = {
  lat: 18.9902,
  lng: 73.1277,
  radiusMeters: 150,
};

export const AppProvider = ({ children }) => {
  const validViews = [
    'home',
    'pricing',
    'analytics',
    'scan',
    'student',
    'faculty',
    'admin',
    'timetable',
    'notifications',
    'profile',
    'register',
    'verify-email',
    'reset-password',
    'accept-invitation',
    'organizations',
    'campus-map',
    'contacts',
    'projector',
    'corrections-review',
  ];

  // Navigation View State with URL hash deep-link support
  const [currentView, setViewState] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').split('?')[0];
      if (hash && validViews.includes(hash)) return hash;
    }
    return 'home';
  });

  const setCurrentView = (view) => {
    setViewState(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0];
      if (hash && validViews.includes(hash)) {
        setViewState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('loading');
  const [authError, setAuthError] = useState('');

  const refreshSession = useCallback(async () => {
    setAuthStatus('loading');
    setAuthError('');
    try {
      const { user: sessionUser } = await apiRequest('/auth/me');
      setUser(toAppUser(sessionUser));
      setAuthStatus('authenticated');
    } catch (error) {
      setUser(null);
      if (error.status === 401) {
        setAuthStatus('unauthenticated');
      } else {
        setAuthStatus('error');
        setAuthError(error.message);
      }
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const completeAuthentication = (apiUser) => {
    setUser(toAppUser(apiUser));
    setAuthStatus('authenticated');
    setAuthError('');
  };

  const updateProfile = async (profile) => {
    const { user: updatedApiUser } = await apiRequest('/auth/me', {
      method: 'PATCH',
      body: profile,
    });
    const updatedUser = toAppUser(updatedApiUser);
    setUser(updatedUser);
    return updatedUser;
  };

  const signOut = async () => {
    setAuthError('');
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      setUser(null);
      setAuthStatus('unauthenticated');
      setCurrentView('home');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // Legacy prototype state; institutional records are not authoritative here.
  const [departments, setDepartments] = useState(() =>
    loadStoredData(STORAGE_KEYS.DEPARTMENTS, DEPARTMENTS)
  );

  // Legacy session preview state; it is not used to record attendance.
  const [liveSession, setLiveSession] = useState(() =>
    loadStoredData(STORAGE_KEYS.LIVE_SESSION, INITIAL_LIVE_SESSION)
  );

  // Notifications remain empty until the persistent API is implemented.
  const [notifications, setNotifications] = useState([]);

  // Persistent Theme
  const [theme, setTheme] = useState(() =>
    loadStoredData(STORAGE_KEYS.THEME, 'light')
  );

  // Corrections remain empty until the persistent API is implemented.
  const [corrections, setCorrections] = useState([]);

  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState(SUBJECTS_BREAKDOWN);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('phone'); // 'phone' | 'email' | 'google'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCloudSqlModalOpen, setIsCloudSqlModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // Rotating Token state
  const [currentQrToken, setCurrentQrToken] = useState('');
  const [sessionRemainingSec, setSessionRemainingSec] = useState(15);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.DEPARTMENTS, departments);
  }, [departments]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Global key listener for Ctrl+K search palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync token rotation every 1 second
  useEffect(() => {
    const updateToken = () => {
      const now = Date.now();
      const { token, remainingSec } = generateRotatingToken(
        liveSession.id,
        liveSession.code,
        liveSession.rotationIntervalSec || 15,
        now
      );
      setCurrentQrToken(token);
      setSessionRemainingSec(remainingSec);
    };

    updateToken();
    const timer = setInterval(updateToken, 1000);
    return () => clearInterval(timer);
  }, [liveSession.id, liveSession.code, liveSession.rotationIntervalSec]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const addDepartment = (dept) => {
    const newDept = {
      ...dept,
      id: `dept-${Date.now()}`,
    };
    setDepartments((prev) => [...prev, newDept]);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const submitCorrection = (newCorrection) => {
    const record = {
      id: `corr-${Date.now()}`,
      studentName: user.name,
      rollNumber: user.enrollmentNumber || '22BCA047',
      status: 'Pending',
      createdAt: new Date().toLocaleDateString(),
      ...newCorrection,
    };
    setCorrections((prev) => [record, ...prev]);

    // Add alert notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      type: 'info',
      title: 'Correction submitted',
      description: `Request for ${record.subject} sent to faculty for review`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const approveCorrection = (id) => {
    setCorrections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'Approved',
              reviewedBy: user.name,
              reviewedAt: new Date().toLocaleDateString(),
            }
          : c
      )
    );

    const notif = {
      id: `notif-${Date.now()}`,
      type: 'success',
      title: 'Correction approved',
      description: `Attendance correction was approved by ${user.name}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const rejectCorrection = (id, reason = 'Insufficient verification') => {
    setCorrections((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'Rejected',
              reviewedBy: user.name,
              reviewedAt: new Date().toLocaleDateString(),
              rejectionReason: reason,
            }
          : c
      )
    );

    const notif = {
      id: `notif-${Date.now()}`,
      type: 'warning',
      title: 'Correction rejected',
      description: `Correction request was rejected: ${reason}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const startNewFacultySession = (sessionConfig) => {
    const newSession = {
      id: `sess-${Date.now()}`,
      subjectName: sessionConfig.subjectName || 'Advanced Java Programming',
      code: sessionConfig.code || 'BCA501',
      department: sessionConfig.department || 'Computer Applications',
      program: sessionConfig.program || 'BCA',
      semester: sessionConfig.semester || 'Semester 5',
      division: sessionConfig.division || 'Division A',
      room: sessionConfig.room || 'Lab 18',
      roomLat: 18.9902,
      roomLng: 73.1277,
      facultyName: user.name,
      facultyEmail: user.email,
      totalEnrolled: parseInt(sessionConfig.totalEnrolled, 10) || 48,
      rotationIntervalSec: parseInt(sessionConfig.rotationIntervalSec, 10) || 15,
      sessionStatus: 'ACTIVE',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkIns: [],
    };
    setLiveSession(newSession);

    const notif = {
      id: `notif-${Date.now()}`,
      type: 'info',
      title: 'New Session Started',
      description: `${newSession.subjectName} (${newSession.code}) session is now active`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        user,
        setUser,
        authStatus,
        authError,
        setAuthError,
        refreshSession,
        completeAuthentication,
        updateProfile,
        signOut,
        departments,
        addDepartment,
        liveSession,
        setLiveSession,
        sessionRemainingSec,
        currentQrToken,
        notifications,
        markAllNotificationsRead,
        markNotificationRead,
        timetable,
        setTimetable,
        subjects,
        setSubjects,
        corrections,
        submitCorrection,
        approveCorrection,
        rejectCorrection,
        startNewFacultySession,
        campusCoords: PCE_CAMPUS,
        theme,
        toggleTheme,
        isSearchOpen,
        setIsSearchOpen,
        isCloudSqlModalOpen,
        setIsCloudSqlModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isCorrectionModalOpen,
        setIsCorrectionModalOpen,
      }}
    >
      <div className={theme === 'dark' ? 'dark' : ''}>{children}</div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

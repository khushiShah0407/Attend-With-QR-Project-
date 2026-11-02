/**
 * AttendanceStorage.js
 * Persistent real client storage engine for AttendQR
 * Uses localStorage with schema versioning and deterministic fallbacks.
 */

const STORAGE_KEYS = {
  USER: 'attendqr_user_profile',
  DEPARTMENTS: 'attendqr_departments',
  LIVE_SESSION: 'attendqr_live_session',
  CHECK_INS: 'attendqr_check_in_records',
  NOTIFICATIONS: 'attendqr_notifications',
  CORRECTIONS: 'attendqr_attendance_corrections',
  THEME: 'attendqr_theme_pref',
};

export const loadStoredData = (key, defaultFallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultFallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error loading ${key} from storage:`, err);
    return defaultFallback;
  }
};

export const saveStoredData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error saving ${key} to storage:`, err);
  }
};

export const clearAllStoredData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Error clearing storage:', err);
  }
};

export { STORAGE_KEYS };

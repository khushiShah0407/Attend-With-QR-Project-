import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Monitor,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { apiRequest } from '../utils/api.js';

const profileFields = [
  { name: 'name', label: 'Full name', icon: UserRound, maxLength: 120, required: true },
  { name: 'phone', label: 'Phone (India)', icon: Phone, maxLength: 20, type: 'tel' },
  { name: 'institutionName', label: 'Institution', icon: Building2, maxLength: 160 },
  { name: 'department', label: 'Department', icon: Building2, maxLength: 120 },
  { name: 'program', label: 'Program', icon: Building2, maxLength: 120 },
  { name: 'enrollmentNumber', label: 'Enrollment number', icon: UserRound, maxLength: 32 },
];

function getProfileValues(user) {
  return {
    name: user.name ?? '',
    phone: user.phone ?? '',
    institutionName: user.collegeName ?? '',
    department: user.department ?? '',
    program: user.program ?? '',
    enrollmentNumber: user.enrollmentNumber ?? '',
  };
}

function validateProfile(values) {
  if (values.name.trim().length < 2 || values.name.trim().length > 120) {
    return 'Full name must be between 2 and 120 characters.';
  }
  if (values.phone.length > 20) return 'Phone number must be 20 characters or fewer.';
  const phone = values.phone.trim().replace(/[\s()-]/g, '');
  if (phone && !/^\+?(?:91)?[6-9]\d{9}$/.test(phone)) {
    return 'Enter a valid Indian mobile number or leave the optional field empty.';
  }
  if (values.institutionName.trim().length > 160) return 'Institution must be 160 characters or fewer.';
  if (values.department.trim().length > 120) return 'Department must be 120 characters or fewer.';
  if (values.program.trim().length > 120) return 'Program must be 120 characters or fewer.';
  if (values.enrollmentNumber.trim().length > 32) return 'Enrollment number must be 32 characters or fewer.';
  return '';
}

const inputClassName =
  'mt-1.5 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export const ProfileView = () => {
  const { user, updateProfile, setCurrentView } = useApp();
  const [values, setValues] = useState(() => getProfileValues(user));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [isRenewingSession, setIsRenewingSession] = useState(false);
  const [sessionMessage, setSessionMessage] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationError, setVerificationError] = useState('');

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    setSessionError('');
    try {
      const { sessions: activeSessions } = await apiRequest('/auth/sessions');
      setSessions(activeSessions);
    } catch (error) {
      setSessionError(error.message || 'Could not load active sessions.');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    setValues(getProfileValues(user));
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrorMessage('');
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validateProfile(values);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      setSaved(false);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaved(false);
    try {
      await updateProfile({
        ...values,
        name: values.name.trim(),
        phone: values.phone.trim(),
        institutionName: values.institutionName.trim(),
        department: values.department.trim(),
        program: values.program.trim(),
        enrollmentNumber: values.enrollmentNumber.trim(),
      });
      setSaved(true);
    } catch (error) {
      setErrorMessage(error.message || 'Could not save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setIsRevokingSessions(true);
    setSessionMessage('');
    setSessionError('');
    try {
      const { revokedCount } = await apiRequest('/auth/sessions/revoke-others', {
        method: 'POST',
      });
      setSessionMessage(
        revokedCount === 1
          ? '1 other session was signed out.'
          : `${revokedCount} other sessions were signed out.`
      );
      await loadSessions();
    } catch (error) {
      setSessionError(error.message || 'Could not revoke other sessions.');
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleRenewSession = async () => {
    setIsRenewingSession(true);
    setSessionMessage('');
    setSessionError('');
    try {
      const { expiresAt } = await apiRequest('/auth/session/renew', { method: 'POST' });
      setSessionMessage(`This session is extended through ${new Date(expiresAt).toLocaleString()}.`);
      await loadSessions();
    } catch (error) {
      setSessionError(error.message || 'Could not extend this session. Please sign in again if it has expired.');
    } finally {
      setIsRenewingSession(false);
    }
  };

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    setVerificationMessage('');
    setVerificationError('');
    try {
      const { status } = await apiRequest('/auth/email-verification/request', { method: 'POST', body: {} });
      setVerificationMessage(
        status === 'already_verified'
          ? 'This account email is already verified.'
          : 'Verification link sent. It expires in 30 minutes.'
      );
    } catch (error) {
      setVerificationError(error.message || 'Could not send a verification email.');
    } finally {
      setIsSendingVerification(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Profile &amp; settings
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update the profile details connected to your authenticated account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('organizations')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            <UsersRound className="h-4 w-4" />
            Organizations
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} aria-busy={isSaving} className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
              {user.emailVerified ? (
                <LockKeyhole className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Profile information</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {user.emailVerified
                  ? 'Your account email is verified.'
                  : 'Institution and enrollment details are self-reported claims and are not verified by a college administrator.'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 motion-stagger">
            {profileFields.map(({ name, label, icon: Icon, maxLength, required, type }) => (
              <div key={name} className="min-w-0">
                <label
                  htmlFor={`profile-${name}`}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  {label}
                </label>
                <input
                  id={`profile-${name}`}
                  name={name}
                  type={type ?? 'text'}
                  autoComplete={name === 'name' ? 'name' : name === 'phone' ? 'tel' : 'off'}
                  value={values[name]}
                  onChange={handleChange}
                  maxLength={maxLength}
                  required={required}
                  className={inputClassName}
                />
              </div>
            ))}

            <div className="min-w-0">
              <label
                htmlFor="profile-email"
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                <Mail className="h-4 w-4 text-slate-400" />
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                readOnly
                aria-describedby="profile-email-note"
                className={`${inputClassName} cursor-not-allowed opacity-75`}
              />
              <p id="profile-email-note" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Email changes require a separate verified account recovery workflow.
              </p>
              {!user.emailVerified && (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isSendingVerification}
                  className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                >
                  {isSendingVerification && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                  {isSendingVerification ? 'Sending…' : 'Send verification email'}
                </button>
              )}
              {verificationMessage && (
                <p role="status" aria-live="polite" className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                  {verificationMessage}
                </p>
              )}
              {verificationError && (
                <p role="alert" className="mt-2 break-words text-xs text-rose-700 dark:text-rose-300">
                  {verificationError}
                </p>
              )}
            </div>

            <div className="min-w-0 border-t border-slate-100 pt-4 dark:border-slate-800 sm:border-t-0 sm:pt-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <LockKeyhole className="h-4 w-4" />
                Account role
              </div>
              <p className="mt-2 text-sm capitalize text-slate-900 dark:text-slate-100">{user.role}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Roles can only be changed through an authorized institution workflow.
              </p>
            </div>
          </div>
        </section>

        {errorMessage && (
          <p
            role="alert"
            className="motion-feedback rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
          >
            {errorMessage}
          </p>
        )}
        {(isSaving || saved) && (
          <p
            role="status"
            aria-live="polite"
            className={`motion-feedback flex items-center gap-2 rounded-2xl border p-4 text-sm ${
              isSaving
                ? 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200'
            }`}
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {isSaving ? 'Saving profile…' : 'Profile saved to your account.'}
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-start">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Saving updates your account profile only. Institution membership, attendance, two-factor setup,
            notification preferences, and institution-change requests require separate server workflows.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-950"
          >
            {isSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Active sessions</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                Review sessions for this account or sign out other devices. Session tokens are never shown.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadSessions}
            disabled={isLoadingSessions}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {sessionError && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">
            {sessionError}
          </p>
        )}
        {sessionMessage && (
          <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
            {sessionMessage}
          </p>
        )}

        {isLoadingSessions ? (
          <p role="status" className="mt-5 text-sm text-slate-500 dark:text-slate-400">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">No active sessions were returned for this account.</p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((session, index) => (
              <li key={`${session.createdAt}-${index}`} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {session.current ? 'This session' : 'Other signed-in session'}
                    {session.current && <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">Current</span>}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                    Started {new Date(session.createdAt).toLocaleString()} · Expires {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            Extend this sign-in for another seven days or revoke access from other devices.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRenewSession}
              disabled={isRenewingSession || isRevokingSessions || isLoadingSessions || !sessions.some((session) => session.current)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900/70 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
            >
              {isRenewingSession ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              {isRenewingSession ? 'Extending…' : 'Extend this session'}
            </button>
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              disabled={isRevokingSessions || isRenewingSession || isLoadingSessions || !sessions.some((session) => !session.current)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/30"
            >
              {isRevokingSessions ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldAlert className="h-4 w-4" aria-hidden="true" />}
              {isRevokingSessions ? 'Signing out…' : 'Sign out other sessions'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

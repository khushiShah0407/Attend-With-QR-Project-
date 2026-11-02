import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, LoaderCircle, MailPlus, RefreshCw, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { apiRequest } from '../utils/api.js';

const cardClass =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6';
const inputClass =
  'mt-1.5 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

export function OrganizationView() {
  const { user } = useApp();
  const [organizations, setOrganizations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [members, setMembers] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedOrganization = organizations.find((organization) => organization.id === selectedId);

  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { organizations: records } = await apiRequest('/organizations');
      setOrganizations(records);
      setSelectedId((current) =>
        records.some((organization) => organization.id === current)
          ? current
          : records[0]?.id ?? ''
      );
    } catch (requestError) {
      setError(requestError.message || 'Could not load organizations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvitations = useCallback(async (organizationId) => {
    if (!organizationId) {
      setInvitations([]);
      return;
    }
    try {
      const { invitations: records } = await apiRequest(
        `/organizations/${organizationId}/invitations`
      );
      setInvitations(records);
    } catch (requestError) {
      setError(requestError.message || 'Could not load invitations.');
    }
  }, []);

  const loadMembers = useCallback(async (organizationId) => {
    if (!organizationId) {
      setMembers([]);
      return;
    }
    try {
      const { members: records } = await apiRequest(
        `/organizations/${organizationId}/members`
      );
      setMembers(records);
    } catch (requestError) {
      setError(requestError.message || 'Could not load organization members.');
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (selectedOrganization?.role === 'OWNER') {
      loadInvitations(selectedOrganization.id);
      loadMembers(selectedOrganization.id);
    } else {
      setInvitations([]);
      setMembers([]);
    }
  }, [loadInvitations, loadMembers, selectedOrganization]);

  const handleCreateOrganization = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest('/organizations', {
        method: 'POST',
        body: { name: organizationName.trim() },
      });
      setOrganizationName('');
      setNotice('Organization created. You can now invite verified accounts.');
      await loadOrganizations();
    } catch (requestError) {
      setError(requestError.message || 'Could not create the organization.');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!selectedOrganization) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await apiRequest(`/organizations/${selectedOrganization.id}/invitations`, {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), role },
      });
      setEmail('');
      setNotice('Invitation email sent. It expires in 7 days and can only be accepted by the verified invited account.');
      await loadInvitations(selectedOrganization.id);
    } catch (requestError) {
      setError(requestError.message || 'Could not send this invitation.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (invitationId) => {
    if (!selectedOrganization) return;
    setError('');
    setNotice('');
    try {
      await apiRequest(
        `/organizations/${selectedOrganization.id}/invitations/${invitationId}/revoke`,
        { method: 'POST', body: {} }
      );
      setNotice('Invitation revoked.');
      await loadInvitations(selectedOrganization.id);
    } catch (requestError) {
      setError(requestError.message || 'Could not revoke this invitation.');
    }
  };

  const handleRevokeMember = async (memberId) => {
    if (!selectedOrganization) return;
    setError('');
    setNotice('');
    try {
      await apiRequest(
        `/organizations/${selectedOrganization.id}/members/${memberId}/revoke`,
        { method: 'POST', body: {} }
      );
      setNotice('Organization membership revoked. The account role was not changed.');
      await loadMembers(selectedOrganization.id);
    } catch (requestError) {
      setError(requestError.message || 'Could not revoke organization membership.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Organizations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Manage verified organization access. Membership roles are scoped to one organization and do not change your account role.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOrganizations}
          disabled={loading}
          aria-label="Refresh organizations"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error && <p role="alert" className="break-words rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
      {notice && <p role="status" aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p>}

      {loading ? (
        <p role="status" className={`${cardClass} text-sm text-slate-600 dark:text-slate-300`}>Loading organization access…</p>
      ) : (
        <>
          {organizations.length > 0 && (
            <section className={cardClass}>
              <label htmlFor="organization-select" className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Your organizations
              </label>
              <select
                id="organization-select"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className={inputClass}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name} · {organization.role}
                  </option>
                ))}
              </select>
              {selectedOrganization?.role !== 'OWNER' && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  You are a {selectedOrganization?.role?.toLowerCase()} member. Owner-only management actions are not available to this account.
                </p>
              )}
            </section>
          )}

          {user.emailVerified && (
            <section className={cardClass}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Create an organization</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Organization ownership requires a verified account email.</p>
                </div>
              </div>
              <form onSubmit={handleCreateOrganization} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <label className="sr-only" htmlFor="organization-name">Organization name</label>
                <input
                  id="organization-name"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  minLength={2}
                  maxLength={160}
                  required
                  placeholder="College or university name"
                  className={`${inputClass} mt-0 sm:flex-1`}
                />
                <button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Create organization
                </button>
              </form>
            </section>
          )}

          {selectedOrganization?.role === 'OWNER' && (
            <section className={cardClass}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                  <UserPlus className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Invite a member</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Only the organization owner can invite or revoke access.</p>
                </div>
              </div>
              <form onSubmit={handleInvite} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="min-w-0">
                  <label htmlFor="invite-email" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Account email</label>
                  <input id="invite-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="invite-role" className="text-xs font-semibold text-slate-600 dark:text-slate-300">Organization role</label>
                  <select id="invite-role" value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <button disabled={saving} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                  Send invite
                </button>
              </form>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                These roles grant membership metadata only. Staff dashboards and attendance permissions remain disabled until their server-side workflows are implemented.
              </p>

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <UsersRound className="h-4 w-4" />
                  Active members
                </h3>
                {members.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No invited members have joined yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {members.map((member) => (
                      <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{member.name}</p>
                          <p className="break-all text-xs text-slate-500 dark:text-slate-400">{member.email} · {member.role}</p>
                        </div>
                        <button type="button" onClick={() => handleRevokeMember(member.id)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          Remove access
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invitations</h3>
                {invitations.length === 0 ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><MailPlus className="h-4 w-4" /> No invitations yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {invitations.map((invitation) => (
                      <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-semibold text-slate-800 dark:text-slate-100">{invitation.email}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {invitation.role} · {invitation.status.toLowerCase()} · expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        {invitation.status === 'PENDING' && (
                          <button type="button" onClick={() => handleRevoke(invitation.id)} className="min-h-10 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                            Revoke
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {!user.emailVerified && (
            <p className={`${cardClass} text-sm text-slate-600 dark:text-slate-300`}>
              Verify your account email from Profile &amp; settings before creating an organization.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function InvitationAcceptanceView() {
  const { user, setIsAuthModalOpen } = useApp();
  const tokenLoaded = useRef(false);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    if (tokenLoaded.current) return;
    tokenLoaded.current = true;
    const invitationToken = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('token');
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#accept-invitation`
    );
    if (!invitationToken || !/^[A-Za-z0-9_-]{43}$/.test(invitationToken)) {
      setStatus('error');
      setError('This invitation link is missing a valid token. Open the complete link from your invitation email.');
      return;
    }
    setToken(invitationToken);
  }, []);

  const acceptInvitation = async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await apiRequest('/organization-invitations/accept', {
        method: 'POST',
        body: { token },
      });
      setOrganization(result.organization);
      setStatus('accepted');
      window.history.replaceState(null, '', `${window.location.pathname}#accept-invitation`);
    } catch (requestError) {
      setError(requestError.message || 'This invitation could not be accepted.');
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          <MailPlus className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-white">Organization invitation</h1>
        {!token ? (
          <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">This invitation link is missing its token. Open the complete link from your invitation email.</p>
        ) : status === 'accepted' ? (
          <div className="mt-3">
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
              You joined {organization?.name ?? 'the organization'} as {organization?.role?.toLowerCase()}.
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your global account role was not changed.</p>
          </div>
        ) : !user ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Sign in to the account that received this invitation. You can also create that account, verify its email, and then reopen this link.</p>
            <button type="button" onClick={() => setIsAuthModalOpen(true)} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Sign in</button>
          </>
        ) : !user.emailVerified ? (
          <p className="mt-3 text-sm leading-6 text-amber-800 dark:text-amber-200">Verify {user.email} from Profile &amp; settings, then reopen the invitation email. Invitations are accepted only by the verified account matching the invited email.</p>
        ) : (
          <>
            <p className="mt-3 break-all text-sm text-slate-600 dark:text-slate-300">Signed in as {user.email}. Accept only if you recognize the organization.</p>
            {error && <p role="alert" className="mt-3 break-words text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            <button type="button" onClick={acceptInvitation} disabled={status === 'loading'} className="mt-5 min-h-11 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {status === 'loading' ? 'Accepting…' : 'Accept invitation'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

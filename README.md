<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Attend With QR

Attend With QR is a Vite + React application with an Express/Mongoose API foundation. Its existing brand is being preserved while prototype flows are progressively replaced with verified API behavior and clearly marked unavailable states.

## Project structure

- `frontend/` — React/Vite application, styles and public assets.
- `backend/` — Express/Mongoose API, models and API tests.
- `other/` — implementation status, supporting configuration metadata and QA scripts.
- The root keeps the package manifest, npm and Bun lockfiles, and Vite/TypeScript configuration required to run and build the separated applications. npm is the documented package manager; both lockfiles are kept in sync.

## Run locally

Prerequisites: Node.js, npm, and MongoDB for database-backed API features.

1. Install dependencies from the project root with `npm ci`.
2. Copy `backend/.env.example` to the project-root `.env` and configure the local API values there; `dotenv` loads that root file when the API starts.
3. Start the API with `npm run start:api`.
4. In a separate terminal, start the frontend with `npm run dev`.

The frontend source is in `frontend/` and is served at `http://localhost:3000`; the API source is in `backend/server/` and listens on port `4000` by default. Supporting documentation and QA assets are in `other/`.
When no CORS allowlist is configured, development allows only `http://localhost:3000` and `http://127.0.0.1:3000`. Production does not use this fallback; configure `CORS_ORIGINS` explicitly.

## Institution selection during registration

The registration form includes a curated, searchable set of colleges and universities from across India. Search by institution name, city, or state. The list is not an authoritative or exhaustive national registry; if an institution is missing, use **Add Your College** to enter its name and location. The department selector combines the institution's listed departments with a broad set of common academic and professional departments. Use **Add Dept** for a department or programme that is not listed.

Student registration, email/password sign-in, and password recovery use the `/api/v1/auth` API and require a connected MongoDB. Institution, department, and program are not preselected; users must enter their own claims. Those claims, along with phone and enrollment number, are saved as unverified profile data; they do not prove enrollment or grant organization access. Email verification can be requested from Profile & settings when SMTP is configured. Faculty/admin self-registration is blocked. Verified organization owners can invite registered or unregistered email addresses to an organization; the invitee must sign into the exact invited, email-verified account to accept. Membership roles do not change global account roles or enable the unfinished staff dashboards and attendance workflows. Phone verification, SMS OTP, Google OAuth and the rest of the attendance/dashboard workflows are not implemented. Custom directory entries remain browser-local, but the institution/department/program entered for the new account is also sent to the server profile.

The frontend restores identity from the HttpOnly server session through `GET /api/v1/auth/me`; it does not persist authentication identity in localStorage. Sign-out revokes the server session. Faculty/admin routes do not permit self-selected roles; only student self-registration is currently available. Signed-in users can update their name, phone, and self-reported institution/department/program/enrollment claims through the profile screen and `PATCH /api/v1/auth/me`. Email and role remain read-only.

Signed-in users can review their active sessions in Profile & settings. `GET /api/v1/auth/sessions` returns session start/expiry timestamps and marks the current session without exposing session tokens. `POST /api/v1/auth/session/renew` rotates the current opaque session token and extends its expiry by seven days. The current session can also be revoked through `POST /api/v1/auth/sessions/revoke-others` to revoke all other sessions while preserving this one. These endpoints require a valid server session; mutations also validate the request origin.

Email verification is available from Profile & settings. `POST /api/v1/auth/email-verification/request` creates a random 30-minute token, stores only its SHA-256 hash, and sends a link through the configured SMTP provider. `POST /api/v1/auth/email-verification/confirm` consumes the token once and marks the account verified. The frontend removes the token from the address bar after processing it. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and `FRONTEND_URL` in the server environment; without a working provider, sending returns an explicit `EMAIL_DELIVERY_UNAVAILABLE` response and does not leave a usable token.

Password recovery is available from the sign-in dialog. `POST /api/v1/auth/password-reset/request` always returns the same generic response for valid email addresses to prevent account enumeration. For active accounts it stores only a 30-minute token hash and sends the reset link; provider errors are logged without exposing account existence to the requester, and the unused token is removed. `POST /api/v1/auth/password-reset/confirm` enforces the password length policy, consumes the token once, updates the password hash and revokes existing sessions. The reset page removes the token from the URL before showing the form.

## Organization membership and invitations

Use **Organizations** from Profile & settings to create an organization or manage owner invitations. Organization creation requires a verified email. Owners can send role-scoped invitations to `ADMIN`, `FACULTY`, `TEACHER`, or `STUDENT` memberships, inspect active members, revoke pending invitations, and revoke active membership. Invitation tokens are random, expire after seven days, and only their SHA-256 hashes are persisted. Acceptance requires an authenticated account with a verified email exactly matching the invitation address; replay and cross-organization reads are rejected. Invitation email delivery uses the server-side SMTP settings described above. A delivery failure returns `EMAIL_DELIVERY_UNAVAILABLE` and marks the invitation revoked so its token cannot be accepted. The invitation link removes its token from the address bar when opened.

Membership roles are separate from the global user role and do not enable staff dashboards, attendance, or other privileged workflows. The organization owner remains the only role authorized for existing department/calendar management APIs. The member and invitation collections use unique organization/user and organization/email indexes. One current invitation record per organization/email is kept; resending replaces its current status/token instead of creating an audit-history record. Expiry is enforced when accepting and does not delete records automatically. Revoking a member is soft, and a later valid invitation can reactivate that member without changing their global account role.

Attendance, QR check-in, timetable, notifications, reports, and staff/admin business workflows are not database-backed yet. The student dashboard does not show fabricated attendance totals, and the QR screen explicitly does not record attendance. The timetable and notification pages show unavailable/empty states instead of sample records. The global search palette navigates application pages only. Legacy staff/admin analytics components still contain prototype data, but the current backend only provisions students and blocks those routes; replace the demo content before enabling privileged roles. These safeguards do not mean the requested SaaS features are complete.

## Implemented API endpoints

All API routes use `/api/v1`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Process liveness; does not imply database readiness. |
| GET | `/ready` | Database readiness check. |
| POST | `/auth/register` | Creates a standard student account; does not accept a client-selected role. |
| POST | `/auth/login` | Verifies email/password and issues an HttpOnly session cookie. |
| GET | `/auth/me` | Returns the current session's user profile. |
| PATCH | `/auth/me` | Updates allowlisted profile fields for the authenticated account. |
| POST | `/auth/email-verification/request` | Sends a short-lived email verification link to the authenticated account. |
| POST | `/auth/email-verification/confirm` | Consumes a valid verification token once. |
| POST | `/auth/password-reset/request` | Requests an email reset link without revealing whether an account exists. |
| POST | `/auth/password-reset/confirm` | Sets a new password from a valid one-time link and revokes existing sessions. |
| GET | `/auth/sessions` | Lists active session timestamps and marks the current session without returning tokens. |
| POST | `/auth/session/renew` | Rotates the current session token and extends its expiry by seven days. |
| POST | `/auth/sessions/revoke-others` | Revokes other sessions owned by the authenticated user. |
| POST | `/auth/logout` | Revokes the current server-side session and clears its cookie. |
| POST | `/organizations` | Creates a new organization owned by the authenticated, email-verified account. |
| GET | `/organizations` | Lists organizations owned by the authenticated account and its active memberships, with organization-scoped roles. |
| GET | `/organizations/:organizationId/invitations` | Lists invitation metadata for the owning organization without token hashes. |
| POST | `/organizations/:organizationId/invitations` | Emails an owner-created, seven-day invitation for an allowed organization role. |
| POST | `/organizations/:organizationId/invitations/:invitationId/revoke` | Revokes a pending invitation in an organization owned by the caller. |
| GET | `/organizations/:organizationId/members` | Lists active organization members for the owner, returning only names, emails, organization roles, and join dates. |
| POST | `/organizations/:organizationId/members/:memberId/revoke` | Revokes a member in the owner’s organization without changing that user’s global account role. |
| POST | `/organization-invitations/accept` | Accepts a one-time invitation for the authenticated, verified matching email account. |
| GET | `/organizations/:organizationId/departments` | Lists active departments for an owned organization. |
| POST | `/organizations/:organizationId/departments` | Creates a department after server-side ownership validation. |
| POST | `/organizations/:organizationId/departments/:departmentId/archive` | Archives a department within the owned organization. |
| GET | `/organizations/:organizationId/calendar-events` | Lists owner-scoped calendar events with date overlap, status, and pagination filters. |
| POST | `/organizations/:organizationId/calendar-events` | Creates a validated draft calendar event. |
| PATCH | `/organizations/:organizationId/calendar-events/:eventId` | Updates an active calendar event owned by the organization. |
| POST | `/organizations/:organizationId/calendar-events/:eventId/publish` | Publishes an owner-managed calendar event. |
| POST | `/organizations/:organizationId/calendar-events/:eventId/archive` | Soft-archives an owner-managed calendar event. |

Authentication uses salted Node.js `scrypt` password hashes and random opaque session tokens stored as SHA-256 hashes. Session cookies are HttpOnly and SameSite=Strict; production additionally uses Secure and the `__Host-` cookie prefix. Authentication mutations are limited and validate browser request origins against the configured allowlist.

Registration does not automatically send verification email. Users can request verification from Profile & settings; organization creation remains blocked until a valid link is confirmed. SMTP delivery for email verification, password recovery and invitations requires the server-side settings above and has not been verified against a real provider in this environment. Membership roles do not yet authorize staff workflows; department and calendar routes authorize the organization owner only. Do not treat this API foundation as a complete production authentication or SaaS system.

The academic calendar API currently supports owner-managed, tenant-scoped draft/publish/archive lifecycle and paginated date filtering. It does not yet include a calendar UI, student/faculty read permissions, department targeting, notification delivery, CSV import/export, or rules that block/reschedule attendance sessions on holidays.

The frontend API client uses `VITE_API_BASE_URL` when set; otherwise it targets port `4000` on the frontend's current hostname, under `/api/v1`. Requests include session cookies. Configure the exact frontend origins (including scheme and port) in `CORS_ORIGINS`.

The in-app service status dialog checks `GET /api/v1/ready` at the time it is opened. A ready API/database does not imply that attendance or other business modules have been implemented.

## Validation

Run these commands from the project root: `npm run lint`, `npm run test:api`, and `npm run build`.

The MongoDB integration test is skipped unless `MONGODB_TEST_URI` is set. It appends a random `attend_with_qr_test_<id>` database name to that URI, and drops only that newly created test database on completion. Example for PowerShell:

```powershell
$env:MONGODB_TEST_URI = "mongodb://127.0.0.1:27017/attend_with_qr_test_seed"
npm run test:api
Remove-Item Env:\MONGODB_TEST_URI
```

Never point destructive tests at production or a shared development database.

import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  readSessionCookie,
  serializeUser,
  setSessionCookie,
  verifyPassword,
} from './auth.js';
import { CalendarEvent } from './models/CalendarEvent.js';
import { Department } from './models/Department.js';
import { EmailVerification } from './models/EmailVerification.js';
import { Organization } from './models/Organization.js';
import { OrganizationInvitation } from './models/OrganizationInvitation.js';
import { OrganizationMember } from './models/OrganizationMember.js';
import { PasswordReset } from './models/PasswordReset.js';
import { Session } from './models/Session.js';
import { User } from './models/User.js';
import {
  sendEmailVerification as deliverEmailVerification,
  sendOrganizationInvitation as deliverOrganizationInvitation,
  sendPasswordResetEmail as deliverPasswordResetEmail,
} from './email.js';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CALENDAR_EVENT_TYPES = new Set([
  'HOLIDAY',
  'SEMESTER',
  'EXAM',
  'VACATION',
  'EVENT',
  'TIMETABLE_CHANGE',
  'DEADLINE',
]);
const CALENDAR_DAY_TYPES = new Set([
  'FULL_HOLIDAY',
  'PARTIAL_HOLIDAY',
  'SPECIAL_WORKING_DAY',
  'INFORMATIONAL',
]);
const ORGANIZATION_MEMBER_ROLES = new Set(['ADMIN', 'FACULTY', 'TEACHER', 'STUDENT']);
const ORGANIZATION_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isValidTimezone(timezone) {
  if (typeof timezone !== 'string' || timezone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function parseIsoDate(value) {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value ? parsed : null;
}

function normalizeIndianPhone(value) {
  if (typeof value !== 'string') return null;
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (!compact) return '';
  if (!/^\+?(?:91)?[6-9]\d{9}$/.test(compact)) return null;
  const digits = compact.replace(/\D/g, '');
  return `+91${digits.slice(-10)}`;
}

function validateProfileUpdate(body) {
  const allowedFields = new Set([
    'name',
    'phone',
    'institutionName',
    'department',
    'program',
    'enrollmentNumber',
  ]);
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some((key) => !allowedFields.has(key))
  ) {
    return null;
  }

  const updates = {};
  if (Object.hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 120) {
      return null;
    }
    updates.name = body.name.trim();
  }

  if (Object.hasOwn(body, 'phone')) {
    const phone = normalizeIndianPhone(body.phone);
    if (phone === null) return null;
    updates.phone = phone;
  }

  const textFields = [
    ['institutionName', 160],
    ['department', 120],
    ['program', 120],
    ['enrollmentNumber', 32],
  ];
  for (const [field, maxLength] of textFields) {
    if (!Object.hasOwn(body, field)) continue;
    if (
      typeof body[field] !== 'string' ||
      body[field].trim().length > maxLength
    ) {
      return null;
    }
    updates[field] =
      field === 'enrollmentNumber'
        ? body[field].trim().toUpperCase()
        : body[field].trim();
  }
  return updates;
}

function validateCalendarEventInput(body, { partial = false, current = null } = {}) {
  const allowedFields = new Set([
    'title',
    'description',
    'type',
    'dayType',
    'startAt',
    'endAt',
    'timezone',
  ]);
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length === 0 ||
    Object.keys(body).some((key) => !allowedFields.has(key))
  ) {
    return null;
  }

  const merged = {
    title: body.title ?? current?.title,
    description: body.description ?? current?.description ?? '',
    type: body.type ?? current?.type,
    dayType: body.dayType ?? current?.dayType ?? 'INFORMATIONAL',
    startAt: body.startAt ?? current?.startAt?.toISOString?.() ?? current?.startAt,
    endAt: body.endAt ?? current?.endAt?.toISOString?.() ?? current?.endAt,
    timezone: body.timezone ?? current?.timezone ?? 'Asia/Kolkata',
  };
  if (
    (partial && Object.keys(body).length === 0) ||
    typeof merged.title !== 'string' ||
    merged.title.trim().length < 3 ||
    merged.title.trim().length > 160 ||
    typeof merged.description !== 'string' ||
    merged.description.length > 2000 ||
    !CALENDAR_EVENT_TYPES.has(merged.type) ||
    !CALENDAR_DAY_TYPES.has(merged.dayType) ||
    !isValidTimezone(merged.timezone)
  ) {
    return null;
  }

  const startAt = parseIsoDate(
    merged.startAt instanceof Date ? merged.startAt.toISOString() : merged.startAt
  );
  const endAt = parseIsoDate(
    merged.endAt instanceof Date ? merged.endAt.toISOString() : merged.endAt
  );
  if (!startAt || !endAt || endAt <= startAt) return null;

  return {
    title: merged.title.trim(),
    description: merged.description.trim(),
    type: merged.type,
    dayType: merged.dayType,
    startAt,
    endAt,
    timezone: merged.timezone,
  };
}

function serializeCalendarEvent(event) {
  return {
    id: String(event._id ?? event.id),
    title: event.title,
    description: event.description,
    type: event.type,
    dayType: event.dayType,
    startAt: event.startAt,
    endAt: event.endAt,
    timezone: event.timezone,
    status: event.status,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export function createApp({
  allowedOrigins = [],
  isDatabaseReady = () => false,
  models = {},
  secureCookies = process.env.NODE_ENV === 'production',
  sendEmailVerification = deliverEmailVerification,
  sendOrganizationInvitation = deliverOrganizationInvitation,
  sendPasswordResetEmail = deliverPasswordResetEmail,
} = {}) {
  const app = express();
  const originAllowlist = new Set(allowedOrigins);
  const UserModel = models.User ?? User;
  const SessionModel = models.Session ?? Session;
  const OrganizationModel = models.Organization ?? Organization;
  const OrganizationInvitationModel = models.OrganizationInvitation ?? OrganizationInvitation;
  const OrganizationMemberModel = models.OrganizationMember ?? OrganizationMember;
  const DepartmentModel = models.Department ?? Department;
  const CalendarEventModel = models.CalendarEvent ?? CalendarEvent;
  const EmailVerificationModel = models.EmailVerification ?? EmailVerification;
  const PasswordResetModel = models.PasswordReset ?? PasswordReset;
  const cookieName = secureCookies ? '__Host-attendqr_session' : 'attendqr_session';
  const cookieOptions = { secure: secureCookies, cookieName };

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, !origin || originAllowlist.has(origin));
      },
      credentials: true,
    })
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use(express.json({ limit: '32kb' }));

  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Try again later.' },
    },
  });
  const emailVerificationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many verification requests. Try again later.',
      },
    },
  });
  const organizationInvitationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many organization invitations. Try again later.',
      },
    },
  });

  const requireDatabase = (_request, response, next) => {
    if (!isDatabaseReady()) {
      return response.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'The service is not ready to process data requests.',
        },
      });
    }
    return next();
  };

  const requireTrustedOrigin = (request, response, next) => {
    const origin = request.get('origin');
    if (origin && !originAllowlist.has(origin)) {
      return response.status(403).json({
        error: { code: 'UNTRUSTED_ORIGIN', message: 'This request origin is not allowed.' },
      });
    }
    return next();
  };

  const authenticate = async (request, response, next) => {
    try {
      const token = readSessionCookie(request.headers.cookie, cookieName);
      if (!token) {
        return response.status(401).json({
          error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
        });
      }

      const session = await SessionModel.findOne({
        tokenHash: hashSessionToken(token),
        expiresAt: { $gt: new Date() },
      });
      const user = session ? await UserModel.findById(session.userId) : null;
      if (!user || user.status !== 'ACTIVE') {
        return response.status(401).json({
          error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
        });
      }
      request.authUser = user;
      request.authSession = session;
      return next();
    } catch (error) {
      return next(error);
    }
  };

  const requireOrganizationOwner = async (request, response, next) => {
    if (!mongoose.isValidObjectId(request.params.organizationId)) {
      return response.status(404).json({
        error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.' },
      });
    }
    try {
      const organization = await OrganizationModel.findOne({
        _id: request.params.organizationId,
        ownerUserId: request.authUser._id ?? request.authUser.id,
        status: 'ACTIVE',
      });
      if (!organization) {
        return response.status(404).json({
          error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.' },
        });
      }
      request.organization = organization;
      return next();
    } catch (error) {
      return next(error);
    }
  };

  app.post(
    '/api/v1/auth/register',
    authRateLimit,
    requireTrustedOrigin,
    requireDatabase,
    async (request, response, next) => {
      try {
        const body = request.body ?? {};
        const { name, email, password } = body;
        const allowedFields = new Set([
          'name',
          'email',
          'password',
          'phone',
          'institutionName',
          'department',
          'program',
          'enrollmentNumber',
        ]);
        const optionalTextFields = [
          ['phone', 16],
          ['institutionName', 160],
          ['department', 120],
          ['program', 120],
          ['enrollmentNumber', 32],
        ];
        const optionalFieldsValid = optionalTextFields.every(([field, maxLength]) => {
          if (body[field] === undefined || body[field] === '') return true;
          if (typeof body[field] !== 'string' || body[field].trim().length > maxLength) return false;
          if (field === 'phone') {
            return normalizeIndianPhone(body[field]) !== null;
          }
          return body[field].trim().length >= 1;
        });
        if (
          typeof name !== 'string' ||
          name.trim().length < 2 ||
          name.trim().length > 120 ||
          typeof email !== 'string' ||
          email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
          typeof password !== 'string' ||
          password.length < 12 ||
          Buffer.byteLength(password, 'utf8') > 128 ||
          Object.keys(body).some((key) => !allowedFields.has(key)) ||
          !optionalFieldsValid
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_REGISTRATION',
              message:
                'Provide a valid name, email, and password between 12 and 128 bytes. Optional profile fields must also be valid.',
            },
          });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const passwordHash = await hashPassword(password);
        let user;
        try {
          user = await UserModel.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'STUDENT',
            phone: body.phone ? normalizeIndianPhone(body.phone) : '',
            institutionName: body.institutionName?.trim() ?? '',
            department: body.department?.trim() ?? '',
            program: body.program?.trim() ?? '',
            enrollmentNumber: body.enrollmentNumber?.trim().toUpperCase() ?? '',
          });
        } catch (error) {
          if (error?.code === 11000) {
            return response.status(409).json({
              error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists.' },
            });
          }
          throw error;
        }

        const token = createSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await SessionModel.create({
          userId: user._id ?? user.id,
          tokenHash: hashSessionToken(token),
          expiresAt,
        });
        setSessionCookie(response, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
        return response.status(201).json({ data: { user: serializeUser(user) } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/login',
    authRateLimit,
    requireTrustedOrigin,
    requireDatabase,
    async (request, response, next) => {
      try {
        const { email, password } = request.body ?? {};
        if (
          typeof email !== 'string' ||
          email.length > 254 ||
          typeof password !== 'string' ||
          Buffer.byteLength(password, 'utf8') > 128
        ) {
          return response.status(400).json({
            error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is invalid.' },
          });
        }

        const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select(
          '+passwordHash'
        );
        const passwordMatches =
          user?.status === 'ACTIVE' && (await verifyPassword(password, user.passwordHash));
        if (!passwordMatches) {
          return response.status(401).json({
            error: { code: 'AUTHENTICATION_FAILED', message: 'Email or password is incorrect.' },
          });
        }

        const token = createSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await SessionModel.create({
          userId: user._id ?? user.id,
          tokenHash: hashSessionToken(token),
          expiresAt,
        });
        setSessionCookie(response, token, { ...cookieOptions, maxAge: SESSION_TTL_MS });
        return response.status(200).json({ data: { user: serializeUser(user) } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get('/api/v1/auth/me', requireDatabase, authenticate, (request, response) => {
    return response.status(200).json({ data: { user: serializeUser(request.authUser) } });
  });

  app.post(
    '/api/v1/auth/email-verification/request',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    emailVerificationRateLimit,
    async (request, response, next) => {
      try {
        if (Object.keys(request.body ?? {}).length > 0) {
          return response.status(400).json({
            error: {
              code: 'INVALID_VERIFICATION_REQUEST',
              message: 'This verification request is invalid.',
            },
          });
        }
        if (request.authUser.emailVerifiedAt) {
          return response.status(200).json({ data: { status: 'already_verified' } });
        }

        const userId = request.authUser._id ?? request.authUser.id;
        const token = createSessionToken();
        const verification = await EmailVerificationModel.findOneAndUpdate(
          { userId },
          {
            $set: {
              tokenHash: hashSessionToken(token),
              expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            },
          },
          { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
        );

        try {
          await sendEmailVerification({
            to: request.authUser.email,
            name: request.authUser.name,
            token,
          });
        } catch (error) {
          await EmailVerificationModel.deleteOne({
            _id: verification._id,
            tokenHash: hashSessionToken(token),
          });
          console.error(`Email verification delivery failed: ${error.name ?? 'Error'}`);
          return response.status(503).json({
            error: {
              code: 'EMAIL_DELIVERY_UNAVAILABLE',
              message: 'Verification email could not be sent. Check the email service configuration and try again.',
            },
          });
        }

        return response.status(202).json({ data: { status: 'verification_sent' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/email-verification/confirm',
    requireDatabase,
    emailVerificationRateLimit,
    async (request, response, next) => {
      try {
        const { token } = request.body ?? {};
        if (
          typeof token !== 'string' ||
          !/^[A-Za-z0-9_-]{43}$/.test(token) ||
          Object.keys(request.body ?? {}).some((key) => key !== 'token')
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_VERIFICATION_TOKEN',
              message: 'This verification link is invalid or expired.',
            },
          });
        }

        const verification = await EmailVerificationModel.findOneAndDelete({
          tokenHash: hashSessionToken(token),
          expiresAt: { $gt: new Date() },
        });
        if (!verification) {
          return response.status(400).json({
            error: {
              code: 'INVALID_VERIFICATION_TOKEN',
              message: 'This verification link is invalid or expired.',
            },
          });
        }

        const result = await UserModel.updateOne(
          { _id: verification.userId, status: 'ACTIVE', emailVerifiedAt: null },
          { $set: { emailVerifiedAt: new Date() } }
        );
        if (result.matchedCount !== 1) {
          return response.status(400).json({
            error: {
              code: 'INVALID_VERIFICATION_TOKEN',
              message: 'This verification link is invalid or expired.',
            },
          });
        }
        return response.status(200).json({ data: { status: 'verified' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/password-reset/request',
    authRateLimit,
    requireTrustedOrigin,
    requireDatabase,
    async (request, response, next) => {
      try {
        const { email } = request.body ?? {};
        if (
          typeof email !== 'string' ||
          email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
          Object.keys(request.body ?? {}).some((key) => key !== 'email')
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_PASSWORD_RESET_REQUEST',
              message: 'Enter the email address associated with the account.',
            },
          });
        }

        const user = await UserModel.findOne({
          email: email.trim().toLowerCase(),
          status: 'ACTIVE',
        });
        if (user) {
          const token = createSessionToken();
          const reset = await PasswordResetModel.findOneAndUpdate(
            { userId: user._id ?? user.id },
            {
              $set: {
                tokenHash: hashSessionToken(token),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
              },
            },
            { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
          );
          void sendPasswordResetEmail({ to: user.email, name: user.name, token }).catch(
            async (error) => {
              try {
                await PasswordResetModel.deleteOne({
                  _id: reset._id,
                  tokenHash: hashSessionToken(token),
                });
              } catch (cleanupError) {
                console.error(
                  `Password reset token cleanup failed: ${cleanupError.name ?? 'Error'}`
                );
              }
              console.error(`Password reset email delivery failed: ${error.name ?? 'Error'}`);
            }
          );
        }

        return response.status(202).json({
          data: {
            status: 'if_account_exists_email_sent',
            message: 'If an active account uses that email, a password reset link will be sent.',
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/password-reset/confirm',
    authRateLimit,
    requireTrustedOrigin,
    requireDatabase,
    async (request, response, next) => {
      try {
        const { token, password } = request.body ?? {};
        if (
          typeof token !== 'string' ||
          !/^[A-Za-z0-9_-]{43}$/.test(token) ||
          typeof password !== 'string' ||
          password.length < 12 ||
          Buffer.byteLength(password, 'utf8') > 128 ||
          Object.keys(request.body ?? {}).some((key) => !['token', 'password'].includes(key))
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_PASSWORD_RESET',
              message: 'Use a valid reset link and a password between 12 and 128 bytes.',
            },
          });
        }

        const reset = await PasswordResetModel.findOneAndDelete({
          tokenHash: hashSessionToken(token),
          expiresAt: { $gt: new Date() },
        });
        if (!reset) {
          return response.status(400).json({
            error: {
              code: 'INVALID_PASSWORD_RESET_TOKEN',
              message: 'This password reset link is invalid or expired. Request a new one.',
            },
          });
        }

        const passwordHash = await hashPassword(password);
        const result = await UserModel.updateOne(
          { _id: reset.userId, status: 'ACTIVE' },
          { $set: { passwordHash } }
        );
        if (result.matchedCount !== 1) {
          return response.status(400).json({
            error: {
              code: 'INVALID_PASSWORD_RESET_TOKEN',
              message: 'This password reset link is invalid or expired. Request a new one.',
            },
          });
        }

        await Promise.all([
          SessionModel.deleteMany({ userId: reset.userId }),
          EmailVerificationModel.deleteOne({ userId: reset.userId }),
        ]);
        return response.status(200).json({
          data: { status: 'password_reset' },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/session/renew',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      try {
        const currentToken = readSessionCookie(request.headers.cookie, cookieName);
        const nextToken = createSessionToken();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        const result = await SessionModel.updateOne(
          {
            _id: request.authSession._id,
            userId: request.authUser._id ?? request.authUser.id,
            tokenHash: hashSessionToken(currentToken),
            expiresAt: { $gt: new Date() },
          },
          {
            $set: {
              tokenHash: hashSessionToken(nextToken),
              expiresAt,
            },
          }
        );
        if (result.modifiedCount !== 1) {
          clearSessionCookie(response, cookieOptions);
          return response.status(401).json({
            error: {
              code: 'SESSION_EXPIRED',
              message: 'This session expired or was renewed elsewhere. Sign in again.',
            },
          });
        }

        setSessionCookie(response, nextToken, { ...cookieOptions, maxAge: SESSION_TTL_MS });
        return response.status(200).json({ data: { expiresAt } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    '/api/v1/auth/sessions',
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      try {
        const token = readSessionCookie(request.headers.cookie, cookieName);
        const activeSessions = await SessionModel.find({
          userId: request.authUser._id ?? request.authUser.id,
          expiresAt: { $gt: new Date() },
        })
          .select('+tokenHash createdAt expiresAt')
          .sort({ createdAt: -1 })
          .lean();
        return response.status(200).json({
          data: {
            sessions: activeSessions.map((session) => ({
              createdAt: session.createdAt,
              expiresAt: session.expiresAt,
              current: session.tokenHash === hashSessionToken(token),
            })),
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/sessions/revoke-others',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      try {
        const token = readSessionCookie(request.headers.cookie, cookieName);
        const result = await SessionModel.deleteMany({
          userId: request.authUser._id ?? request.authUser.id,
          tokenHash: { $ne: hashSessionToken(token) },
        });
        return response.status(200).json({
          data: { revokedCount: result.deletedCount ?? 0 },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.patch(
    '/api/v1/auth/me',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      try {
        const updates = validateProfileUpdate(request.body);
        if (!updates) {
          return response.status(400).json({
            error: {
              code: 'INVALID_PROFILE',
              message:
                'Provide valid profile fields. Name is required when changed; phone and profile claims must meet their length and format requirements.',
            },
          });
        }

        const user = await UserModel.findByIdAndUpdate(
          request.authUser._id ?? request.authUser.id,
          { $set: updates },
          { returnDocument: 'after', runValidators: true }
        );
        if (!user || user.status !== 'ACTIVE') {
          return response.status(401).json({
            error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' },
          });
        }
        return response.status(200).json({ data: { user: serializeUser(user) } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/auth/logout',
    requireTrustedOrigin,
    requireDatabase,
    async (request, response, next) => {
      try {
        const token = readSessionCookie(request.headers.cookie, cookieName);
        if (token) {
          await SessionModel.deleteOne({ tokenHash: hashSessionToken(token) });
        }
        clearSessionCookie(response, cookieOptions);
        return response.status(200).json({ data: { status: 'signed_out' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations',
    authRateLimit,
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      try {
        if (!request.authUser.emailVerifiedAt) {
          return response.status(403).json({
            error: {
              code: 'EMAIL_VERIFICATION_REQUIRED',
              message: 'Verify the account email before creating an organization.',
            },
          });
        }
        const body = request.body ?? {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (
          name.length < 2 ||
          name.length > 160 ||
          Object.keys(body).some((key) => key !== 'name')
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_ORGANIZATION',
              message: 'Provide an organization name between 2 and 160 characters.',
            },
          });
        }

        const baseSlug =
          name
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60) || 'college';
        const slug = `${baseSlug}-${createSessionToken().slice(0, 8)}`;
        const organization = await OrganizationModel.create({
          name,
          slug,
          ownerUserId: request.authUser._id ?? request.authUser.id,
        });
        return response.status(201).json({
          data: {
            organization: {
              id: String(organization._id ?? organization.id),
              name: organization.name,
              slug: organization.slug,
              role: 'OWNER',
              createdAt: organization.createdAt,
            },
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    '/api/v1/organizations',
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      try {
        const userId = request.authUser._id ?? request.authUser.id;
        const organizations = await OrganizationModel.find({
          ownerUserId: userId,
          status: 'ACTIVE',
        })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        const memberships = await OrganizationMemberModel.find({
          userId,
          status: 'ACTIVE',
        })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        const ownedIds = new Set(organizations.map((organization) => String(organization._id)));
        const memberOrganizationIds = memberships
          .map((membership) => membership.organizationId)
          .filter((organizationId) => !ownedIds.has(String(organizationId)));
        const memberOrganizations = memberOrganizationIds.length
          ? await OrganizationModel.find({
              _id: { $in: memberOrganizationIds },
              status: 'ACTIVE',
            }).lean()
          : [];
        const membershipRoles = new Map(
          memberships.map((membership) => [
            String(membership.organizationId),
            membership.role,
          ])
        );
        return response.status(200).json({
          data: {
            organizations: [
              ...organizations.map((organization) => ({
                id: String(organization._id),
                name: organization.name,
                slug: organization.slug,
                role: 'OWNER',
                createdAt: organization.createdAt,
              })),
              ...memberOrganizations.map((organization) => ({
                id: String(organization._id),
                name: organization.name,
                slug: organization.slug,
                role: membershipRoles.get(String(organization._id)),
                createdAt: organization.createdAt,
              })),
            ],
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    '/api/v1/organizations/:organizationId/invitations',
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const invitations = await OrganizationInvitationModel.find({
          organizationId: request.organization._id,
        })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        return response.status(200).json({
          data: {
            invitations: invitations.map((invitation) => ({
              id: String(invitation._id),
              email: invitation.email,
              role: invitation.role,
              status:
                invitation.status === 'PENDING' && invitation.expiresAt <= new Date()
                  ? 'EXPIRED'
                  : invitation.status,
              expiresAt: invitation.expiresAt,
              createdAt: invitation.createdAt,
              acceptedAt: invitation.acceptedAt,
            })),
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/invitations',
    organizationInvitationRateLimit,
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const body = request.body ?? {};
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const role = body.role;
        if (
          Object.keys(body).some((key) => !['email', 'role'].includes(key)) ||
          email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          !ORGANIZATION_MEMBER_ROLES.has(role) ||
          email === request.authUser.email
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_ORGANIZATION_INVITATION',
              message: 'Provide another person’s valid email and an allowed organization role.',
            },
          });
        }

        const invitedUser = await UserModel.findOne({ email });
        const userId = invitedUser?._id ?? invitedUser?.id;
        if (
          userId &&
          (await OrganizationMemberModel.findOne({
            organizationId: request.organization._id,
            userId,
            status: 'ACTIVE',
          }))
        ) {
          return response.status(409).json({
            error: {
              code: 'ALREADY_ORGANIZATION_MEMBER',
              message: 'This account is already an active organization member.',
            },
          });
        }

        const token = createSessionToken();
        const tokenHash = hashSessionToken(token);
        const invitation = await OrganizationInvitationModel.findOneAndUpdate(
          {
            organizationId: request.organization._id,
            email,
          },
          {
            $set: {
              role,
              tokenHash,
              status: 'PENDING',
              invitedBy: request.authUser._id ?? request.authUser.id,
              expiresAt: new Date(Date.now() + ORGANIZATION_INVITATION_TTL_MS),
              acceptedAt: null,
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );

        try {
          await sendOrganizationInvitation({
            to: email,
            name: invitedUser?.name ?? email.split('@')[0],
            organizationName: request.organization.name,
            role,
            token,
          });
        } catch (error) {
          await OrganizationInvitationModel.updateOne(
            { _id: invitation._id, tokenHash, status: 'PENDING' },
            { $set: { status: 'REVOKED' } }
          );
          console.error(`Organization invitation delivery failed: ${error.name ?? 'Error'}`);
          return response.status(503).json({
            error: {
              code: 'EMAIL_DELIVERY_UNAVAILABLE',
              message: 'The invitation email could not be sent. Check the email service configuration and try again.',
            },
          });
        }

        return response.status(202).json({
          data: {
            invitation: {
              id: String(invitation._id ?? invitation.id),
              email: invitation.email,
              role: invitation.role,
              status: invitation.status,
              expiresAt: invitation.expiresAt,
              createdAt: invitation.createdAt,
            },
          },
        });
      } catch (error) {
        if (error?.code === 11000) {
          return response.status(409).json({
            error: {
              code: 'INVITATION_CONFLICT',
              message: 'An invitation or membership already exists for this account.',
            },
          });
        }
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/invitations/:invitationId/revoke',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        if (
          !mongoose.isValidObjectId(request.params.invitationId) ||
          Object.keys(request.body ?? {}).length > 0
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_ORGANIZATION_INVITATION',
              message: 'This invitation revocation request is invalid.',
            },
          });
        }
        const result = await OrganizationInvitationModel.updateOne(
          {
            _id: request.params.invitationId,
            organizationId: request.organization._id,
            status: 'PENDING',
          },
          { $set: { status: 'REVOKED' } }
        );
        if (result.matchedCount !== 1) {
          return response.status(404).json({
            error: {
              code: 'INVITATION_NOT_FOUND',
              message: 'Pending invitation not found.',
            },
          });
        }
        return response.status(200).json({ data: { status: 'revoked' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    '/api/v1/organizations/:organizationId/members',
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const members = await OrganizationMemberModel.find({
          organizationId: request.organization._id,
          status: 'ACTIVE',
        })
          .populate('userId', 'name email')
          .sort({ createdAt: -1 })
          .limit(500)
          .lean();
        return response.status(200).json({
          data: {
            members: members
              .filter((member) => member.userId)
              .map((member) => ({
                id: String(member._id),
                userId: String(member.userId._id),
                name: member.userId.name,
                email: member.userId.email,
                role: member.role,
                joinedAt: member.joinedAt,
              })),
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/members/:memberId/revoke',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        if (
          !mongoose.isValidObjectId(request.params.memberId) ||
          Object.keys(request.body ?? {}).length > 0
        ) {
          return response.status(400).json({
            error: { code: 'INVALID_ORGANIZATION_MEMBER', message: 'This membership update is invalid.' },
          });
        }
        const result = await OrganizationMemberModel.updateOne(
          {
            _id: request.params.memberId,
            organizationId: request.organization._id,
            status: 'ACTIVE',
          },
          { $set: { status: 'REVOKED' } }
        );
        if (result.matchedCount !== 1) {
          return response.status(404).json({
            error: { code: 'ORGANIZATION_MEMBER_NOT_FOUND', message: 'Active organization member not found.' },
          });
        }
        return response.status(200).json({ data: { status: 'revoked' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organization-invitations/accept',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    async (request, response, next) => {
      let invitation;
      let memberCreated = false;
      try {
        const body = request.body ?? {};
        if (
          Object.keys(body).length !== 1 ||
          typeof body.token !== 'string' ||
          !/^[A-Za-z0-9_-]{43}$/.test(body.token)
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_ORGANIZATION_INVITATION',
              message: 'This invitation link is invalid or expired.',
            },
          });
        }
        if (!request.authUser.emailVerifiedAt) {
          return response.status(403).json({
            error: {
              code: 'EMAIL_VERIFICATION_REQUIRED',
              message: 'Verify the invited account email before accepting this invitation.',
            },
          });
        }

        const tokenHash = hashSessionToken(body.token);
        const userId = request.authUser._id ?? request.authUser.id;
        const interruptedAcceptance = await OrganizationInvitationModel.findOne({
          tokenHash,
          email: request.authUser.email,
          status: 'ACCEPTING',
        });
        if (interruptedAcceptance) {
          const existingMember = await OrganizationMemberModel.findOne({
            organizationId: interruptedAcceptance.organizationId,
            userId,
            status: 'ACTIVE',
          });
          if (existingMember) {
            const organization = await OrganizationModel.findOne({
              _id: interruptedAcceptance.organizationId,
              status: 'ACTIVE',
            }).lean();
            if (organization) {
              await OrganizationInvitationModel.updateOne(
                { _id: interruptedAcceptance._id, status: 'ACCEPTING' },
                { $set: { status: 'ACCEPTED', acceptedAt: new Date() } }
              );
              return response.status(200).json({
                data: {
                  organization: {
                    id: String(organization._id),
                    name: organization.name,
                    slug: organization.slug,
                    role: existingMember.role,
                  },
                },
              });
            }
          }
        }

        invitation = await OrganizationInvitationModel.findOneAndUpdate(
          {
            tokenHash,
            email: request.authUser.email,
            status: 'PENDING',
            expiresAt: { $gt: new Date() },
          },
          { $set: { status: 'ACCEPTING' } },
          { returnDocument: 'after' }
        );
        if (!invitation) {
          return response.status(400).json({
            error: {
              code: 'INVALID_ORGANIZATION_INVITATION',
              message: 'This invitation is invalid, expired, already used, or belongs to another account.',
            },
          });
        }

        const organization = await OrganizationModel.findOne({
          _id: invitation.organizationId,
          status: 'ACTIVE',
        }).lean();
        if (!organization) {
          await OrganizationInvitationModel.updateOne(
            { _id: invitation._id, status: 'ACCEPTING' },
            { $set: { status: 'REVOKED' } }
          );
          return response.status(404).json({
            error: {
              code: 'ORGANIZATION_NOT_FOUND',
              message: 'This organization is no longer available.',
            },
          });
        }

        const member = await OrganizationMemberModel.findOneAndUpdate(
          {
            organizationId: invitation.organizationId,
            userId,
          },
          {
            $set: {
              role: invitation.role,
              status: 'ACTIVE',
              invitedBy: invitation.invitedBy,
              joinedAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );
        memberCreated = true;
        await OrganizationInvitationModel.updateOne(
          { _id: invitation._id, status: 'ACCEPTING' },
          { $set: { status: 'ACCEPTED', acceptedAt: new Date() } }
        );
        return response.status(200).json({
          data: {
            organization: {
              id: String(organization._id),
              name: organization.name,
              slug: organization.slug,
              role: member.role,
            },
          },
        });
      } catch (error) {
        if (error?.code === 11000 && invitation) {
          const userId = request.authUser._id ?? request.authUser.id;
          const existingMember = await OrganizationMemberModel.findOne({
            organizationId: invitation.organizationId,
            userId,
            status: 'ACTIVE',
          });
          if (existingMember) {
            const organization = await OrganizationModel.findOne({
              _id: invitation.organizationId,
              status: 'ACTIVE',
            }).lean();
            if (!organization) {
              await OrganizationInvitationModel.updateOne(
                { _id: invitation._id, status: 'ACCEPTING' },
                { $set: { status: 'REVOKED' } }
              );
              return response.status(404).json({
                error: {
                  code: 'ORGANIZATION_NOT_FOUND',
                  message: 'This organization is no longer available.',
                },
              });
            }
            await OrganizationInvitationModel.updateOne(
              { _id: invitation._id, status: 'ACCEPTING' },
              { $set: { status: 'ACCEPTED', acceptedAt: new Date() } }
            );
            return response.status(200).json({
              data: {
                organization: {
                  id: String(organization._id),
                  name: organization.name,
                  slug: organization.slug,
                  role: existingMember.role,
                },
              },
            });
          }
        }
        if (invitation && !memberCreated) {
          await OrganizationInvitationModel.updateOne(
            { _id: invitation._id, status: 'ACCEPTING' },
            { $set: { status: 'PENDING' } }
          );
        }
        return next(error);
      }
    }
  );

  app.get(
    '/api/v1/organizations/:organizationId/departments',
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const departments = await DepartmentModel.find({
          organizationId: request.organization._id,
          archivedAt: null,
        })
          .sort({ name: 1 })
          .limit(500)
          .lean();
        return response.status(200).json({
          data: {
            departments: departments.map((department) => ({
              id: String(department._id),
              name: department.name,
              code: department.code,
              createdAt: department.createdAt,
            })),
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/departments',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const body = request.body ?? {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
        if (
          name.length < 2 ||
          name.length > 120 ||
          !/^[A-Z0-9][A-Z0-9_-]{1,15}$/.test(code) ||
          Object.keys(body).some((key) => !['name', 'code'].includes(key))
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_DEPARTMENT',
              message:
                'Provide a department name and a 2–16 character code using letters, numbers, - or _.',
            },
          });
        }

        const department = await DepartmentModel.create({
          organizationId: request.organization._id,
          name,
          code,
        });
        return response.status(201).json({
          data: {
            department: {
              id: String(department._id ?? department.id),
              name: department.name,
              code: department.code,
              createdAt: department.createdAt,
            },
          },
        });
      } catch (error) {
        if (error?.code === 11000) {
          return response.status(409).json({
            error: {
              code: 'DEPARTMENT_CODE_IN_USE',
              message: 'That department code is already in use.',
            },
          });
        }
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/departments/:departmentId/archive',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        if (!mongoose.isValidObjectId(request.params.departmentId)) {
          return response.status(404).json({
            error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found.' },
          });
        }
        const result = await DepartmentModel.updateOne(
          {
            _id: request.params.departmentId,
            organizationId: request.organization._id,
            archivedAt: null,
          },
          { $set: { archivedAt: new Date() } }
        );
        if (result.matchedCount !== 1) {
          return response.status(404).json({
            error: { code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found.' },
          });
        }
        return response.status(200).json({ data: { status: 'archived' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get(
    '/api/v1/organizations/:organizationId/calendar-events',
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const { from, to, status = 'all', page = '1', limit = '50' } = request.query;
        const parsedPage = Number(page);
        const parsedLimit = Number(limit);
        const fromDate = from === undefined ? null : new Date(from);
        const toDate = to === undefined ? null : new Date(to);
        if (
          (from !== undefined && (!Number.isFinite(fromDate.getTime()) || fromDate.toISOString() !== from)) ||
          (to !== undefined && (!Number.isFinite(toDate.getTime()) || toDate.toISOString() !== to)) ||
          (fromDate && toDate && fromDate > toDate) ||
          !['all', 'draft', 'published'].includes(status) ||
          !Number.isInteger(parsedPage) ||
          parsedPage < 1 ||
          !Number.isInteger(parsedLimit) ||
          parsedLimit < 1 ||
          parsedLimit > 100
        ) {
          return response.status(400).json({
            error: {
              code: 'INVALID_CALENDAR_QUERY',
              message: 'Provide valid ISO date filters, status, page, and limit (1–100).',
            },
          });
        }

        const filter = {
          organizationId: request.organization._id,
          archivedAt: null,
        };
        if (status !== 'all') filter.status = status.toUpperCase();
        if (fromDate || toDate) {
          filter.startAt = {};
          filter.endAt = {};
          if (toDate) filter.startAt.$lte = toDate;
          if (fromDate) filter.endAt.$gte = fromDate;
        }

        const [events, total] = await Promise.all([
          CalendarEventModel.find(filter)
            .sort({ startAt: 1, _id: 1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit)
            .lean(),
          CalendarEventModel.countDocuments(filter),
        ]);
        return response.status(200).json({
          data: {
            events: events.map(serializeCalendarEvent),
            pagination: {
              page: parsedPage,
              limit: parsedLimit,
              total,
              pages: Math.ceil(total / parsedLimit),
            },
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/calendar-events',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        const eventInput = validateCalendarEventInput(request.body ?? {});
        if (!eventInput) {
          return response.status(400).json({
            error: {
              code: 'INVALID_CALENDAR_EVENT',
              message: 'Provide a valid title, event type, start/end timestamps, and timezone.',
            },
          });
        }
        const userId = request.authUser._id ?? request.authUser.id;
        const event = await CalendarEventModel.create({
          ...eventInput,
          organizationId: request.organization._id,
          createdBy: userId,
          updatedBy: userId,
        });
        return response.status(201).json({ data: { event: serializeCalendarEvent(event) } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.patch(
    '/api/v1/organizations/:organizationId/calendar-events/:eventId',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        if (!mongoose.isValidObjectId(request.params.eventId)) {
          return response.status(404).json({
            error: { code: 'CALENDAR_EVENT_NOT_FOUND', message: 'Calendar event not found.' },
          });
        }
        const event = await CalendarEventModel.findOne({
          _id: request.params.eventId,
          organizationId: request.organization._id,
          archivedAt: null,
        });
        if (!event) {
          return response.status(404).json({
            error: { code: 'CALENDAR_EVENT_NOT_FOUND', message: 'Calendar event not found.' },
          });
        }

        const updatedFields = validateCalendarEventInput(request.body ?? {}, {
          partial: true,
          current: event,
        });
        if (!updatedFields) {
          return response.status(400).json({
            error: {
              code: 'INVALID_CALENDAR_EVENT',
              message: 'Only valid calendar event fields may be updated.',
            },
          });
        }
        event.set({
          ...updatedFields,
          updatedBy: request.authUser._id ?? request.authUser.id,
        });
        await event.save();
        return response.status(200).json({ data: { event: serializeCalendarEvent(event) } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/calendar-events/:eventId/publish',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        if (
          !mongoose.isValidObjectId(request.params.eventId) ||
          Object.keys(request.body ?? {}).length > 0
        ) {
          return response.status(400).json({
            error: { code: 'INVALID_CALENDAR_EVENT', message: 'This publish request is invalid.' },
          });
        }
        const event = await CalendarEventModel.findOneAndUpdate(
          {
            _id: request.params.eventId,
            organizationId: request.organization._id,
            archivedAt: null,
          },
          {
            $set: {
              status: 'PUBLISHED',
              updatedBy: request.authUser._id ?? request.authUser.id,
            },
          },
          { returnDocument: 'after', runValidators: true }
        );
        if (!event) {
          return response.status(404).json({
            error: { code: 'CALENDAR_EVENT_NOT_FOUND', message: 'Calendar event not found.' },
          });
        }
        return response.status(200).json({ data: { event: serializeCalendarEvent(event) } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.post(
    '/api/v1/organizations/:organizationId/calendar-events/:eventId/archive',
    requireTrustedOrigin,
    requireDatabase,
    authenticate,
    requireOrganizationOwner,
    async (request, response, next) => {
      try {
        if (
          !mongoose.isValidObjectId(request.params.eventId) ||
          Object.keys(request.body ?? {}).length > 0
        ) {
          return response.status(400).json({
            error: { code: 'INVALID_CALENDAR_EVENT', message: 'This archive request is invalid.' },
          });
        }
        const result = await CalendarEventModel.updateOne(
          {
            _id: request.params.eventId,
            organizationId: request.organization._id,
            archivedAt: null,
          },
          {
            $set: {
              archivedAt: new Date(),
              updatedBy: request.authUser._id ?? request.authUser.id,
            },
          }
        );
        if (result.matchedCount !== 1) {
          return response.status(404).json({
            error: { code: 'CALENDAR_EVENT_NOT_FOUND', message: 'Calendar event not found.' },
          });
        }
        return response.status(200).json({ data: { status: 'archived' } });
      } catch (error) {
        return next(error);
      }
    }
  );

  app.get('/api/v1/health', (_request, response) => {
    response.status(200).json({ data: { status: 'ok' } });
  });

  app.get('/api/v1/ready', (_request, response) => {
    if (!isDatabaseReady()) {
      return response.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'The service is not ready to process data requests.',
        },
      });
    }

    return response.status(200).json({ data: { status: 'ready' } });
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({
      error: { code: 'NOT_FOUND', message: 'API endpoint not found.' },
    });
  });

  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' },
      });
    }

    if (response.headersSent) return;

    return response.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' },
    });
  });

  return app;
}

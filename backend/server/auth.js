import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_BYTES = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, PASSWORD_HASH_BYTES, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyPassword(password, encodedHash) {
  const [algorithm, n, r, p, saltValue, keyValue] = encodedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    n !== '16384' ||
    r !== '8' ||
    p !== '1' ||
    !saltValue ||
    !keyValue
  ) {
    return false;
  }

  const salt = Buffer.from(saltValue, 'base64url');
  const expectedKey = Buffer.from(keyValue, 'base64url');
  if (expectedKey.length !== PASSWORD_HASH_BYTES) return false;

  const derivedKey = await scrypt(password, salt, PASSWORD_HASH_BYTES, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return timingSafeEqual(derivedKey, expectedKey);
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function readSessionCookie(cookieHeader, cookieName) {
  if (!cookieHeader) return null;

  for (const entry of cookieHeader.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0 || entry.slice(0, separator).trim() !== cookieName) continue;

    const value = entry.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
  }
  return null;
}

export function setSessionCookie(response, token, { secure, cookieName, maxAge }) {
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
}

export function clearSessionCookie(response, { secure, cookieName }) {
  response.clearCookie(cookieName, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
  });
}

export function serializeUser(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    phone: user.phone ?? '',
    institutionName: user.institutionName ?? '',
    department: user.department ?? '',
    program: user.program ?? '',
    enrollmentNumber: user.enrollmentNumber ?? '',
    createdAt: user.createdAt,
  };
}

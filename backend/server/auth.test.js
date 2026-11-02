import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  readSessionCookie,
  verifyPassword,
} from './auth.js';
import { createApp } from './app.js';

class TestUserModel {
  static users = new Map();
  static nextId = 1;

  static async create(fields) {
    if (this.users.has(fields.email)) {
      const error = new Error('Duplicate key');
      error.code = 11000;
      throw error;
    }

    const user = {
      _id: String(this.nextId++),
      emailVerifiedAt: null,
      ...fields,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    this.users.set(user.email, user);
    return user;
  }

  static findOne({ email }) {
    const user = this.users.get(email) ?? null;
    return {
      select: async () => user,
      then: (resolve, reject) => Promise.resolve(user).then(resolve, reject),
    };
  }

  static async findById(id) {
    return [...this.users.values()].find((user) => user._id === String(id)) ?? null;
  }

  static async findByIdAndUpdate(id, update) {
    const user = await this.findById(id);
    if (!user) return null;
    Object.assign(user, update.$set);
    return user;
  }

  static async updateOne(filter, update) {
    const user = await this.findById(filter._id);
    if (!user || Object.entries(filter).some(([field, value]) => user[field] !== value)) {
      return { matchedCount: 0 };
    }
    Object.assign(user, update.$set);
    return { matchedCount: 1 };
  }
}

class TestEmailVerificationModel {
  static verifications = new Map();
  static nextId = 1;

  static async findOneAndUpdate({ userId }, update) {
    const verification = {
      _id: String(this.nextId++),
      userId,
      ...update.$set,
    };
    this.verifications.set(userId, verification);
    return verification;
  }

  static async findOneAndDelete({ tokenHash, expiresAt }) {
    const [userId, verification] = [...this.verifications.entries()].find(
      ([, candidate]) =>
        candidate.tokenHash === tokenHash && candidate.expiresAt > expiresAt.$gt
    ) ?? [];
    if (!verification) return null;
    this.verifications.delete(userId);
    return verification;
  }

  static async deleteOne({ _id, tokenHash }) {
    if (_id === undefined && tokenHash === undefined) {
      return { deletedCount: 0 };
    }
    const entry = [...this.verifications.entries()].find(
      ([, verification]) => verification._id === _id && verification.tokenHash === tokenHash
    );
    if (!entry) return { deletedCount: 0 };
    this.verifications.delete(entry[0]);
    return { deletedCount: 1 };
  }
}

class TestPasswordResetModel {
  static resets = new Map();
  static nextId = 1;

  static async findOneAndUpdate({ userId }, update) {
    const reset = { _id: String(this.nextId++), userId, ...update.$set };
    this.resets.set(userId, reset);
    return reset;
  }

  static async findOneAndDelete({ tokenHash, expiresAt }) {
    const [userId, reset] = [...this.resets.entries()].find(
      ([, candidate]) => candidate.tokenHash === tokenHash && candidate.expiresAt > expiresAt.$gt
    ) ?? [];
    if (!reset) return null;
    this.resets.delete(userId);
    return reset;
  }

  static async deleteOne({ _id, tokenHash }) {
    const entry = [...this.resets.entries()].find(
      ([, reset]) => reset._id === _id && reset.tokenHash === tokenHash
    );
    if (!entry) return { deletedCount: 0 };
    this.resets.delete(entry[0]);
    return { deletedCount: 1 };
  }
}

class TestSessionModel {
  static sessions = new Map();

  static async create(session) {
    const storedSession = {
      _id: String(this.sessions.size + 1),
      createdAt: new Date(),
      ...session,
    };
    this.sessions.set(session.tokenHash, storedSession);
    return storedSession;
  }

  static async findOne({ tokenHash, expiresAt }) {
    const session = this.sessions.get(tokenHash);
    return session && session.expiresAt > expiresAt.$gt ? session : null;
  }

  static async deleteOne({ tokenHash }) {
    return { deletedCount: Number(this.sessions.delete(tokenHash)) };
  }

  static find({ userId, expiresAt }) {
    const query = {
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () =>
        [...TestSessionModel.sessions.values()].filter(
          (session) => session.userId === userId && session.expiresAt > expiresAt.$gt
        ),
    };
    return query;
  }

  static async deleteMany({ userId, tokenHash }) {
    let deletedCount = 0;
    for (const [hash, session] of this.sessions) {
      if (session.userId === userId && hash !== tokenHash?.$ne) {
        this.sessions.delete(hash);
        deletedCount += 1;
      }
    }
    return { deletedCount };
  }

  static async updateOne(filter, update) {
    const session = this.sessions.get(filter.tokenHash);
    if (
      !session ||
      session._id !== filter._id ||
      session.userId !== filter.userId ||
      session.expiresAt <= filter.expiresAt.$gt
    ) {
      return { modifiedCount: 0 };
    }

    this.sessions.delete(filter.tokenHash);
    Object.assign(session, update.$set);
    this.sessions.set(session.tokenHash, session);
    return { modifiedCount: 1 };
  }
}

async function withServer(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function sessionCookie(response) {
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  return setCookie.match(/attendqr_session=([^;]+)/)?.[1];
}

test('password hashes are salted and verify without storing plaintext', async () => {
  const password = 'correct-horse-battery';
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.notEqual(firstHash, secondHash);
  assert.equal(firstHash.includes(password), false);
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword('incorrect-password', firstHash), false);
});

test('session tokens are random and cookie parsing rejects malformed tokens', () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.notEqual(first, second);
  assert.equal(hashSessionToken(first).length, 64);
  assert.equal(readSessionCookie(`other=ignored; attendqr_session=${first}`, 'attendqr_session'), first);
  assert.equal(readSessionCookie('attendqr_session=bad', 'attendqr_session'), null);
});

test('registration assigns only the least-privileged role and sessions can be revoked', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  const app = createApp({
    isDatabaseReady: () => true,
    models: { User: TestUserModel, Session: TestSessionModel },
  });

  await withServer(app, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'STUDENT@example.edu',
        password: 'correct-horse-battery',
        phone: '+91 98765 43210',
        institutionName: 'Example University',
        department: 'Computer Science',
        program: 'B.Tech',
        enrollmentNumber: '24CSE001',
      }),
    });
    assert.equal(registration.status, 201);
    const registeredBody = await registration.json();
    assert.equal(registeredBody.data.user.role, 'STUDENT');
    assert.equal('passwordHash' in registeredBody.data.user, false);
    assert.equal(registeredBody.data.user.phone, '+919876543210');
    assert.equal(registeredBody.data.user.institutionName, 'Example University');
    assert.equal(registeredBody.data.user.department, 'Computer Science');
    assert.equal(registeredBody.data.user.program, 'B.Tech');
    assert.equal(registeredBody.data.user.enrollmentNumber, '24CSE001');
    assert.equal(registeredBody.data.user.emailVerified, false);
    const cookie = sessionCookie(registration);
    assert.ok(cookie);

    const currentUser = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `attendqr_session=${cookie}` },
    });
    assert.equal(currentUser.status, 200);
    assert.equal((await currentUser.json()).data.user.email, 'student@example.edu');

    const logout = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `attendqr_session=${cookie}` },
    });
    assert.equal(logout.status, 200);

    const revokedSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `attendqr_session=${cookie}` },
    });
    assert.equal(revokedSession.status, 401);
  });
});

test('users can list and revoke only their other active sessions', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  const app = createApp({
    isDatabaseReady: () => true,
    allowedOrigins: ['http://localhost:3000'],
    models: { User: TestUserModel, Session: TestSessionModel },
  });

  await withServer(app, async (baseUrl) => {
    const register = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Session Owner',
        email: 'sessions@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const primaryCookie = `attendqr_session=${sessionCookie(register)}`;
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sessions@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const currentCookie = `attendqr_session=${sessionCookie(login)}`;

    const sessionsResponse = await fetch(`${baseUrl}/api/v1/auth/sessions`, {
      headers: { Cookie: currentCookie },
    });
    assert.equal(sessionsResponse.status, 200);
    const listedSessions = (await sessionsResponse.json()).data.sessions;
    assert.equal(listedSessions.length, 2);
    assert.equal(listedSessions.filter((session) => session.current).length, 1);
    assert.equal('tokenHash' in listedSessions[0], false);

    const revokeResponse = await fetch(`${baseUrl}/api/v1/auth/sessions/revoke-others`, {
      method: 'POST',
      headers: { Cookie: currentCookie, Origin: 'http://localhost:3000' },
    });
    assert.equal(revokeResponse.status, 200);
    assert.equal((await revokeResponse.json()).data.revokedCount, 1);

    const otherSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: primaryCookie },
    });
    assert.equal(otherSession.status, 401);
    const currentSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: currentCookie },
    });
    assert.equal(currentSession.status, 200);
  });
});

test('session renewal rotates the cookie and invalidates the old token', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  const app = createApp({
    isDatabaseReady: () => true,
    allowedOrigins: ['http://localhost:3000'],
    models: { User: TestUserModel, Session: TestSessionModel },
  });

  await withServer(app, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Renewal Student',
        email: 'renewal@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const oldToken = sessionCookie(registration);
    const renewal = await fetch(`${baseUrl}/api/v1/auth/session/renew`, {
      method: 'POST',
      headers: {
        Cookie: `attendqr_session=${oldToken}`,
        Origin: 'http://localhost:3000',
      },
    });

    assert.equal(renewal.status, 200);
    const renewalBody = await renewal.json();
    assert.ok(Date.parse(renewalBody.data.expiresAt) > Date.now());
    const newToken = sessionCookie(renewal);
    assert.notEqual(newToken, oldToken);

    const oldSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `attendqr_session=${oldToken}` },
    });
    const renewedSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: `attendqr_session=${newToken}` },
    });
    assert.equal(oldSession.status, 401);
    assert.equal(renewedSession.status, 200);
  });
});

test('registration rejects role escalation and weak passwords', async () => {
  TestUserModel.users.clear();
  const app = createApp({
    isDatabaseReady: () => true,
    models: { User: TestUserModel, Session: TestSessionModel },
  });

  await withServer(app, async (baseUrl) => {
    for (const body of [
      { name: 'Admin', email: 'admin@example.edu', password: 'correct-horse-battery', role: 'ADMIN' },
      { name: 'Student', email: 'student@example.edu', password: 'short' },
      {
        name: 'Student',
        email: 'bad-phone@example.edu',
        password: 'correct-horse-battery',
        phone: '123',
      },
      {
        name: 'Student',
        email: 'unknown-field@example.edu',
        password: 'correct-horse-battery',
        isAdmin: true,
      },
    ]) {
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, 'INVALID_REGISTRATION');
    }
  });
});

test('email verification tokens are stored as hashes and can only be used once', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  TestEmailVerificationModel.verifications.clear();
  let deliveredToken;
  const app = createApp({
    isDatabaseReady: () => true,
    models: {
      User: TestUserModel,
      Session: TestSessionModel,
      EmailVerification: TestEmailVerificationModel,
    },
    sendEmailVerification: async ({ to, name, token }) => {
      assert.equal(to, 'verified@example.edu');
      assert.equal(name, 'Email Owner');
      deliveredToken = token;
    },
  });

  await withServer(app, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Email Owner',
        email: 'verified@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const registrationBody = await registration.json();
    const cookie = `attendqr_session=${sessionCookie(registration)}`;

    const requested = await fetch(`${baseUrl}/api/v1/auth/email-verification/request`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(requested.status, 202);
    const requestedBody = await requested.json();
    assert.deepEqual(requestedBody.data, { status: 'verification_sent' });
    assert.ok(deliveredToken);
    assert.equal(requested.headers.get('set-cookie'), null);
    assert.equal(JSON.stringify(requestedBody).includes(deliveredToken), false);

    const savedVerification = TestEmailVerificationModel.verifications.get(
      registrationBody.data.user.id
    );
    assert.equal(savedVerification.tokenHash, hashSessionToken(deliveredToken));
    assert.ok(savedVerification.expiresAt > new Date());

    const confirmation = await fetch(`${baseUrl}/api/v1/auth/email-verification/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: deliveredToken }),
    });
    assert.equal(confirmation.status, 200);
    assert.deepEqual((await confirmation.json()).data, { status: 'verified' });

    const replay = await fetch(`${baseUrl}/api/v1/auth/email-verification/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: deliveredToken }),
    });
    assert.equal(replay.status, 400);

    const currentUser = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Cookie: cookie },
    });
    assert.equal((await currentUser.json()).data.user.emailVerified, true);
  });
});

test('expired email verification token cannot verify an account', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  TestEmailVerificationModel.verifications.clear();
  let deliveredToken;
  const app = createApp({
    isDatabaseReady: () => true,
    models: {
      User: TestUserModel,
      Session: TestSessionModel,
      EmailVerification: TestEmailVerificationModel,
    },
    sendEmailVerification: async ({ token }) => {
      deliveredToken = token;
    },
  });

  await withServer(app, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Expired Token',
        email: 'expired@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const registrationBody = await registration.json();
    const request = await fetch(`${baseUrl}/api/v1/auth/email-verification/request`, {
      method: 'POST',
      headers: {
        Cookie: `attendqr_session=${sessionCookie(registration)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.equal(request.status, 202);
    const verification = TestEmailVerificationModel.verifications.get(
      registrationBody.data.user.id
    );
    verification.expiresAt = new Date(Date.now() - 1);

    const confirmation = await fetch(`${baseUrl}/api/v1/auth/email-verification/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: deliveredToken }),
    });
    assert.equal(confirmation.status, 400);
    assert.equal(
      TestUserModel.users.get('expired@example.edu').emailVerifiedAt,
      null
    );
  });
});

test('email verification reports unavailable delivery and does not leave a usable token', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  TestEmailVerificationModel.verifications.clear();
  const app = createApp({
    isDatabaseReady: () => true,
    models: {
      User: TestUserModel,
      Session: TestSessionModel,
      EmailVerification: TestEmailVerificationModel,
    },
    sendEmailVerification: async () => {
      throw new Error('SMTP unavailable');
    },
  });

  await withServer(app, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unavailable Mail',
        email: 'unavailable@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const request = await fetch(`${baseUrl}/api/v1/auth/email-verification/request`, {
      method: 'POST',
      headers: {
        Cookie: `attendqr_session=${sessionCookie(registration)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    assert.equal(request.status, 503);
    assert.equal((await request.json()).error.code, 'EMAIL_DELIVERY_UNAVAILABLE');
    assert.equal(TestEmailVerificationModel.verifications.size, 0);
  });
});

  test('password reset is generic for unknown emails and revokes sessions after a one-time reset', async () => {
    TestUserModel.users.clear();
    TestSessionModel.sessions.clear();
    TestEmailVerificationModel.verifications.clear();
    TestPasswordResetModel.resets.clear();
    let deliveredToken;
    const app = createApp({
      isDatabaseReady: () => true,
      allowedOrigins: ['http://localhost:3000'],
      models: {
        User: TestUserModel,
        Session: TestSessionModel,
        EmailVerification: TestEmailVerificationModel,
        PasswordReset: TestPasswordResetModel,
      },
      sendPasswordResetEmail: async ({ to, token }) => {
        assert.equal(to, 'reset@example.edu');
        deliveredToken = token;
      },
    });

    await withServer(app, async (baseUrl) => {
      const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Reset Owner',
          email: 'reset@example.edu',
          password: 'original-password-123',
        }),
      });
      const currentSessionCookie = `attendqr_session=${sessionCookie(registration)}`;
      const accountId = (await registration.json()).data.user.id;

      const requestReset = async (email) =>
        fetch(`${baseUrl}/api/v1/auth/password-reset/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'http://localhost:3000',
          },
          body: JSON.stringify({ email }),
        });

      const knownAccountResponse = await requestReset('reset@example.edu');
      const unknownAccountResponse = await requestReset('nobody@example.edu');
      assert.equal(knownAccountResponse.status, 202);
      assert.equal(unknownAccountResponse.status, 202);
      assert.deepEqual(await knownAccountResponse.json(), await unknownAccountResponse.json());
      assert.ok(deliveredToken);
      assert.equal(
        TestPasswordResetModel.resets.get(accountId).tokenHash,
        hashSessionToken(deliveredToken)
      );

      const reset = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify({ token: deliveredToken, password: 'replacement-password-456' }),
      });
      assert.equal(reset.status, 200);
      assert.equal(TestSessionModel.sessions.size, 0);

      const replay = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: deliveredToken, password: 'another-password-789' }),
      });
      assert.equal(replay.status, 400);

      const oldSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Cookie: currentSessionCookie },
      });
      assert.equal(oldSession.status, 401);

      const oldPasswordLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'reset@example.edu', password: 'original-password-123' }),
      });
      const newPasswordLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'reset@example.edu', password: 'replacement-password-456' }),
      });
      assert.equal(oldPasswordLogin.status, 401);
      assert.equal(newPasswordLogin.status, 200);
    });
  });

  test('password reset rejects expired tokens and weak passwords', async () => {
    TestUserModel.users.clear();
    TestSessionModel.sessions.clear();
    TestPasswordResetModel.resets.clear();
    let deliveredToken;
    const app = createApp({
      isDatabaseReady: () => true,
      allowedOrigins: ['http://localhost:3000'],
      models: {
        User: TestUserModel,
        Session: TestSessionModel,
        EmailVerification: TestEmailVerificationModel,
        PasswordReset: TestPasswordResetModel,
      },
      sendPasswordResetEmail: async ({ token }) => {
        deliveredToken = token;
      },
    });

    await withServer(app, async (baseUrl) => {
      const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Expired Reset',
          email: 'expired-reset@example.edu',
          password: 'original-password-123',
        }),
      });
      const accountId = (await registration.json()).data.user.id;
      await fetch(`${baseUrl}/api/v1/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'expired-reset@example.edu' }),
      });
      TestPasswordResetModel.resets.get(accountId).expiresAt = new Date(Date.now() - 1);

      const expiredToken = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: deliveredToken, password: 'replacement-password-456' }),
      });
      assert.equal(expiredToken.status, 400);

      const weakPassword = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: createSessionToken(), password: 'short' }),
      });
      assert.equal(weakPassword.status, 400);
      assert.equal(TestUserModel.users.get('expired-reset@example.edu').passwordHash.startsWith('scrypt$'), true);
    });
  });


test('profile updates persist validated claims without allowing account privilege changes', async () => {
  TestUserModel.users.clear();
  TestSessionModel.sessions.clear();
  const app = createApp({
    isDatabaseReady: () => true,
    models: { User: TestUserModel, Session: TestSessionModel },
  });

  await withServer(app, async (baseUrl) => {
    const registration = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'profile@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    const cookie = sessionCookie(registration);
    const headers = {
      'Content-Type': 'application/json',
      Cookie: `attendqr_session=${cookie}`,
    };

    const update = await fetch(`${baseUrl}/api/v1/auth/me`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        name: 'Updated Student',
        phone: '+91 98765 43210',
        institutionName: ' Example University ',
        enrollmentNumber: '24cse001',
      }),
    });
    assert.equal(update.status, 200);
    const updatedUser = (await update.json()).data.user;
    assert.equal(updatedUser.name, 'Updated Student');
    assert.equal(updatedUser.phone, '+919876543210');
    assert.equal(updatedUser.institutionName, 'Example University');
    assert.equal(updatedUser.enrollmentNumber, '24CSE001');
    assert.equal(updatedUser.role, 'STUDENT');
    assert.equal('passwordHash' in updatedUser, false);

    const currentUser = await fetch(`${baseUrl}/api/v1/auth/me`, { headers });
    assert.equal((await currentUser.json()).data.user.name, 'Updated Student');

    for (const body of [
      { name: 'A' },
      { phone: '123abc9876543210' },
      { role: 'ADMIN' },
      { email: 'attacker@example.edu' },
      {},
    ]) {
      const invalid = await fetch(`${baseUrl}/api/v1/auth/me`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
      assert.equal(invalid.status, 400);
      assert.equal((await invalid.json()).error.code, 'INVALID_PROFILE');
    }

    const unauthenticated = await fetch(`${baseUrl}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Session' }),
    });
    assert.equal(unauthenticated.status, 401);
  });
});

test('authentication mutations reject browser requests from untrusted origins', async () => {
  const app = createApp({
    allowedOrigins: ['https://attend.example'],
    isDatabaseReady: () => true,
    models: { User: TestUserModel, Session: TestSessionModel },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Origin: 'https://untrusted.example' },
    });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, 'UNTRUSTED_ORIGIN');
  });
});

test('authentication endpoints refuse work while the database is unavailable', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        email: 'student@example.edu',
        password: 'correct-horse-battery',
      }),
    });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'DATABASE_UNAVAILABLE');
  });
});

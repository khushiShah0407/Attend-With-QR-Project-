import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { CalendarEvent } from './models/CalendarEvent.js';
import { Department } from './models/Department.js';
import { EmailVerification } from './models/EmailVerification.js';
import { Organization } from './models/Organization.js';
import { OrganizationInvitation } from './models/OrganizationInvitation.js';
import { OrganizationMember } from './models/OrganizationMember.js';
import { PasswordReset } from './models/PasswordReset.js';
import { Session } from './models/Session.js';
import { User } from './models/User.js';

function isolatedTestUri(baseUri) {
  const uri = new URL(baseUri);
  uri.pathname = `/attend_with_qr_test_${randomUUID().replaceAll('-', '')}`;
  return uri.toString();
}

async function withServer(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test(
  'MongoDB auth, organization, and department flows enforce tenant isolation',
  { skip: !process.env.MONGODB_TEST_URI },
  async () => {
    const uri = isolatedTestUri(process.env.MONGODB_TEST_URI);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      await Promise.all([
        User.init(),
        Session.init(),
        Organization.init(),
        OrganizationInvitation.init(),
        OrganizationMember.init(),
        Department.init(),
        CalendarEvent.init(),
        EmailVerification.init(),
        PasswordReset.init(),
      ]);

      let verificationToken;
      let passwordResetToken;
      let organizationInvitationToken;
      let revokedInvitationToken;
      let reactivationInvitationToken;
      const app = createApp({
        isDatabaseReady: () => mongoose.connection.readyState === 1,
        sendEmailVerification: async ({ token }) => {
          verificationToken = token;
        },
        sendPasswordResetEmail: async ({ token }) => {
          passwordResetToken = token;
        },
        sendOrganizationInvitation: async ({ token, to, organizationName, role }) => {
          assert.equal(organizationName, 'College A');
          if (to === 'faculty-a@example.test' && role === 'FACULTY') {
            organizationInvitationToken = token;
          } else if (to === 'faculty-a@example.test' && role === 'TEACHER') {
            reactivationInvitationToken = token;
          } else if (to === 'owner-b@example.test' && role === 'STUDENT') {
            revokedInvitationToken = token;
          } else if (to === 'delivery-failure@example.test') {
            throw new Error('SMTP unavailable');
          } else {
            assert.fail('Unexpected organization invitation email.');
          }
        },
      });

      await withServer(app, async (baseUrl) => {
        async function register(email, name, profile = {}) {
          const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              password: 'a-long-test-password',
              ...profile,
            }),
          });
          assert.equal(response.status, 201);
          const registered = await response.json();
          const token = response.headers.get('set-cookie').match(/attendqr_session=([^;]+)/)?.[1];
          assert.ok(token);
          return {
            cookie: `attendqr_session=${token}`,
            user: registered.data.user,
          };
        }

        async function createOrganization(cookie, name) {
          const response = await fetch(`${baseUrl}/api/v1/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie },
            body: JSON.stringify({ name }),
          });
          assert.equal(response.status, 201);
          return (await response.json()).data.organization.id;
        }

        const ownerRegistration = await register('owner-a@example.test', 'Owner A', {
          phone: '+91 98765 43210',
          institutionName: 'College A',
          department: 'Computer Science',
          program: 'B.Tech',
          enrollmentNumber: '24CS001',
        });
        const ownerCookie = ownerRegistration.cookie;
        const otherCookie = (await register('owner-b@example.test', 'Owner B')).cookie;
        assert.equal(ownerRegistration.user.phone, '+919876543210');
        assert.equal(ownerRegistration.user.institutionName, 'College A');
        assert.equal(ownerRegistration.user.department, 'Computer Science');
        assert.equal(ownerRegistration.user.program, 'B.Tech');
        assert.equal(ownerRegistration.user.enrollmentNumber, '24CS001');
        const persistedProfile = await User.findOne({ email: 'owner-a@example.test' }).lean();
        assert.equal(persistedProfile.institutionName, 'College A');
        assert.equal(persistedProfile.emailVerifiedAt, null);
        const profileUpdate = await fetch(`${baseUrl}/api/v1/auth/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: ownerCookie,
          },
          body: JSON.stringify({
            name: 'Owner A Updated',
            department: 'Computer Engineering',
            enrollmentNumber: '24ce001',
          }),
        });
        assert.equal(profileUpdate.status, 200);
        assert.equal((await profileUpdate.json()).data.user.name, 'Owner A Updated');
        const restoredProfile = await fetch(`${baseUrl}/api/v1/auth/me`, {
          headers: { Cookie: ownerCookie },
        });
        assert.equal((await restoredProfile.json()).data.user.department, 'Computer Engineering');
        const updatedProfileRecord = await User.findOne({ email: 'owner-a@example.test' }).lean();
        assert.equal(updatedProfileRecord.enrollmentNumber, '24CE001');

        const unverifiedOrganization = await fetch(`${baseUrl}/api/v1/organizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
          body: JSON.stringify({ name: 'Unverified College' }),
        });
        assert.equal(unverifiedOrganization.status, 403);
        const verificationRequest = await fetch(
          `${baseUrl}/api/v1/auth/email-verification/request`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: ownerCookie,
            },
            body: JSON.stringify({}),
          }
        );
        assert.equal(verificationRequest.status, 202);
        assert.ok(verificationToken);
        const storedVerification = await EmailVerification.findOne({
          userId: (await User.findOne({ email: 'owner-a@example.test' }))._id,
        })
          .select('+tokenHash')
          .lean();
        assert.ok(storedVerification);
        assert.notEqual(storedVerification.tokenHash, verificationToken);
        const verified = await fetch(
          `${baseUrl}/api/v1/auth/email-verification/confirm`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verificationToken }),
          }
        );
        assert.equal(verified.status, 200);
        const verificationReplay = await fetch(
          `${baseUrl}/api/v1/auth/email-verification/confirm`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verificationToken }),
          }
        );
        assert.equal(verificationReplay.status, 400);
        await User.updateOne(
          { email: 'owner-b@example.test' },
          { $set: { emailVerifiedAt: new Date() } }
        );
        const organizationId = await createOrganization(ownerCookie, 'College A');
        await createOrganization(otherCookie, 'College B');

        const invitee = await register('faculty-a@example.test', 'Invited Faculty');
        const unverifiedInviteeAcceptance = await fetch(
          `${baseUrl}/api/v1/organization-invitations/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: invitee.cookie },
            body: JSON.stringify({ token: 'A'.repeat(43) }),
          }
        );
        assert.equal(unverifiedInviteeAcceptance.status, 403);
        await User.updateOne(
          { email: 'faculty-a@example.test' },
          { $set: { emailVerifiedAt: new Date() } }
        );

        const invitationResponse = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ email: 'FACULTY-A@example.test', role: 'FACULTY' }),
          }
        );
        assert.equal(invitationResponse.status, 202);
        assert.ok(organizationInvitationToken);
        const invalidRoleInvitation = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ email: 'faculty-a@example.test', role: 'OWNER' }),
          }
        );
        assert.equal(invalidRoleInvitation.status, 400);
        const failedDelivery = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ email: 'delivery-failure@example.test', role: 'STUDENT' }),
          }
        );
        assert.equal(failedDelivery.status, 503);
        const failedInvitationRecord = await OrganizationInvitation.findOne({
          organizationId,
          email: 'delivery-failure@example.test',
        }).lean();
        assert.equal(failedInvitationRecord.status, 'REVOKED');
        const crossTenantInviteCreate = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: otherCookie },
            body: JSON.stringify({ email: 'faculty-a@example.test', role: 'FACULTY' }),
          }
        );
        assert.equal(crossTenantInviteCreate.status, 404);
        const invitation = (await invitationResponse.json()).data.invitation;
        const persistedInvitation = await OrganizationInvitation.findById(invitation.id)
          .select('+tokenHash')
          .lean();
        assert.notEqual(persistedInvitation.tokenHash, organizationInvitationToken);
        const ownerInvitationList = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          { headers: { Cookie: ownerCookie } }
        );
        assert.equal(ownerInvitationList.status, 200);
        const safeInvitation = (await ownerInvitationList.json()).data.invitations.find(
          (record) => record.id === invitation.id
        );
        assert.ok(safeInvitation);
        assert.equal(safeInvitation.email, 'faculty-a@example.test');
        assert.equal('tokenHash' in safeInvitation, false);
        const crossTenantInvitationList = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          { headers: { Cookie: otherCookie } }
        );
        assert.equal(crossTenantInvitationList.status, 404);

        const wrongAccountAcceptance = await fetch(
          `${baseUrl}/api/v1/organization-invitations/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: otherCookie },
            body: JSON.stringify({ token: organizationInvitationToken }),
          }
        );
        assert.equal(wrongAccountAcceptance.status, 400);

        const acceptedInvitation = await fetch(
          `${baseUrl}/api/v1/organization-invitations/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: invitee.cookie },
            body: JSON.stringify({ token: organizationInvitationToken }),
          }
        );
        assert.equal(acceptedInvitation.status, 200);
        assert.deepEqual((await acceptedInvitation.json()).data.organization, {
          id: organizationId,
          name: 'College A',
          slug: (await Organization.findById(organizationId)).slug,
          role: 'FACULTY',
        });
        const persistedMember = await OrganizationMember.findOne({
          organizationId,
          userId: invitee.user.id,
        }).lean();
        assert.equal(persistedMember.role, 'FACULTY');
        assert.equal((await User.findById(invitee.user.id)).role, 'STUDENT');

        const ownerMembers = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/members`,
          { headers: { Cookie: ownerCookie } }
        );
        assert.equal(ownerMembers.status, 200);
        const listedMember = (await ownerMembers.json()).data.members.find(
          (member) => member.id === String(persistedMember._id)
        );
        assert.equal(listedMember.email, 'faculty-a@example.test');
        const crossTenantMembers = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/members`,
          { headers: { Cookie: otherCookie } }
        );
        assert.equal(crossTenantMembers.status, 404);

        const inviteeOrganizations = await fetch(`${baseUrl}/api/v1/organizations`, {
          headers: { Cookie: invitee.cookie },
        });
        assert.equal(inviteeOrganizations.status, 200);
        assert.equal(
          (await inviteeOrganizations.json()).data.organizations[0].role,
          'FACULTY'
        );
        const revokedMember = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/members/${persistedMember._id}/revoke`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({}),
          }
        );
        assert.equal(revokedMember.status, 200);
        assert.equal(
          (await OrganizationMember.findById(persistedMember._id)).status,
          'REVOKED'
        );
        const removedOrganization = await fetch(`${baseUrl}/api/v1/organizations`, {
          headers: { Cookie: invitee.cookie },
        });
        assert.deepEqual((await removedOrganization.json()).data.organizations, []);
        const reactivationInvitation = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ email: 'faculty-a@example.test', role: 'TEACHER' }),
          }
        );
        assert.equal(reactivationInvitation.status, 202);
        assert.ok(reactivationInvitationToken);
        const rejoined = await fetch(
          `${baseUrl}/api/v1/organization-invitations/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: invitee.cookie },
            body: JSON.stringify({ token: reactivationInvitationToken }),
          }
        );
        assert.equal(rejoined.status, 200);
        assert.equal((await rejoined.json()).data.organization.role, 'TEACHER');
        const reactivatedMember = await OrganizationMember.findById(persistedMember._id).lean();
        assert.equal(reactivatedMember.status, 'ACTIVE');
        assert.equal(reactivatedMember.role, 'TEACHER');
        const replayedInvitation = await fetch(
          `${baseUrl}/api/v1/organization-invitations/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: invitee.cookie },
            body: JSON.stringify({ token: organizationInvitationToken }),
          }
        );
        assert.equal(replayedInvitation.status, 400);

        const revocableInvitationResponse = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ email: 'owner-b@example.test', role: 'STUDENT' }),
          }
        );
        assert.equal(revocableInvitationResponse.status, 202);
        assert.ok(revokedInvitationToken);
        const revocableInvitation = (await revocableInvitationResponse.json()).data.invitation;
        const revokeInvitation = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/invitations/${revocableInvitation.id}/revoke`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({}),
          }
        );
        assert.equal(revokeInvitation.status, 200);
        const revokedAcceptance = await fetch(
          `${baseUrl}/api/v1/organization-invitations/accept`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: otherCookie },
            body: JSON.stringify({ token: revokedInvitationToken }),
          }
        );
        assert.equal(revokedAcceptance.status, 400);

        const createdDepartment = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/departments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ name: 'Computer Science', code: 'CS' }),
          }
        );
        assert.equal(createdDepartment.status, 201);
        const departmentId = (await createdDepartment.json()).data.department.id;

        const crossTenantRead = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/departments`,
          { headers: { Cookie: otherCookie } }
        );
        const crossTenantCreate = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/departments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: otherCookie },
            body: JSON.stringify({ name: 'Unauthorized', code: 'NO' }),
          }
        );
        const crossTenantArchive = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/departments/${departmentId}/archive`,
          { method: 'POST', headers: { Cookie: otherCookie } }
        );
        assert.deepEqual(
          [crossTenantRead.status, crossTenantCreate.status, crossTenantArchive.status],
          [404, 404, 404]
        );

        const duplicateCode = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/departments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
            body: JSON.stringify({ name: 'Computer Applications', code: 'CS' }),
          }
        );
        assert.equal(duplicateCode.status, 409);

        const archived = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}/departments/${departmentId}/archive`,
          { method: 'POST', headers: { Cookie: ownerCookie } }
        );
        assert.equal(archived.status, 200);

        const calendarUrl = `${baseUrl}/api/v1/organizations/${organizationId}/calendar-events`;
        const invalidCalendarEvent = await fetch(calendarUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
          body: JSON.stringify({
            title: 'State holiday',
            type: 'HOLIDAY',
            dayType: 'FULL_HOLIDAY',
            startAt: '2026-11-01T00:00:00.000Z',
            endAt: '2026-10-31T23:59:59.000Z',
            timezone: 'Not/A_Timezone',
          }),
        });
        assert.equal(invalidCalendarEvent.status, 400);

        const calendarCreate = await fetch(calendarUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
          body: JSON.stringify({
            title: 'College foundation day',
            description: 'Institutional holiday',
            type: 'HOLIDAY',
            dayType: 'FULL_HOLIDAY',
            startAt: '2026-11-01T00:00:00.000Z',
            endAt: '2026-11-02T00:00:00.000Z',
            timezone: 'Asia/Kolkata',
          }),
        });
        assert.equal(calendarCreate.status, 201);
        const calendarEventId = (await calendarCreate.json()).data.event.id;
        const draftList = await fetch(`${calendarUrl}?status=draft&page=1&limit=10`, {
          headers: { Cookie: ownerCookie },
        });
        assert.equal(draftList.status, 200);
        const drafts = (await draftList.json()).data;
        assert.equal(drafts.pagination.total, 1);
        assert.equal(drafts.events[0].status, 'DRAFT');

        const crossTenantCalendar = await fetch(calendarUrl, {
          headers: { Cookie: otherCookie },
        });
        const crossTenantUpdate = await fetch(`${calendarUrl}/${calendarEventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Cookie: otherCookie },
          body: JSON.stringify({ title: 'Unauthorized edit' }),
        });
        assert.deepEqual([crossTenantCalendar.status, crossTenantUpdate.status], [404, 404]);

        const published = await fetch(`${calendarUrl}/${calendarEventId}/publish`, {
          method: 'POST',
          headers: { Cookie: ownerCookie },
        });
        assert.equal(published.status, 200);
        assert.equal((await published.json()).data.event.status, 'PUBLISHED');

        const filteredList = await fetch(
          `${calendarUrl}?status=published&from=2026-11-01T12%3A00%3A00.000Z&to=2026-11-01T13%3A00%3A00.000Z`,
          { headers: { Cookie: ownerCookie } }
        );
        assert.equal(filteredList.status, 200);
        assert.equal((await filteredList.json()).data.pagination.total, 1);

        const archivedCalendarEvent = await fetch(`${calendarUrl}/${calendarEventId}/archive`, {
          method: 'POST',
          headers: { Cookie: ownerCookie },
        });
        assert.equal(archivedCalendarEvent.status, 200);
        const afterArchive = await fetch(calendarUrl, { headers: { Cookie: ownerCookie } });
        assert.equal((await afterArchive.json()).data.pagination.total, 0);

        const resetAccount = await register('password-reset@example.test', 'Reset Account');
        const passwordResetRequest = await fetch(
          `${baseUrl}/api/v1/auth/password-reset/request`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'password-reset@example.test' }),
          }
        );
        assert.equal(passwordResetRequest.status, 202);
        assert.ok(passwordResetToken);
        const savedPasswordReset = await PasswordReset.findOne({
          userId: resetAccount.user.id,
        })
          .select('+tokenHash')
          .lean();
        assert.ok(savedPasswordReset);
        assert.notEqual(savedPasswordReset.tokenHash, passwordResetToken);
        const passwordResetConfirmation = await fetch(
          `${baseUrl}/api/v1/auth/password-reset/confirm`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: passwordResetToken,
              password: 'a-new-secure-test-password',
            }),
          }
        );
        assert.equal(passwordResetConfirmation.status, 200);
        const oldResetSession = await fetch(`${baseUrl}/api/v1/auth/me`, {
          headers: { Cookie: resetAccount.cookie },
        });
        assert.equal(oldResetSession.status, 401);
        const resetPasswordLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'password-reset@example.test',
            password: 'a-new-secure-test-password',
          }),
        });
        assert.equal(resetPasswordLogin.status, 200);
      });
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
      }
      await mongoose.disconnect();
    }
  }
);

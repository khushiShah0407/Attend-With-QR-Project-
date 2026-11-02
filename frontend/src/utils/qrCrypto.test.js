import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRotatingToken,
  validateScannedToken,
  calculateGpsDistanceMeters,
  verifyCampusGeofence,
  calculateAttendancePercentage,
  checkThresholdStatus,
  calculateLecturesNeededForThreshold,
} from './qrCrypto.js';
import {
  validatePhoneNumber,
  validateEmail,
  validateOtp,
  validateRollNumber,
} from './validators.js';

test('QR Token generation is deterministic within time slot', () => {
  const fixedTime = 1700000000000;
  const token1 = generateRotatingToken('sess-1', 'AJR501', 15, fixedTime);
  const token2 = generateRotatingToken('sess-1', 'AJR501', 15, fixedTime + 3000);

  assert.equal(token1.token, token2.token);
  assert.ok(token1.token.startsWith('ATND-AJR501-'));
});

test('Validates token successfully and rejects stale tokens', () => {
  const now = Date.now();
  const current = generateRotatingToken('sess-1', 'AJR501', 15, now);
  const resultValid = validateScannedToken(current.token, 'sess-1', 'AJR501', 15, now);
  assert.equal(resultValid.valid, true);

  const stale = generateRotatingToken('sess-1', 'AJR501', 15, now - 60000);
  const resultStale = validateScannedToken(stale.token, 'sess-1', 'AJR501', 15, now);
  assert.equal(resultStale.valid, false);
});

test('Validates phone numbers and emails correctly', () => {
  const validPhone = validatePhoneNumber('9876543210');
  assert.equal(validPhone.isValid, true);
  assert.equal(validPhone.cleaned, '+91 98765 43210');

  const invalidPhone = validatePhoneNumber('12345');
  assert.equal(invalidPhone.isValid, false);

  const validEmail = validateEmail('aarav.mehta@college.edu');
  assert.equal(validEmail.isValid, true);

  const invalidEmail = validateEmail('not-an-email');
  assert.equal(invalidEmail.isValid, false);

  const validOtp = validateOtp('543210');
  assert.equal(validOtp.isValid, true);

  const invalidOtp = validateOtp('123');
  assert.equal(invalidOtp.isValid, false);

  const validRoll = validateRollNumber('22BCA047');
  assert.equal(validRoll.isValid, true);
});

test('Geofence calculation checks campus boundary', () => {
  const campusLat = 18.9902;
  const campusLng = 73.1277;

  const inside = verifyCampusGeofence(18.99025, 73.12775, campusLat, campusLng, 150);
  assert.equal(inside.inGeofence, true);
  assert.ok(inside.distanceMeters < 50);

  const outside = verifyCampusGeofence(19.01, 73.14, campusLat, campusLng, 150);
  assert.equal(outside.inGeofence, false);
});

/**
 * qrCrypto.js
 * Cryptographic and geofencing math utilities for AttendQR
 */

export function generateRotatingToken(
  sessionId,
  sessionCode,
  intervalSec = 15,
  currentTimeMs = Date.now()
) {
  const currentIntervalSlot = Math.floor(currentTimeMs / (intervalSec * 1000));
  const slotStartMs = currentIntervalSlot * intervalSec * 1000;
  const expiresAtMs = slotStartMs + intervalSec * 1000;
  const remainingSec = Math.max(0, Math.ceil((expiresAtMs - currentTimeMs) / 1000));

  // Deterministic signature hash simulation
  const payloadStr = `${sessionId}-${sessionCode}-slot-${currentIntervalSlot}-secretKeyPCE2026`;
  let hash = 0;
  for (let i = 0; i < payloadStr.length; i++) {
    const char = payloadStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const tokenHex = Math.abs(hash).toString(16).padStart(8, '0');
  const token = `ATND-${sessionCode}-${currentIntervalSlot}-${tokenHex}`;

  return { token, expiresAtMs, remainingSec };
}

export function validateScannedToken(
  scannedToken,
  sessionId,
  sessionCode,
  intervalSec = 15,
  currentTimeMs = Date.now()
) {
  if (!scannedToken || !scannedToken.startsWith('ATND-')) {
    return { valid: false, reason: 'Invalid token format. Not an AttendQR session code.' };
  }

  const currentSlot = Math.floor(currentTimeMs / (intervalSec * 1000));
  const previousSlot = currentSlot - 1; // 1-slot grace period for network delays

  const currentGen = generateRotatingToken(sessionId, sessionCode, intervalSec, currentTimeMs);
  const previousGen = generateRotatingToken(
    sessionId,
    sessionCode,
    intervalSec,
    previousSlot * intervalSec * 1000 + 100
  );

  if (scannedToken === currentGen.token || scannedToken === previousGen.token) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: 'This QR code has expired. Please scan the current rotating QR on the screen.',
  };
}

export function calculateGpsDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function verifyCampusGeofence(
  studentLat,
  studentLng,
  campusLat,
  campusLng,
  radiusMeters = 150
) {
  const distance = calculateGpsDistanceMeters(studentLat, studentLng, campusLat, campusLng);
  return {
    inGeofence: distance <= radiusMeters,
    distanceMeters: distance,
  };
}

export function calculateAttendancePercentage(presentCount, totalCount) {
  if (totalCount <= 0) return 100;
  return Math.round((presentCount / totalCount) * 100);
}

export function checkThresholdStatus(currentPercentage, threshold = 75) {
  return {
    isCompliant: currentPercentage >= threshold,
    diff: currentPercentage - threshold,
  };
}

export function calculateLecturesNeededForThreshold(
  attended,
  total,
  targetPercentage = 75
) {
  if (total <= 0) return 0;
  const targetRatio = targetPercentage / 100;
  const currentRatio = attended / total;

  if (currentRatio >= targetRatio) return 0;

  const numerator = targetRatio * total - attended;
  const denominator = 1 - targetRatio;
  return Math.max(1, Math.ceil(numerator / denominator));
}

const localApiBase =
  typeof window === 'undefined'
    ? 'http://localhost:4000/api/v1'
    : `http://${window.location.hostname}:4000/api/v1`;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || localApiBase).replace(/\/$/, '');

export async function apiRequest(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach Attend With QR. Check that the API service is running and try again.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an invalid response. Please try again.');
  }

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || `Request failed (${response.status}). Please try again.`
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }

  return payload.data;
}

export function toAppUser(apiUser) {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone || '',
    role: apiUser.role.toLowerCase(),
    collegeName: apiUser.institutionName || '',
    department: apiUser.department || '',
    program: apiUser.program || '',
    enrollmentNumber: apiUser.enrollmentNumber || '',
    emailVerified: Boolean(apiUser.emailVerified),
    phoneVerified: false,
    twoFactorEnabled: false,
    notificationPreferences: {
      emailDigests: true,
      lowAttendanceAlerts: true,
      sessionStarts: true,
      correctionUpdates: true,
    },
  };
}

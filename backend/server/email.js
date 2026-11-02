import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export async function sendEmailVerification({ to, name, token }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL } = process.env;
  const port = Number(SMTP_PORT);
  if (
    !SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !SMTP_FROM ||
    !FRONTEND_URL
  ) {
    throw new Error('Email verification delivery is not configured.');
  }

  let frontendUrl;
  try {
    frontendUrl = new URL(FRONTEND_URL);
  } catch {
    throw new Error('FRONTEND_URL must be an absolute URL.');
  }
  if (!['http:', 'https:'].includes(frontendUrl.protocol)) {
    throw new Error('FRONTEND_URL must use HTTP or HTTPS.');
  }

  const verificationUrl =
    `${frontendUrl.origin}/#verify-email?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Verify your Attend With QR email',
    text: `Hello ${name},\n\nVerify your email address using this link. It expires in 30 minutes:\n${verificationUrl}\n\nIf you did not create this account, you can ignore this message.`,
    html: `<p>Hello ${safeName},</p><p>Verify your email address using the link below. It expires in 30 minutes.</p><p><a href="${verificationUrl}">Verify email address</a></p><p>If you did not create this account, you can ignore this message.</p>`,
  });
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL } = process.env;
  const port = Number(SMTP_PORT);
  if (
    !SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !SMTP_FROM ||
    !FRONTEND_URL
  ) {
    throw new Error('Password reset email delivery is not configured.');
  }

  let frontendUrl;
  try {
    frontendUrl = new URL(FRONTEND_URL);
  } catch {
    throw new Error('FRONTEND_URL must be an absolute URL.');
  }
  if (!['http:', 'https:'].includes(frontendUrl.protocol)) {
    throw new Error('FRONTEND_URL must use HTTP or HTTPS.');
  }

  const resetUrl = `${frontendUrl.origin}/#reset-password?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Reset your Attend With QR password',
    text: `Hello ${name},\n\nUse this link to reset your password. It expires in 30 minutes:\n${resetUrl}\n\nIf you did not request a reset, you can ignore this message.`,
    html: `<p>Hello ${safeName},</p><p>Use the link below to reset your password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request a reset, you can ignore this message.</p>`,
  });
}

export async function sendOrganizationInvitation({ to, name, organizationName, role, token }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL } = process.env;
  const port = Number(SMTP_PORT);
  if (
    !SMTP_HOST ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !SMTP_FROM ||
    !FRONTEND_URL
  ) {
    throw new Error('Organization invitation delivery is not configured.');
  }

  let frontendUrl;
  try {
    frontendUrl = new URL(FRONTEND_URL);
  } catch {
    throw new Error('FRONTEND_URL must be an absolute URL.');
  }
  if (!['http:', 'https:'].includes(frontendUrl.protocol)) {
    throw new Error('FRONTEND_URL must use HTTP or HTTPS.');
  }

  const invitationUrl = `${frontendUrl.origin}/#accept-invitation?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name);
  const safeOrganizationName = escapeHtml(organizationName);
  const safeRole = escapeHtml(role.toLowerCase());
  await nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  }).sendMail({
    from: SMTP_FROM,
    to,
    subject: `Invitation to join ${organizationName} on Attend With QR`,
    text: `Hello ${name},\n\nYou have been invited to join ${organizationName} as ${role.toLowerCase()}. Sign in to your verified account and accept this invitation within 7 days:\n${invitationUrl}\n\nIf you were not expecting this invitation, you can ignore this message.`,
    html: `<p>Hello ${safeName},</p><p>You have been invited to join <strong>${safeOrganizationName}</strong> as ${safeRole}.</p><p><a href="${invitationUrl}">Review invitation</a></p><p>This link expires in 7 days. If you were not expecting this invitation, you can ignore this message.</p>`,
  });
}

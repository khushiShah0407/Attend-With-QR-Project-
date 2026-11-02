/**
 * validators.js
 * Comprehensive form and input validation suite for AttendQR
 */

export const validatePhoneNumber = (phone) => {
  if (!phone) return { isValid: false, message: 'Phone number is required.' };
  // Clean non-digits
  const digits = phone.replace(/\D/g, '');
  // Valid Indian mobile numbers are 10 digits (or 12 if including 91 country code)
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return { isValid: true, cleaned: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` };
  }
  if (digits.length === 12 && digits.startsWith('91') && /^91[6-9]\d{9}$/.test(digits)) {
    return { isValid: true, cleaned: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}` };
  }
  return {
    isValid: false,
    message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
  };
};

export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email address is required.' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Please enter a valid institutional or personal email address.' };
  }
  return { isValid: true, cleaned: email.trim().toLowerCase() };
};

export const validateOtp = (otp) => {
  if (!otp) return { isValid: false, message: 'Verification OTP is required.' };
  const cleanOtp = otp.toString().trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return { isValid: false, message: 'OTP must be exactly 6 numeric digits.' };
  }
  return { isValid: true, cleaned: cleanOtp };
};

export const validateRollNumber = (roll) => {
  if (!roll) return { isValid: false, message: 'Roll number / Enrollment ID is required.' };
  const trimmed = roll.trim().toUpperCase();
  if (trimmed.length < 4 || trimmed.length > 15) {
    return { isValid: false, message: 'Enrollment number must be between 4 and 15 characters (e.g. 22BCA047).' };
  }
  return { isValid: true, cleaned: trimmed };
};

export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Password is required.' };
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
};

export const validateRequiredText = (text, fieldName = 'This field', minLength = 2) => {
  if (!text || text.trim().length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters.` };
  }
  return { isValid: true, cleaned: text.trim() };
};

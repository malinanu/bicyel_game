export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  auth: {
    requestOtp: '/api/auth/request-otp',
    verifyOtp: '/api/auth/verify-otp',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
  },
  entries: {
    validateCode: '/api/entries/validate-code',
    create: '/api/entries',
    list: '/api/entries',
    checkDuplicate: '/api/entries/check-duplicate',
  },
} as const;

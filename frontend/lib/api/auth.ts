import { apiClient } from './client';
import type { OtpRequestPayload, OtpRequestResponse, OtpVerifyPayload, OtpVerifyResponse, User } from '@/lib/types/auth';

export const authApi = {
  requestOtp: async (data: OtpRequestPayload): Promise<OtpRequestResponse> => {
    const response = await apiClient.post('/auth/request-otp', data);
    return response.data;
  },

  verifyOtp: async (data: OtpVerifyPayload): Promise<OtpVerifyResponse> => {
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },
};

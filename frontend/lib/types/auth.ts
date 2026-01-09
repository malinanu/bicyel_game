export interface OtpRequestPayload {
  name: string;
  phone_number: string;
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  expires_in: number;
  dev_mode?: boolean;
  otp_code?: string;
}

export interface OtpVerifyPayload {
  phone_number: string;
  otp_code: string;
}

export interface User {
  id: number;
  name: string;
  phone_number: string;
  phone_verified_at: string | null;
  last_login_at: string | null;
  is_active: boolean;
  entry_count: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  user: User;
}

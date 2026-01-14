import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

// Types for API requests and responses
export interface OtpRequestData {
  name: string;
  phone_number: string;
  date_of_birth?: string;
}

export interface OtpVerifyData {
  phone_number: string;
  otp_code: string;
}

export interface CodeValidateData {
  code: string;
}

export interface User {
  id: number;
  name: string;
  phone_number: string;
  date_of_birth?: string;
  entry_count: number;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  user?: User;
}

export interface CodeValidateResponse {
  success: boolean;
  message: string;
  code_id: number | null;
}

export interface Entry {
  id: number;
  user_id: number;
  code_id: number;
  image_url: string;
  verified: boolean;
  fraud_score: number;
  review_status: string;
  created_at: string;
}

export interface EntryCreateResponse {
  success: boolean;
  message: string;
  entry: Entry;
  entries_remaining: number;
  warning?: string;
}

export interface EntryListResponse {
  success: boolean;
  entries: Entry[];
  total_entries: number;
  entries_remaining: number;
}

export interface DuplicateCheckResponse {
  is_duplicate: boolean;
  message: string;
}

// Storage keys
const TOKEN_KEY = 'auth_token';

// Helper functions
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getAuthToken();
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON if body is present and not FormData
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'An error occurred',
      }));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async requestOtp(data: OtpRequestData) {
    return this.request<{ success: boolean; message: string }>(
      API_ENDPOINTS.auth.requestOtp,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async verifyOtp(data: OtpVerifyData) {
    const response = await this.request<AuthResponse>(
      API_ENDPOINTS.auth.verifyOtp,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Store token if login successful
    if (response.success && response.access_token) {
      setAuthToken(response.access_token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request(API_ENDPOINTS.auth.logout, {
        method: 'POST',
      });
    } finally {
      clearAuthToken();
    }
  }

  async getCurrentUser() {
    return this.request<User>(API_ENDPOINTS.auth.me);
  }

  // Entry endpoints
  async validateCode(data: CodeValidateData) {
    return this.request<CodeValidateResponse>(
      API_ENDPOINTS.entries.validateCode,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async createEntry(image: File, codeId: number) {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('code_id', codeId.toString());

    return this.request<EntryCreateResponse>(API_ENDPOINTS.entries.create, {
      method: 'POST',
      body: formData,
    });
  }

  async getEntries() {
    return this.request<EntryListResponse>(API_ENDPOINTS.entries.list);
  }

  async checkDuplicate(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    return this.request<DuplicateCheckResponse>(
      API_ENDPOINTS.entries.checkDuplicate,
      {
        method: 'POST',
        body: formData,
      }
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

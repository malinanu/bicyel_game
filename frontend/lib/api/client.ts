import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api';

export const apiClient = axios.create({
  baseURL: `${API_URL}${API_BASE}`,
  timeout: 10000,
});

// Add JWT token to requests and handle Content-Type
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Set Content-Type to application/json by default, unless it's FormData
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  // For FormData, let axios set the Content-Type automatically (multipart/form-data with boundary)

  return config;
});

// Handle 401 errors (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

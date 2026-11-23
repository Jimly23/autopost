import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let csrfToken: string | null = null;
let isFetchingCsrf = false;
let csrfQueue: Array<(token: string) => void> = [];

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to fetch CSRF token from backend
export async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  if (isFetchingCsrf) {
    return new Promise((resolve) => {
      csrfQueue.push(resolve);
    });
  }

  isFetchingCsrf = true;
  try {
    const res = await axios.get('/api/csrf-token', { withCredentials: true });
    csrfToken = res.data?.data?.csrfToken || null;
    if (csrfToken) {
      csrfQueue.forEach((cb) => cb(csrfToken!));
      csrfQueue = [];
    }
    return csrfToken || '';
  } catch (err) {
    console.warn('Could not fetch CSRF token:', err);
    return '';
  } finally {
    isFetchingCsrf = false;
  }
}

// Attach CSRF token on state-changing requests
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

// Response interceptor for session expiration & errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // If backend returns 403 due to CSRF token mismatch, invalidate cached token
    if (error.response?.status === 403 && (error.response.data as any)?.message?.includes('CSRF')) {
      csrfToken = null;
    }
    return Promise.reject(error);
  }
);

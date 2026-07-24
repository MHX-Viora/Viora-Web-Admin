import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './http';

const ACCESS_TOKEN_KEY = 'viora_admin_access_token';
const USER_KEY = 'viora_admin_user';
const AUTH_CHANGE_EVENT = 'viora-admin-auth-change';

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export type AdminUser = {
  id: string;
  accountId: string;
  displayName: string;
  avatarUrl?: string;
  coverUrl?: string;
  gender: number;
  role: number;
  isVerified: boolean;
  verificationStatus: number;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

type LoginResponse = {
  status: number;
  accessToken: string;
  user: AdminUser;
};

type RefreshTokenResponse = {
  accessToken: string;
};

let refreshPromise: Promise<string> | null = null;
let interceptorsReady = false;

const authClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function subscribeAuthChange(callback: () => void) {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
}

export async function login(payload: LoginPayload) {
  const identifier = payload.identifier.trim();
  const password = payload.password;

  if (!identifier || !password) {
    throw new Error('Vui lòng nhập tài khoản và mật khẩu');
  }

  const { data } = await authClient.post<unknown>('/api/accounts/login', { identifier, password });
  const result = unwrapApiData<LoginResponse>(parseApiData(data));

  if (result.status !== 1 || !result.accessToken || !result.user) {
    throw new Error('Phản hồi đăng nhập không hợp lệ');
  }

  if (result.user.role !== 2) {
    clearSession();
    throw new Error('Tài khoản không có quyền quản trị');
  }

  setSession(result.accessToken, result.user);
  return result;
}

export async function refreshAccessToken() {
  refreshPromise ??= authClient
    .post<unknown>('/api/accounts/refresh-token')
    .then(({ data }) => {
      const result = unwrapApiData<RefreshTokenResponse>(parseApiData(data));
      if (!result.accessToken) throw new Error('Không nhận được access token mới');
      setAccessToken(result.accessToken);
      return result.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function logout() {
  try {
    const token = getAccessToken();
    await authClient.post('/api/accounts/logout', undefined, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } finally {
    clearSession();
  }
}

export function setupAuthInterceptors(client: AxiosInstance = apiClient) {
  if (interceptorsReady) return;
  interceptorsReady = true;

  const initialToken = getAccessToken();
  if (initialToken) client.defaults.headers.common.Authorization = `Bearer ${initialToken}`;

  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !isTokenEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as RetryRequestConfig | undefined;

      if (error.response?.status !== 401 || !config || config._retry || isAuthEndpoint(config.url)) {
        return Promise.reject(error);
      }

      config._retry = true;

      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return client.request(config);
      } catch (refreshError) {
        expireSession();
        return Promise.reject(refreshError);
      }
    },
  );
}

function setSession(accessToken: string, user?: AdminUser) {
  setAccessToken(accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChange();
}

function setAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete apiClient.defaults.headers.common.Authorization;
  emitAuthChange();
}

function expireSession() {
  clearSession();

  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

function isAuthEndpoint(url?: string) {
  return Boolean(url?.includes('/api/accounts/login') || url?.includes('/api/accounts/refresh-token') || url?.includes('/api/accounts/logout'));
}

function isTokenEndpoint(url?: string) {
  return Boolean(url?.includes('/api/accounts/login') || url?.includes('/api/accounts/refresh-token'));
}

function parseApiData<T>(data: unknown) {
  if (typeof data === 'string') {
    return JSON.parse(data) as T;
  }

  return data as T;
}

function unwrapApiData<T>(value: unknown) {
  if (!value || typeof value !== 'object') return value as T;

  const record = value as Record<string, unknown>;
  return (record.data ?? value) as T;
}

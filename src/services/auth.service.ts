import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './http';

const ACCESS_TOKEN_KEY = 'viora_admin_access_token';
const USER_KEY = 'viora_admin_user';

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

export async function login(payload: LoginPayload) {
  const identifier = payload.identifier.trim();
  const password = payload.password.trim();

  if (!identifier || !password) {
    throw new Error('Vui lòng nhập tài khoản và mật khẩu');
  }

  const { data } = await apiClient.post<unknown>('/api/accounts/login', { identifier, password });
  const result = parseApiData<LoginResponse>(data);

  if (!result.accessToken) {
    throw new Error('Phản hồi đăng nhập không hợp lệ');
  }

  setSession(result.accessToken, result.user);
  return result;
}

export async function refreshAccessToken() {
  refreshPromise ??= apiClient
    .post<unknown>('/api/accounts/refresh-token')
    .then(({ data }) => {
      const result = parseApiData<RefreshTokenResponse>(data);
      if (!result.accessToken) throw new Error('Không nhận được access token mới');
      localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken);
      return result.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function logout() {
  try {
    await apiClient.post('/api/accounts/logout');
  } finally {
    clearSession();
  }
}

export function setupAuthInterceptors(client: AxiosInstance = apiClient) {
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
        return client(config);
      } catch (refreshError) {
        clearSession();
        return Promise.reject(refreshError);
      }
    },
  );
}

function setSession(accessToken: string, user?: AdminUser) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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

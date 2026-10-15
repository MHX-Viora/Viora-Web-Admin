import axios from 'axios';
import { unwrapApiData } from './http';
import type { LoginPayload } from './auth.service';

const SESSION_KEY = 'ankt_developer_session';
type Session = { token: string; accountId: string; displayName: string; provider?: 'password' | 'google' };
export const developerClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL?.trim() ?? '', withCredentials: true });
let refreshing: Promise<string> | null = null;
const isAccountAuthRequest = (url?: string) => url?.startsWith('/api/accounts/') || url?.startsWith('/api/auth/');
function identity(token: string, allowExpired = false) {
  const part = token.split('.')[1];
  if (!part) throw new Error('Phiên đăng nhập không hợp lệ.');
  const value = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { sub: string; exp: number };
  if (!value.sub || typeof value.exp !== 'number' || (!allowExpired && value.exp * 1000 <= Date.now())) throw new Error('Phiên đăng nhập đã hết hạn.');
  return value;
}
export function getDeveloperSession(): Session | null {
  try { const raw = sessionStorage.getItem(SESSION_KEY); if (!raw) return null; const session = JSON.parse(raw) as Session; if (identity(session.token, true).sub !== session.accountId) return null; return session; } catch { sessionStorage.removeItem(SESSION_KEY); return null; }
}
export async function developerLogin(input: LoginPayload) {
  const { data } = await developerClient.post('/api/accounts/login', { identifier: input.identifier.trim(), password: input.password });
  saveDeveloperLogin(data, 'password');
}
function saveDeveloperLogin(data: unknown, provider: 'password' | 'google') {
  const result = unwrapApiData<{ status: number; accessToken: string; user?: { displayName: string } }>(typeof data === 'string' ? JSON.parse(data) : data);
  if (result.status !== 1 || !result.accessToken) throw new Error('Không thể đăng nhập tài khoản ANKT.');
  const account = identity(result.accessToken);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: result.accessToken, accountId: account.sub, displayName: result.user?.displayName ?? 'Developer', provider }));
}
export async function developerRegister(input: LoginPayload) {
  await developerClient.post('/api/accounts/register', { identifier: input.identifier.trim(), password: input.password });
  await developerLogin(input);
}
export async function developerGoogleLogin() {
  const { developerGoogleToken } = await import('./developer-provider.service');
  const { data } = await developerClient.post('/api/accounts/developer-google-login', { firebaseToken: await developerGoogleToken() });
  saveDeveloperLogin(data, 'google');
}
export async function developerReauthenticate(operation: string, miniAppId?: string, password?: string) {
  const session = getDeveloperSession();
  if (!session) throw new Error('Vui lòng đăng nhập lại.');
  const input = session.provider === 'google'
    ? { operation, miniAppId, firebaseToken: await (await import('./developer-provider.service')).developerGoogleToken() }
    : { operation, miniAppId, password };
  const result = unwrapApiData<{ proof: string; expiresAt: string }>((await developerClient.post('/api/developer/reauth', input)).data);
  return result.proof;
}
export async function developerResetWithGoogle(identifier: string, newPassword: string) {
  const firebaseToken = await (await import('./developer-provider.service')).developerGoogleToken();
  return unwrapApiData<{ message: string }>((await developerClient.post('/api/auth/reset-password', { identifier: identifier.trim(), newPassword, firebaseToken })).data);
}
export async function developerResetWithEmailLink(identifier: string, newPassword: string) {
  const firebaseToken = await (await import('./developer-provider.service')).developerEmailLinkToken(identifier);
  return unwrapApiData<{ message: string }>((await developerClient.post('/api/auth/reset-password', { identifier: identifier.trim(), newPassword, firebaseToken })).data);
}
export const developerAccountVerification = async () => unwrapApiData<{ email: string | null; emailVerifiedAt: string | null }>((await developerClient.get('/api/developer/account/verification')).data);
export async function developerVerifyAccountEmail(email: string, google = false) {
  const provider = await import('./developer-provider.service');
  const firebaseToken = google ? await provider.developerGoogleToken() : await provider.developerEmailLinkToken(email);
  return unwrapApiData<{ email: string; emailVerifiedAt: string }>((await developerClient.post('/api/developer/account/verify-email', { firebaseToken })).data);
}
export function developerLogout() { sessionStorage.removeItem(SESSION_KEY); }
developerClient.interceptors.request.use(config => {
  const session = getDeveloperSession();
  if (session && !isAccountAuthRequest(config.url)) config.headers.set('Authorization', `Bearer ${session.token}`);
  return config;
});
developerClient.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status !== 401 || !config || config._developerRetry || isAccountAuthRequest(config.url)) return Promise.reject(error);
  // Bind refresh to this principal: admin and portal share the server cookie, never their bearer session.
  const raw = sessionStorage.getItem(SESSION_KEY);
  const previous = raw ? JSON.parse(raw) as Session : null;
  if (!previous) return Promise.reject(error);
  config._developerRetry = true;
  try {
    refreshing ??= developerClient.post('/api/accounts/refresh-token').then(({ data }) => {
      const result = unwrapApiData<{ accessToken: string }>(typeof data === 'string' ? JSON.parse(data) : data);
      if (identity(result.accessToken).sub !== previous.accountId) throw new Error('Vui lòng đăng nhập lại Developer Portal.');
      if (sessionStorage.getItem(SESSION_KEY) !== raw) throw new Error('Phiên Developer đã thay đổi.');
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...previous, token: result.accessToken }));
      return result.accessToken;
    }).finally(() => { refreshing = null; });
    config.headers.set('Authorization', `Bearer ${await refreshing}`);
    return developerClient.request(config);
  } catch (refreshError) { if (sessionStorage.getItem(SESSION_KEY) === raw) { developerLogout(); window.location.assign('/developer/login'); } return Promise.reject(refreshError); }
});

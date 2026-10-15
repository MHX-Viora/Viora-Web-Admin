import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const token = (account, role = 0, expired = false) => `header.${Buffer.from(JSON.stringify({ sub: account, role, exp: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600) })).toString('base64url')}.signature`;
function harness(name) {
  const values = new Map(); const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  globalThis.sessionStorage = storage; globalThis.localStorage = storage;
  const events = [];
  globalThis.window = { dispatchEvent: e => events.push(e.type), location: { pathname: '/developer', assign: path => events.push(path), replace: path => events.push(path) } };
  const handlers = {}; const requests = []; const replies = [];
  const client = { defaults: { headers: { common: {} } }, interceptors: { request: { use: fn => { handlers.request = fn; } }, response: { use: (_fn, fail) => { handlers.error = fail; } } }, post: async (url, payload) => { requests.push({ url, payload }); const reply = replies.shift(); if (reply instanceof Error) throw reply; return { data: reply }; }, get: async () => ({ data: {} }), request: async config => { requests.push(config); return { data: {} }; } };
  const axios = { create: () => client, isAxiosError: () => false };
  const source = readFileSync(new URL(`../src/services/${name}.service.ts`, import.meta.url), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(module, module.exports, dependency => dependency === 'axios' ? axios : dependency.includes('developer-provider') ? { developerGoogleToken: async () => 'signed-provider-fixture', developerEmailLinkToken: async () => 'signed-email-fixture' } : { apiClient: client, unwrapApiData: value => value.data ?? value });
  return { api: module.exports, values, handlers, requests, replies, events };
}
test('normal ANKT user can enter portal without writing admin session', async () => {
  const h = harness('developer-auth');
  h.replies.push({ status: 1, accessToken: token('partner'), user: { displayName: 'Partner' } });
  await h.api.developerLogin({ identifier: 'partner', password: 'test-password' });
  assert.equal(h.api.getDeveloperSession().accountId, 'partner');
  assert.equal(h.values.has('ankt_admin_access_token'), false);
  assert.deepEqual(h.requests.map(r => r.url), ['/api/accounts/login']);
  h.api.developerLogout();
  assert.equal(h.api.getDeveloperSession(), null);
});
test('developer signup reuses ANKT identity registration and logs into that account', async () => {
  const h = harness('developer-auth');
  h.replies.push({ message: 'ok' }, { status: 1, accessToken: token('partner') });
  await h.api.developerRegister({ identifier: ' partner@example.com ', password: 'SafeFixture1' });
  assert.deepEqual(h.requests.map(r => r.url), ['/api/accounts/register', '/api/accounts/login']);
  assert.equal(h.requests[0].payload.identifier, 'partner@example.com');
  assert.equal(h.api.getDeveloperSession().provider, 'password');
});
test('existing email conflict never falls back to an automatic account link', async () => {
  const h = harness('developer-auth'); h.replies.push(new Error('ACCOUNT_EXISTS'));
  await assert.rejects(h.api.developerRegister({ identifier: 'existing@example.com', password: 'SafeFixture1' }), /ACCOUNT_EXISTS/);
  assert.deepEqual(h.requests.map(r => r.url), ['/api/accounts/register']);
  assert.equal(h.api.getDeveloperSession(), null);
});
test('Google login exchanges provider token and reauth uses Google instead of a fabricated password', async () => {
  const h = harness('developer-auth');
  h.replies.push({ status: 1, accessToken: token('google-partner') }, { proof: 'one-use-proof' });
  await h.api.developerGoogleLogin();
  assert.equal(h.requests[0].url, '/api/accounts/developer-google-login');
  assert.equal(h.api.getDeveloperSession().provider, 'google');
  assert.deepEqual(h.requests[0].payload, { firebaseToken: 'signed-provider-fixture' });
  assert.equal(await h.api.developerReauthenticate('RotateSecret', 'app'), 'one-use-proof');
  assert.deepEqual(h.requests[1].payload, { operation: 'RotateSecret', miniAppId: 'app', firebaseToken: 'signed-provider-fixture' });
});
test('failed provider recovery does not trigger portal refresh or destroy a current session', async () => {
  const h = harness('developer-auth');
  const session = JSON.stringify({ token: token('partner'), accountId: 'partner', displayName: 'Partner', provider: 'password' });
  h.values.set('ankt_developer_session', session);
  const failure = { response: { status: 401 }, config: { url: '/api/auth/reset-password' } };
  await assert.rejects(h.handlers.error(failure));
  assert.equal(h.requests.length, 0);
  assert.equal(h.values.get('ankt_developer_session'), session);
});
test('Google password recovery forwards signed identity and leaves Developer session untouched', async () => {
  const h = harness('developer-auth'); h.replies.push({ message: 'reset success' });
  await h.api.developerResetWithGoogle(' partner@example.com ', 'SafeFixture1');
  assert.deepEqual(h.requests[0], { url: '/api/auth/reset-password', payload: { identifier: 'partner@example.com', newPassword: 'SafeFixture1', firebaseToken: 'signed-provider-fixture' } });
  assert.equal(h.api.getDeveloperSession(), null);
});
test('generic email-link recovery uses verified Firebase token through existing reset API', async () => {
  const h = harness('developer-auth'); h.replies.push({ message: 'reset success' });
  await h.api.developerResetWithEmailLink(' partner@example.com ', 'SafeFixture1');
  assert.deepEqual(h.requests[0], { url: '/api/auth/reset-password', payload: { identifier: 'partner@example.com', newPassword: 'SafeFixture1', firebaseToken: 'signed-email-fixture' } });
});
test('email-link verification never submits a client email as verification proof', async () => {
  const h = harness('developer-auth'); h.replies.push({ email: 'partner@example.com', emailVerifiedAt: '2026-10-13T00:00:00Z' });
  await h.api.developerVerifyAccountEmail('partner@example.com');
  assert.deepEqual(h.requests[0], { url: '/api/developer/account/verify-email', payload: { firebaseToken: 'signed-email-fixture' } });
});
test('developer refresh refuses cookie belonging to another account', async () => {
  const h = harness('developer-auth');
  h.values.set('ankt_developer_session', JSON.stringify({ token: token('partner', 0, true), accountId: 'partner', displayName: 'Partner' }));
  assert.equal(h.api.getDeveloperSession().accountId, 'partner');
  h.replies.push({ accessToken: token('admin', 2) });
  await assert.rejects(h.handlers.error({ response: { status: 401 }, config: { url: '/api/developer/profile', headers: { set() {} } } }), /đăng nhập lại/);
  assert.equal(h.api.getDeveloperSession(), null);
  assert.equal(h.requests.filter(r => r.url === '/api/developer/profile').length, 0);
});
test('admin login rejects non-admin ANKT user before authorizing dashboard', async () => {
  const h = harness('auth');
  h.replies.push({ status: 1, accessToken: token('partner'), user: { role: 0 } });
  await assert.rejects(h.api.login({ identifier: 'partner', password: 'test-password' }), /quyền quản trị/);
  assert.equal(h.values.has('ankt_admin_access_token'), false);
});
test('admin refresh rejects developer cookie and cannot replace admin token', async () => {
  const h = harness('auth');
  const original = token('admin', 2);
  h.values.set('ankt_admin_access_token', original);
  h.values.set('ankt_admin_user', JSON.stringify({ accountId: 'admin', role: 2 }));
  h.replies.push({ accessToken: token('partner', 0) });
  await assert.rejects(h.api.refreshAccessToken(), /Phiên quản trị/);
  assert.equal(h.values.get('ankt_admin_access_token'), original);
});
test('late developer refresh cannot restore a logged-out session', async () => {
  const h = harness('developer-auth');
  const raw = JSON.stringify({ token: token('partner', 0, true), accountId: 'partner', displayName: 'Partner' });
  h.values.set('ankt_developer_session', raw);
  h.replies.push({ accessToken: token('partner') });
  const pending = h.handlers.error({ response: { status: 401 }, config: { url: '/api/developer/profile', headers: { set() {} } } });
  h.api.developerLogout();
  await assert.rejects(pending, /đã thay đổi/);
  assert.equal(h.api.getDeveloperSession(), null);
});
test('late admin refresh cannot overwrite a newer admin login', async () => {
  const h = harness('auth');
  h.values.set('ankt_admin_access_token', token('admin', 2, true));
  h.values.set('ankt_admin_user', JSON.stringify({ accountId: 'admin', role: 2 }));
  h.replies.push({ accessToken: token('admin', 2) });
  const pending = h.api.refreshAccessToken();
  const newer = token('second-admin', 2);
  h.values.set('ankt_admin_access_token', newer);
  h.values.set('ankt_admin_user', JSON.stringify({ accountId: 'second-admin', role: 2 }));
  await assert.rejects(pending, /Phiên quản trị/);
  assert.equal(h.values.get('ankt_admin_access_token'), newer);
});
test('old request refresh failure preserves the newer admin session', async () => {
  const h = harness('auth');
  h.values.set('ankt_admin_access_token', token('admin', 2, true));
  h.values.set('ankt_admin_user', JSON.stringify({ accountId: 'admin', role: 2 }));
  h.api.setupAuthInterceptors();
  h.replies.push({ accessToken: token('admin', 2) });
  const pending = h.handlers.error({ response: { status: 401 }, config: { url: '/api/admin/dashboard', headers: { set() {} } } });
  const newer = token('second-admin', 2);
  h.values.set('ankt_admin_access_token', newer);
  h.values.set('ankt_admin_user', JSON.stringify({ accountId: 'second-admin', role: 2 }));
  await assert.rejects(pending, /Phiên quản trị/);
  assert.equal(h.values.get('ankt_admin_access_token'), newer);
  assert.equal(h.events.includes('/login'), false);
});

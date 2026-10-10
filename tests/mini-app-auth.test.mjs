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
  const client = { defaults: { headers: { common: {} } }, interceptors: { request: { use: fn => { handlers.request = fn; } }, response: { use: (_fn, fail) => { handlers.error = fail; } } }, post: async (url, payload) => { requests.push({ url, payload }); return { data: replies.shift() }; }, get: async () => ({ data: {} }), request: async config => { requests.push(config); return { data: {} }; } };
  const axios = { create: () => client, isAxiosError: () => false };
  const source = readFileSync(new URL(`../src/services/${name}.service.ts`, import.meta.url), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', compiled)(module, module.exports, dependency => dependency === 'axios' ? axios : { apiClient: client, unwrapApiData: value => value.data ?? value });
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

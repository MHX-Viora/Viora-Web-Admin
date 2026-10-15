import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
function fixture(status, membershipRole = 'Owner', initialStep = 0, acceptedVersion = '') {
  const profile = { id: 'developer', name: 'Owner', email: 'owner@example.com', phone: '0901234567', country: 'VN', partnerType: 'Individual', registrationVersion: 1, status, membershipRole };
  const module = { exports: {} }, requests = [], toasts = [], mutations = [], states = [];
  let stateIndex = 0;
  const common = {
    PageHeader: ({ title, description }) => React.createElement('header', {}, React.createElement('h1', {}, title), React.createElement('p', {}, description)),
    StatusBadge: ({ status }) => React.createElement('span', {}, status),
  };
  function load(filename, target = { exports: {} }) {
    const source = require('typescript').transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText;
    vm.runInNewContext(source, { module: target, exports: target.exports, require(name) {
    if (name === 'react') return { ...React, useState: value => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = index === 3 ? initialStep : index === 5 ? acceptedVersion : typeof value === 'function' ? value() : value;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    } };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async () => {}, setQueryData() {} }), useQuery: options => ({ data: options.queryKey[0] === 'developer-terms' ? { version: 'terms', documents: [] } : profile, refetch() {} }), useMutation: options => { mutations.push(options); return { isPending: false }; } };
    if (name === '../../components/common') return common;
    if (name === '../../services/developer-auth.service') return { getDeveloperSession: () => ({ accountId: 'owner', displayName: 'Owner' }) };
    if (name === '../../services/developer.service') return { developerApi: {
      terms: async () => ({ version: 'terms', documents: [] }),
      saveApplication: async input => { requests.push(input); return { ...profile, registrationVersion: 2, registrationStatus: 'Draft' }; },
      submitApplication: async (version, termsVersion) => { requests.push({ version, termsVersion }); return { ...profile, registrationStatus: 'PendingReview' }; },
    } };
    if (name === '../../services/http') return { getErrorMessage: error => error.message };
    if (name === 'sonner') return { toast: { success: message => toasts.push(message) } };
    if (name === './context') return { useDeveloperProfile: () => profile, DeveloperProfileContext: React.createContext(profile) };
    if (name === './InvitationInbox') return { InvitationInbox: () => null };
    if (name === './Shared') return { QueryState: ({ children }) => children };
    if (name.endsWith('.css')) return {};
    if (name === 'react-router-dom') return { ...require(name), Outlet: () => React.createElement('div', {}, 'APP_OPERATIONS') };
    if (name.startsWith('./')) {
      const base = path.resolve(path.dirname(filename), name);
      return load(base + (name === './registration' ? '.ts' : '.tsx'));
    }
    return require(name);
  } }); return target.exports;
  }
  load(fileURLToPath(new URL('../src/features/developer/DeveloperPortal.tsx', import.meta.url)), module);
  return { requests, toasts, mutations, render(name) { stateIndex = 0; mutations.length = 0; return renderToStaticMarkup(React.createElement(MemoryRouter, {}, React.createElement(module.exports[name]))); } };
}
test('portal blocks app operations until approval and offers status refresh', () => {
  for (const status of ['Pending', 'Rejected', 'Suspended']) {
    const f = fixture(status), html = f.render('DeveloperLayout');
    assert.doesNotMatch(html, /APP_OPERATIONS/);
    assert.match(html, /Kiểm tra trạng thái/);
  }
  assert.match(fixture('Active').render('DeveloperLayout'), /APP_OPERATIONS/);
});

test('approved profile initially shows a change request instead of a new registration submit', () => {
  const html = fixture('Active').render('DeveloperProfilePage');
  assert.match(html, /Yêu cầu thay đổi hồ sơ/);
  assert.doesNotMatch(html, /<form/);
});

test('saving an unverified profile advances directly to terms without email delivery', async () => {
  const f = fixture('Rejected');
  f.render('DeveloperProfilePage');
  const draft = await f.mutations[0].mutationFn();
  await f.mutations[0].onSuccess(draft);
  const html = f.render('DeveloperProfilePage');
  assert.match(html, /<h2>Điều khoản<\/h2>/);
  assert.doesNotMatch(html, /Xác minh email|Gửi mã|Nhập mã|OTP/);
});

test('review submits an unverified profile with its saved version and accepted terms', async () => {
  const f = fixture('Rejected', 'Owner', 3, 'terms');
  const html = f.render('DeveloperProfilePage');
  assert.match(html, /Gửi hồ sơ xét duyệt/);
  await f.mutations[1].mutationFn();
  assert.deepEqual(f.requests, [{ version: 1, termsVersion: 'terms' }]);
  assert.equal(f.mutations.length, 2);
});
test('portal rejected profile starts a versioned draft before resubmission', async () => {
  const f = fixture('Rejected');
  const html = f.render('DeveloperProfilePage');
  assert.match(html, /Xem lại &amp; gửi/); assert.match(html, /Loại đối tác/);
  const draft = await f.mutations[0].mutationFn(); await f.mutations[0].onSuccess(draft);
  assert.equal(f.requests.length, 1); assert.equal(f.requests[0].version, 1); assert.equal(f.requests[0].status, undefined);
});
test('portal suspended owners and members see status without mutation controls', () => {
  for (const [status, role] of [['Suspended', 'Owner'], ['Active', 'Member']]) {
    const html = fixture(status, role).render('DeveloperProfilePage');
    assert.doesNotMatch(html, /<form|<input|<button/);
    assert.match(html, /Mã hồ sơ/);
  }
});

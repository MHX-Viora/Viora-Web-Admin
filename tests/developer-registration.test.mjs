import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const source = require('typescript').transpileModule(readFileSync(new URL('../src/features/developer/DeveloperPortal.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText;
function fixture(status, membershipRole = 'Owner') {
  const profile = { id: 'developer', name: 'Owner', email: 'owner@example.com', status, membershipRole };
  const module = { exports: {} }, requests = [], toasts = [], mutations = [];
  const common = {
    PageHeader: ({ title, description }) => React.createElement('header', {}, React.createElement('h1', {}, title), React.createElement('p', {}, description)),
    StatusBadge: ({ status }) => React.createElement('span', {}, status),
  };
  vm.runInNewContext(source, { module, exports: module.exports, require(name) {
    if (name === 'react') return { ...React, useState: value => [value, () => {}] };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async () => {} }), useQuery: () => ({ data: profile, refetch() {} }), useMutation: options => { mutations.push(options); return { isPending: false }; } };
    if (name === '../../components/common') return common;
    if (name === '../../services/developer-auth.service') return { getDeveloperSession: () => ({ accountId: 'owner', displayName: 'Owner' }) };
    if (name === '../../services/developer.service') return { developerApi: { updateProfile: async input => requests.push(input) } };
    if (name === '../../services/http') return { getErrorMessage: error => error.message };
    if (name === 'sonner') return { toast: { success: message => toasts.push(message) } };
    if (name === './context') return { useDeveloperProfile: () => profile };
    if (name === './Shared' || name.endsWith('.css')) return {};
    if (name === 'react-router-dom') return { ...require(name), Outlet: () => React.createElement('div', {}, 'APP_OPERATIONS') };
    return require(name);
  } });
  return { requests, toasts, mutations, render(name) { return renderToStaticMarkup(React.createElement(MemoryRouter, {}, React.createElement(module.exports[name]))); } };
}
test('portal blocks app operations until approval and offers status refresh', () => {
  for (const status of ['Pending', 'Rejected', 'Suspended']) {
    const f = fixture(status), html = f.render('DeveloperLayout');
    assert.doesNotMatch(html, /APP_OPERATIONS/);
    assert.match(html, /Kiểm tra trạng thái/);
  }
  assert.match(fixture('Active').render('DeveloperLayout'), /APP_OPERATIONS/);
});
test('portal rejected profile exposes explicit resubmission and pending success', async () => {
  const f = fixture('Rejected');
  assert.match(f.render('DeveloperProfilePage'), /Gửi lại hồ sơ để xét duyệt/);
  await f.mutations[0].mutationFn(); await f.mutations[0].onSuccess();
  assert.equal(f.requests.length, 1); assert.match(f.toasts[0], /chờ duyệt/);
});
test('portal suspended owners and members see disabled profile fields and submit', () => {
  for (const [status, role] of [['Suspended', 'Owner'], ['Active', 'Member']]) {
    const html = fixture(status, role).render('DeveloperProfilePage');
    assert.match(html, /<fieldset disabled=""/);
    assert.match(html, /<button[^>]+disabled=""/);
  }
});

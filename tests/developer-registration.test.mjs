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
function fixture(status, membershipRole = 'Owner') {
  const profile = { id: 'developer', name: 'Owner', email: 'owner@example.com', phone: '0901234567', country: 'VN', partnerType: 'Individual', registrationVersion: 1, status, membershipRole };
  const module = { exports: {} }, requests = [], toasts = [], mutations = [];
  const common = {
    PageHeader: ({ title, description }) => React.createElement('header', {}, React.createElement('h1', {}, title), React.createElement('p', {}, description)),
    StatusBadge: ({ status }) => React.createElement('span', {}, status),
  };
  function load(filename, target = { exports: {} }) {
    const source = require('typescript').transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText;
    vm.runInNewContext(source, { module: target, exports: target.exports, require(name) {
    if (name === 'react') return { ...React, useState: value => [typeof value === 'function' ? value() : value, () => {}] };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async () => {} }), useQuery: options => ({ data: options.queryKey[0] === 'developer-terms' ? { version: 'terms', documents: [] } : profile, refetch() {} }), useMutation: options => { mutations.push(options); return { isPending: false }; } };
    if (name === '../../components/common') return common;
    if (name === '../../services/developer-auth.service') return { getDeveloperSession: () => ({ accountId: 'owner', displayName: 'Owner' }) };
    if (name === '../../services/developer.service') return { developerApi: { saveApplication: async input => { requests.push(input); return { ...profile, registrationVersion: 2, registrationStatus: 'Draft' }; } } };
    if (name === '../../services/http') return { getErrorMessage: error => error.message };
    if (name === 'sonner') return { toast: { success: message => toasts.push(message) } };
    if (name === './context') return { useDeveloperProfile: () => profile };
    if (name === './Shared' || name.endsWith('.css')) return {};
    if (name === 'react-router-dom') return { ...require(name), Outlet: () => React.createElement('div', {}, 'APP_OPERATIONS') };
    if (name.startsWith('./')) {
      const base = path.resolve(path.dirname(filename), name);
      return load(base + (name === './registration' ? '.ts' : '.tsx'));
    }
    return require(name);
  } }); return target.exports;
  }
  load(fileURLToPath(new URL('../src/features/developer/DeveloperPortal.tsx', import.meta.url)), module);
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

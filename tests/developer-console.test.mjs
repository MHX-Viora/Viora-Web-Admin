import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const React = require('react');

function fixture({ role = 'Owner', states = [], provider = 'password' } = {}) {
  const app = { id: 'app-id', clientId: 'public-client', webUrl: 'https://partner.example', callbackUrls: ['https://partner.example/auth/callback'], authenticationMode: 'AnktSso', membershipRole: role };
  const domains = [{ id: 'domain', host: 'partner.example', challengeToken: 'token', verificationFileName: `ankt-verify-${'a'.repeat(32)}.txt`, verificationUrl: `https://partner.example/ankt-verify-${'a'.repeat(32)}.txt`, fileContent: 'ankt-domain-verification=token', expiresAt: '2099-01-01T00:00:00Z' }];
  const calls = [], mutations = [], module = { exports: {} }; let cursor = 0;
  const api = new Proxy({}, { get: (_, action) => async (...args) => { calls.push({ action, args }); return { clientSecret: 'new-secret' }; } });
  const pass = () => null;
  const code = require('typescript').transpileModule(readFileSync(new URL('../src/features/developer/DeveloperToolsPages.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: 1, jsx: 4, target: 9 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require(name) {
    if (name === 'react') return { ...React, useState: value => [cursor < states.length ? states[cursor++] : (cursor++, typeof value === 'function' ? value() : value), () => {}] };
    if (name === '@tanstack/react-query') return { useQueryClient: () => ({ invalidateQueries: async () => {} }), useQuery: options => ({ data: options.queryKey[0] === 'developer-domains' ? domains : options.queryKey[0] === 'developer-credentials' ? { hasSecret: true, canRotate: role === 'Owner' } : [], dataUpdatedAt: Date.parse('2026-10-13'), refetch() {} }), useMutation: options => { mutations.push(options); return { isPending: false, mutate() {} }; } };
    if (name === '../../services/developer.service') return { developerApi: api };
    if (name === '../../services/developer-auth.service') return { getDeveloperSession: () => ({ provider }), developerReauthenticate: async (...args) => { calls.push({ action: 'reauth', args }); return 'app-bound-proof'; } };
    if (name === './context') return { useDeveloperApp: () => app, useDeveloperProfile: () => ({ membershipRole: role }) };
    if (name === './verification-download') return { downloadVerificationFile: async (...args) => { calls.push({ action: 'download', args }); } };
    if (name === './Shared') return { CopyValue: pass, QueryState: pass, SecretDisclosure: pass, AuditTimeline: pass };
    if (name === './OpenApiIntegrationPanel') return { OpenApiIntegrationPanel: pass };
    if (name === './DeveloperAppPage') return { DeveloperConfigEditor: pass };
    if (name === './OrganizationTeamPage') return { OrganizationTeamPage: pass };
    if (name === '../../components/common') return { ConfirmDialog: pass, DataTable: pass, PageHeader: pass, Pagination: pass, StatCard: pass, StatusBadge: pass };
    if (name === '../../services/http') return { getErrorMessage: String };
    if (name === 'sonner') return { toast: { success() {}, error() {} } };
    return require(name);
  } });
  return { ...module.exports, calls, mutations };
}
function nodes(tree) { if (!tree || typeof tree !== 'object') return []; return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)]; }

test('new domain download preserves server random filename and exact server file content without reauth', async () => {
  const f = fixture(); const tree = f.DeveloperDomainsPage();
  const download = nodes(tree).find(node => node.type === 'button' && node.props.children === 'Tải file xác minh (.txt)');
  assert.ok(download); await download.props.onClick();
  assert.deepEqual(f.calls[0], { action: 'download', args: ['token', `ankt-verify-${'a'.repeat(32)}.txt`, 'ankt-domain-verification=token'] });
  assert.equal(f.calls.some(call => call.action === 'reauth'), false);
});
test('rotation uses same provider reauth, app-bound proof and selected transition period', async () => {
  const f = fixture({ states: ['rotate', '', 60, ''], provider: 'google' }); f.DeveloperConnectionPage();
  await f.mutations[0].mutationFn();
  assert.deepEqual(f.calls.map(call => call.action), ['reauth', 'rotate']);
  assert.deepEqual(f.calls[0].args, ['RotateSecret', 'app-id', '']);
  assert.deepEqual(f.calls[1].args, ['app-id', 'app-bound-proof', 60]);
});
test('viewer sees member information without invitation form or secret issuance action', () => {
  const f = fixture({ role: 'Viewer' });
  assert.equal(nodes(f.DeveloperAppMembersPage()).some(node => node.type === 'form'), false);
  const g = fixture({ role: 'Viewer' });
  assert.equal(nodes(g.DeveloperConnectionPage()).some(node => node.type === 'button' && node.props.children === 'Cấp Client Secret mới'), false);
});

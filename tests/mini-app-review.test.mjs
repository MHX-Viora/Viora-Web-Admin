import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const source = require('typescript').transpileModule(readFileSync(new URL('../src/features/mini-app-review/review.ts', import.meta.url), 'utf8'), { compilerOptions: { module: 1 } }).outputText;
const module = { exports: {} }; new Function('module', 'exports', source)(module, module.exports);
const { reviewReadiness } = module.exports;
const app = { status: 'Active', pendingVersion: 2 };
const configuration = { webUrl: 'https://shop.example/app', allowedDomains: ['shop.example'], allowedOrigins: ['https://shop.example'], callbackUrls: ['https://auth.example/callback'], permissions: ['identity.login'], authenticationMode: 'AnktSso' };
const versions = [{ version: 2, status: 'PendingReview', configuration }];
const context = { developer: { id: 'exact-owner', status: 'Active' }, domains: [{ id: 'one', host: 'shop.example', verifiedAt: '2026-10-10T00:00:00Z' }, { id: 'two', host: 'auth.example', verifiedAt: '2026-10-10T00:00:00Z' }] };
const permissions = [{ code: 'identity.login', isActive: true }];

test('Active app pending update reviews the submitted snapshot and all required hosts', () => {
  const result = reviewReadiness(app, versions, context, permissions, []);
  assert.deepEqual(result.blockers, []); assert.equal(result.version.version, 2);
  assert.deepEqual(result.hosts, ['shop.example', 'auth.example']);
});
test('draft, legacy missing snapshot and unknown evidence cannot be approved', () => {
  assert.ok(reviewReadiness({ status: 'Draft' }, [], context, permissions, []).blockers.length);
  assert.ok(reviewReadiness({ status: 'PendingReview' }, [], context, permissions, []).blockers.length);
  assert.ok(reviewReadiness(app, versions, undefined, undefined, undefined).blockers.length);
});
test('unverified callback host, inactive owner, scope or category block approval', () => {
  assert.match(reviewReadiness(app, versions, { ...context, domains: [context.domains[0]] }, permissions, []).blockers.join(' '), /auth.example/);
  assert.ok(reviewReadiness(app, versions, { ...context, developer: { status: 'Suspended' } }, permissions, []).blockers.length);
  assert.ok(reviewReadiness(app, versions, context, [{ code: 'identity.login', isActive: false }], []).blockers.length);
  assert.ok(reviewReadiness(app, [{ ...versions[0], configuration: { ...configuration, categoryId: 'disabled' } }], context, permissions, [{ id: 'disabled', isActive: false }]).blockers.length);
});
test('suspended app cannot publish a waiting version', () => {
  assert.ok(reviewReadiness({ ...app, status: 'Suspended' }, versions, context, permissions, []).blockers.length);
});

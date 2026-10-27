import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const ts = require('typescript');
export const id = '11111111-1111-4111-8111-111111111111';
export const summary = { id, versionId: id, versionCode: 1, status: 'InReview', submittedAt: '2026-10-21T00:00:00Z', reviewStartedAt: null, decidedAt: null, concurrencyToken: id };
export function harness(response, failure) {
  const calls = [], cache = new Map();
  const client = Object.fromEntries(['get', 'post'].map(method => [method, async (...args) => {
    calls.push({ method, args }); if (failure) throw failure; return { data: response };
  }]));
  function compile(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = new Module(file); cache.set(file, mod); mod.paths = Module._nodeModulePaths(path.dirname(file));
    mod.require = name => {
      if (name === './http') return { apiClient: client };
      if (name.startsWith('.')) {
        const candidate = path.resolve(path.dirname(file), name) + '.ts';
        if (existsSync(candidate)) return compile(candidate);
      }
      return require(name);
    };
    mod._compile(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, file);
    return mod.exports;
  }
  return { service: compile(path.resolve('src/services/admin-mini-app.service.ts')), calls };
}

test('queue uses existing authenticated client and bounded exact query', async () => {
  const h = harness({ items: [], total: 0, page: 1, pageSize: 20 });
  assert.equal((await h.service.listReviews({ page: 1, pageSize: 20, status: 'PendingReview', sort: 'oldest' })).total, 0);
  assert.equal(h.calls[0].args[0], '/api/admin/mini-app-reviews');
  await assert.rejects(h.service.listReviews({ page: 0, pageSize: 20 }));
  await assert.rejects(h.service.listReviews({ page: 1, pageSize: 20, status: 'Published' }));
  await assert.rejects(h.service.listReviews({ page: 1, pageSize: 20, actor: id }));
  assert.equal(h.calls.length, 1);
});

test('commands allow only exact actions and revisions; reason/items required', async () => {
  const h = harness(summary);
  const command = { requestId: id, concurrencyToken: id };
  await h.service.reviewCommand(id, 'start', command);
  assert.deepEqual(h.calls[0].args.slice(0, 2), [`/api/admin/mini-app-reviews/${id}/start`, command]);
  for (const [action, payload] of [['publish', command], ['reject', command], ['request-changes', { ...command, reason: 'Please fix legal' }], ['start', { ...command, actor: id }]]) {
    await assert.rejects(h.service.reviewCommand(id, action, payload));
  }
  await assert.rejects(h.service.reviewCommand('../escape', 'start', command));
  assert.equal(h.calls.length, 1);
});

test('permission/conflict failures stay typed and never become success', async () => {
  for (const status of [401, 403, 409, 429, 500]) {
    const h = harness(null, { isAxiosError: true, response: { status, data: { error: { code: 'DENIED', message: 'untrusted diagnostic secret' } } } });
    await assert.rejects(h.service.reviewCommand(id, 'start', { requestId: id, concurrencyToken: id }), error => {
      assert.equal(error.status, status); assert.doesNotMatch(error.message, /untrusted|secret/); return true;
    });
  }
});

test('strict response parsing rejects extra credential fields, unbounded collections and unsafe IDs', async () => {
  for (const response of [{ items: [], total: 0, page: 1, pageSize: 20, clientSecret: 'fixture' }, { items: Array(101).fill({}), total: 101, page: 1, pageSize: 20 }]) {
    await assert.rejects(harness(response).service.listReviews({ page: 1, pageSize: 20 }));
  }
  await assert.rejects(harness({ ...summary, id: '../escape' }).service.reviewCommand(id, 'start', { requestId: id, concurrencyToken: id }));
});
test('application views use server filters and retain explicit moderation capabilities', async () => {
  const h = harness({ items: [], page: 1, pageSize: 20, total: 0 });
  await h.service.listApps({ page: 1, pageSize: 20, view: 'suspended' });
  assert.equal(h.calls[0].args[1].params.view, 'suspended');
  await assert.rejects(h.service.listApps({ page: 1, pageSize: 20, view: 'any-sql' }));
  const app = { appId: 'app_fixture', name: 'Fixture', developerName: 'Dev', developerEmail: 'dev@fixture.test', legacyStatus: 'Draft', operationalStatus: 'Suspended', appVersion: id, operationalRevision: id, publicationId: null, publishedVersionId: null, canSuspend: false, canRestore: true, operationalReason: 'Controlled fixture suspension' };
  const parsed = await harness({ app, versions: [], publications: [], publishedSnapshot: null }).service.getApp('app_fixture');
  assert.equal(parsed.app.canRestore, true);
  assert.equal(parsed.app.operationalReason, app.operationalReason);
});
test('unusable mutation replies are ambiguous so retries keep original request identity', async () => {
  for (const data of [null, { ...summary, id: '22222222-2222-4222-8222-222222222222' }, { ...summary, clientSecret: 'fixture' }]) {
    await assert.rejects(harness(data).service.reviewCommand(id, 'start', { requestId: id, concurrencyToken: id }), error => error.ambiguous === true);
  }
});
test('GUID URLs are case-insensitive like the ASP.NET route and serializer', async () => {
  const lower = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const h = harness({ ...summary, id: lower });
  assert.equal((await h.service.reviewCommand(lower.toUpperCase(), 'start', { requestId: id, concurrencyToken: id })).id, lower);
});
test('UTF-8 command budgets match the API even for multibyte reasons and many changes', async () => {
  const h = harness(summary);
  await assert.rejects(h.service.reviewCommand(id, 'request-changes', { requestId: id, concurrencyToken: id, reason: 'Valid reason for changes', changes: Array.from({ length: 20 }, () => ({ field: 'name', message: '界'.repeat(2000) })) }));
  await assert.rejects(h.service.moderateApp('app_fixture', 'suspend', { requestId: id, concurrencyToken: id, reason: '界'.repeat(2000), operationalRevision: null, publicationId: null, publicationRevision: null }));
  assert.equal(h.calls.length, 0);
});
test('successful HTTP replies must confirm the requested terminal state', async () => {
  await assert.rejects(harness(summary).service.reviewCommand(id, 'approve', { requestId: id, concurrencyToken: id }), error => error.ambiguous === true);
});
test('queue includes the version-pinned logo and rejects unknown snapshot fields', async () => {
  const item = { review: summary, appId: 'app_fixture', appName: 'Fixture', versionName: '1.0', developerName: 'Dev', developerEmail: 'dev@fixture.test', assignedAdminAccountId: null, logoUrl: 'https://fixture.test/logo.svg' };
  const response = { items: [item], page: 1, pageSize: 20, total: 1 };
  assert.equal((await harness(response).service.listReviews({ page: 1, pageSize: 20 })).items[0].logoUrl, item.logoUrl);
  await assert.rejects(harness({ ...response, items: [{ ...item, clientSecret: 'fixture' }] }).service.listReviews({ page: 1, pageSize: 20 }));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { load } from './test-support.mjs';

test('Admin reads both sealed evidence schemas and rejects future schemas', () => {
  const { parseReviewDetail } = load('src/types/mini-app-review.ts');
  const id = '11111111-1111-4111-8111-111111111111', now = '2026-10-27T00:00:00Z', hash = 'a'.repeat(64);
  const detail = { review: { id, versionId: id, versionCode: 1, status: 'PendingReview', submittedAt: now,
    reviewStartedAt: null, decidedAt: null, concurrencyToken: id }, versionName: '1.0', snapshotHash: hash,
    snapshot: { schemaVersion: 1, name: 'Bridge', category: 'utilities', logoUrl: null, shortDescription: null,
      description: null, websiteUrl: 'https://partner.example.com', domain: 'partner.example.com', privacyPolicyUrl: null,
      termsOfServiceUrl: null, supportEmail: null, ssoEnabled: false, sandbox: null, production: null },
    evidence: { schemaVersion: 2, versionId: id, snapshotHash: hash, sandboxRunId: id,
      configurationFingerprint: 'A'.repeat(64), evaluatedAt: now, checks: [] }, reason: null, changes: [], actions: [] };
  const wrap = review => ({ review, appId: 'app_fixture', developerName: 'Developer', developerEmail: 'dev@example.com',
    assignedAdminAccountId: null, canStart: true, canAssign: true, canDecide: false, canSuspend: false });
  assert.equal(parseReviewDetail(wrap(detail)).review.evidence.schemaVersion, 2);
  assert.equal(parseReviewDetail(wrap({ ...detail, evidence: { ...detail.evidence, schemaVersion: 1 } })).review.evidence.schemaVersion, 1);
  assert.throws(() => parseReviewDetail(wrap({ ...detail, evidence: { ...detail.evidence, schemaVersion: 3 } })));
});

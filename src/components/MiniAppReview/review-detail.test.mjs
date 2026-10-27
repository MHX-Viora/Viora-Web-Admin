import assert from 'node:assert/strict';
import test from 'node:test';
import { load, render } from './test-support.mjs';
test('snapshot is labeled immutable and treats partner URLs and HTML as untrusted', () => {
  const { ReviewSnapshot } = load('src/components/MiniAppReview/ReviewSnapshot.tsx');
  const markup = render(ReviewSnapshot, { snapshot: { name: '<img src=x onerror=alert(1)>', category: 'Tools', description: '<script>evil</script>', websiteUrl: 'javascript:alert(1)', privacyPolicyUrl: 'https://fixture.test/privacy', ssoEnabled: true, production: { clientType: 'Public', scopes: ['openid'], redirectUris: ['https://fixture.test/callback'] } } });
  assert.match(markup, /Bản chụp bất biến/); assert.match(markup, /&lt;script&gt;/);
  assert.doesNotMatch(markup, /href="javascript:|<script>|<img src=x/);
  assert.match(markup, /noopener noreferrer/); assert.match(markup, /Production/);
});
test('timeline renders escaped reasons, change items and evidence time as historical', () => {
  const { ReviewTimeline } = load('src/components/MiniAppReview/ReviewTimeline.tsx');
  const markup = render(ReviewTimeline, { detail: { reason: '<script>reason</script>', changes: [{ field: 'name', message: '<b>fix</b>' }], actions: [{ action: 'ReviewRejected', actorType: 'Admin', createdAt: '2026-10-21T00:00:00Z', reason: 'Please correct details', afterState: 'Rejected' }], evidence: { sandboxRunId: 'fixture-run', evaluatedAt: '2026-10-21T00:00:00Z', checks: [{ key: 'domain', status: 'Passed', messageCode: 'DOMAIN_OK', evidenceSource: 'Server', evidenceAt: null }] } } });
  assert.match(markup, /&lt;script&gt;/); assert.match(markup, /&lt;b&gt;fix/); assert.match(markup, /tại thời điểm gửi/);
});
test('logos load only HTTPS without embedded credentials and omit referrers', () => {
  const { ReviewLogo } = load('src/components/MiniAppReview/ReviewSnapshot.tsx');
  assert.match(render(ReviewLogo, { value: 'https://fixture.test/logo.svg' }), /referrerPolicy="no-referrer"/);
  for (const value of ['javascript:alert(1)', 'https://user:password@fixture.test/logo', 'data:image/svg+xml,test']) assert.doesNotMatch(render(ReviewLogo, { value }), /<img/);
});

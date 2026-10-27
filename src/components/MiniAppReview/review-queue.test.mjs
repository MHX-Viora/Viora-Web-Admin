import assert from 'node:assert/strict';
import test from 'node:test';
import { load, render } from './test-support.mjs';
test('queue distinguishes loading, empty and error without invented approvals', () => {
  const { ReviewQueue } = load('src/components/MiniAppReview/ReviewQueue.tsx');
  const base = { query: { page: 1, pageSize: 20 }, update() {}, reload() {} };
  assert.match(render(ReviewQueue, { ...base, loading: true }), /Đang tải/);
  assert.match(render(ReviewQueue, { ...base, error: new Error('Không có quyền') }), /role="alert"/);
  assert.match(render(ReviewQueue, { ...base, data: { items: [], total: 0 } }), /Không có yêu cầu/);
});
test('queue escapes developer text and links the exact review; paging remains bounded', () => {
  const { ReviewQueue } = load('src/components/MiniAppReview/ReviewQueue.tsx');
  const markup = render(ReviewQueue, { query: { page: 1, pageSize: 20 }, update() {}, reload() {}, data: { total: 1, items: [{ appId: 'app_test', appName: '<script>unsafe</script>', versionName: '1.0', developerName: 'Developer', developerEmail: 'dev@fixture.test', assignedAdminAccountId: null, review: { id: '11111111-1111-4111-8111-111111111111', versionCode: 1, status: 'PendingReview', submittedAt: '2026-10-21T00:00:00Z' } }] } });
  assert.match(markup, /&lt;script&gt;/); assert.doesNotMatch(markup, /<script>/);
  assert.match(markup, /mini-app-reviews\/11111111/); assert.match(markup, /Trang sau/);
  assert.match(markup, /<table/); assert.match(markup, /scope="col"/);
  assert.match(markup, /mini-review-status warning/); assert.match(markup, /Xem xét duyệt/);
});

test('filtered empty state offers reset and preserves accessible filter names', () => {
  const { ReviewQueue } = load('src/components/MiniAppReview/ReviewQueue.tsx');
  const markup = render(ReviewQueue, { query: { page: 1, pageSize: 20, search: 'Không tìm thấy', status: 'PendingReview' }, update() {}, reload() {}, data: { items: [], total: 0 } });
  assert.match(markup, /Xóa bộ lọc/); assert.match(markup, /Đang áp dụng bộ lọc/);
  for (const label of ['Tìm ứng dụng', 'Trạng thái', 'Thứ tự', 'Mỗi trang', 'Admin ID']) assert.ok(markup.includes(label));
  assert.doesNotMatch(markup, /<table/);
});

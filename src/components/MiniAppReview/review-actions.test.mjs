import assert from 'node:assert/strict';
import test from 'node:test';
import { load, render } from './test-support.mjs';
test('actions follow server capabilities and never offer owner publication', () => {
  const { ReviewActions } = load('src/components/MiniAppReview/ReviewActions.tsx', { '@tanstack/react-query': { useQueryClient: () => ({}) }, '../../hooks/useMiniAppReviews': { miniAppQueryKey: ['admin-mini-apps'] }, '../../services/admin-mini-app.service': {} });
  const markup = render(ReviewActions, { detail: { canStart: false, canAssign: false, canDecide: false, review: { review: { id: 'fixture', concurrencyToken: 'revision', status: 'Approved' } } }, refresh() {} });
  assert.doesNotMatch(markup, />Phê duyệt<|>Bắt đầu xét duyệt<|>Phát hành</);
  assert.match(markup, /không có thao tác/);
});
test('changes dialog requires reasons and structured field items; approval discloses exact target', () => {
  const { ReviewDecisionDialog } = load('src/components/MiniAppReview/ReviewDecisionDialog.tsx');
  const base = { target: '<script>app</script> · #4', busy: false, error: '', onCancel() {}, onConfirm() {} };
  const changes = render(ReviewDecisionDialog, { ...base, action: 'request-changes' });
  assert.match(changes, /minLength="10"/); assert.match(changes, /Trường cần sửa/); assert.match(changes, /Nội dung chỉnh sửa/);
  const approval = render(ReviewDecisionDialog, { ...base, action: 'approve' });
  assert.match(approval, /không tự phát hành/); assert.match(approval, /&lt;script&gt;app/);
});

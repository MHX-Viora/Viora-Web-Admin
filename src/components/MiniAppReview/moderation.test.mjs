import assert from 'node:assert/strict';
import test from 'node:test';
import { load, render } from './test-support.mjs';
test('moderation uses server capabilities and explains unpublished-after-restore', () => {
  const { ModerationDialog } = load('src/components/MiniAppReview/ModerationDialog.tsx', { '@tanstack/react-query': { useQueryClient: () => ({}) }, '../../hooks/useMiniAppReviews': { miniAppQueryKey: ['admin-mini-apps'] }, '../../services/admin-mini-app.service': {} });
  const base = { app: { appId: 'app_fixture', name: 'Fixture', canSuspend: false, canRestore: false }, publications: [] };
  assert.doesNotMatch(render(ModerationDialog, { detail: base, refresh() {} }), />Tạm ngưng ứng dụng<|>Khôi phục ứng dụng</);
  const markup = render(ModerationDialog, { detail: { ...base, app: { ...base.app, canRestore: true } }, refresh() {} });
  assert.match(markup, /Khôi phục ứng dụng/); assert.match(markup, /không tự phát hành/);
});

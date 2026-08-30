import assert from 'node:assert/strict';
import test from 'node:test';
import { filterNavigationItems } from '../src/layouts/admin-navigation.ts';

const items = [
  { to: '/users', label: 'Người dùng', group: 'Vận hành' },
  { to: '/identities', label: 'Xác thực danh tính', group: 'Kiểm duyệt' },
  { to: '/reports', label: 'Báo cáo', group: 'Kiểm duyệt' },
];

test('trả về mọi mục khi từ khóa trống', () => {
  assert.equal(filterNavigationItems(items, '   ').length, 3);
});

test('tìm không phân biệt hoa thường và dấu tiếng Việt', () => {
  assert.deepEqual(filterNavigationItems(items, 'nguoi dung').map((item) => item.to), ['/users']);
  assert.deepEqual(filterNavigationItems(items, 'XAC THUC').map((item) => item.to), ['/identities']);
});

test('có thể tìm theo nhóm công việc', () => {
  assert.deepEqual(filterNavigationItems(items, 'kiem duyet').map((item) => item.to), ['/identities', '/reports']);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const themeCss = readFileSync(new URL('../src/ankt-admin.css', import.meta.url), 'utf8');

test('thẻ thống kê chi tiết dùng màu nền theo theme', () => {
  assert.match(
    themeCss,
    /\.user-stat-card\s*\{[^}]*background:\s*var\(--surface-raised\)/s,
  );
});

test('form và panel trung tính dùng token thay vì nền sáng cố định', () => {
  assert.match(themeCss, /:is\(\.search-box,[^)]*textarea\)\s*\{[^}]*background:\s*var\(--surface\)/s);
  assert.match(themeCss, /:is\(\.detail-grid,[^)]*\.json-preview\)\s*\{[^}]*background:\s*var\(--surface-soft\)/s);
});

test('badge trạng thái dùng token màu ngữ nghĩa', () => {
  assert.match(themeCss, /:is\(\.status-badge\.active,[^)]*\.report-status-1\)\s*\{[^}]*color:\s*var\(--success\)/s);
  assert.match(themeCss, /:is\(\.status-badge\.pending,[^)]*\.report-status-0\)\s*\{[^}]*color:\s*var\(--warning\)/s);
  assert.match(themeCss, /:is\(\.status-badge\.locked,[^)]*\.report-hot\)\s*\{[^}]*color:\s*var\(--danger\)/s);
});

test('hàng bảng tương tác không rò nền sáng trong dark theme', () => {
  assert.match(themeCss, /\.table-wrap tr\.clickable:hover\s*\{[^}]*var\(--surface\)/s);
  assert.match(themeCss, /\.table-wrap tr\.clickable:focus-visible\s*\{[^}]*var\(--primary-soft\)/s);
});

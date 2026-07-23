import type { Identity, User } from './admin';

export type AdminUserDetail = User & {
  identity?: Identity | null;
};

export const roleLabels: Record<number, string> = {
  0: 'Người dùng',
  1: 'Kiểm duyệt viên',
  2: 'Quản trị viên',
};

export const accountStatusLabels: Record<number, string> = {
  0: 'Đã khóa',
  1: 'Đang hoạt động',
  2: 'Đã xóa',
};

export const identityStatusLabels: Record<number, string> = {
  1: 'Chờ duyệt',
  2: 'Đã duyệt',
  3: 'Từ chối',
};

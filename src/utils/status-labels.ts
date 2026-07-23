import type { Status } from '../types/admin';

const statusLabels: Record<string, string> = {
  active: 'Đang hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Đã khóa',
  pending: 'Chờ xử lý',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  hidden: 'Đã ẩn',
  deleted: 'Đã xóa',
  resolved: 'Đã xử lý',
  0: 'Chưa kích hoạt',
  1: 'Đang hoạt động',
  2: 'Đã khóa',
};

export function getStatusLabel(status: Status | string | number) {
  return statusLabels[status] ?? status;
}

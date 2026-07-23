const statusLabels: Record<string, string> = { 0: 'Đã khóa', 1: 'Đang hoạt động', 2: 'Đã xóa' };

export function UserStatusBadge({ status }: { status: string | number }) {
  return <span className={`detail-badge account-${status}`}>{statusLabels[String(status)] ?? status}</span>;
}

const identityLabels: Record<string, string> = { 0: 'Chưa xác thực', 1: 'Chờ duyệt', 2: 'Đã duyệt', 3: 'Từ chối' };

export function UserIdentityBadge({ status }: { status?: string | number }) {
  return <span className={`detail-badge identity-${status}`}>{identityLabels[String(status ?? 0)] ?? status}</span>;
}

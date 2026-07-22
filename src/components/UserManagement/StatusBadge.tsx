const statusLabels: Record<string, string> = { 0: 'Banned', 1: 'Active', 2: 'Deleted' };

export function UserStatusBadge({ status }: { status: string | number }) {
  return <span className={`detail-badge account-${status}`}>{statusLabels[String(status)] ?? status}</span>;
}

const identityLabels: Record<string, string> = { 0: 'Chưa xác thực', 1: 'Pending', 2: 'Approved', 3: 'Rejected' };

export function UserIdentityBadge({ status }: { status?: string | number }) {
  return <span className={`detail-badge identity-${status}`}>{identityLabels[String(status ?? 0)] ?? status}</span>;
}

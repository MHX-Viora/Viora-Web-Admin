const typeLabels: Record<number, string> = { 0: 'Bài viết', 1: 'Video' };
const statusLabels: Record<number, string> = { 0: 'Bản nháp', 1: 'Đã đăng', 2: 'Đã ẩn', 3: 'Đã xóa' };

export function PostTypeBadge({ type }: { type: number }) {
  return <span className={`post-badge post-type-${type}`}>{typeLabels[type] ?? type}</span>;
}

export function PostStatusBadge({ status }: { status: number }) {
  return <span className={`post-badge post-status-${status}`}>{statusLabels[status] ?? status}</span>;
}

export function ReportBadge({ count }: { count: number }) {
  return <span className={`post-badge report-${count > 0 ? 'hot' : 'none'}`}>{count}</span>;
}

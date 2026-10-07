export function DetailPostTypeBadge({ type }: { type: number }) {
  return <span className={`post-badge post-type-${type}`}>{type === 1 ? 'Video ngắn' : type === 2 ? 'Bài báo' : 'Bài viết'}</span>;
}

export function DetailPostStatusBadge({ status }: { status: number }) {
  const labels: Record<number, string> = { 0: 'Bản nháp', 1: 'Đã đăng', 2: 'Đã ẩn', 3: 'Đã xóa' };
  return <span className={`post-badge post-status-${status}`}>{labels[status] ?? 'Chưa xác định'}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: number }) {
  const labels: Record<number, string> = { 0: 'Công khai', 1: 'Người theo dõi', 2: 'Riêng tư' };
  return <span className={`post-badge visibility-${visibility}`}>{labels[visibility] ?? 'Chưa xác định'}</span>;
}

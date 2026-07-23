const statusLabels: Record<number, string> = { 0: 'Bản nháp', 1: 'Đã đăng', 2: 'Đã ẩn', 3: 'Đã xóa' };
const visibilityLabels: Record<number, string> = { 0: 'Công khai', 1: 'Người theo dõi', 2: 'Riêng tư' };

export function VideoTypeBadge() {
  return <span className="post-badge post-type-1">Video ngắn</span>;
}

export function VideoStatusBadge({ status }: { status: number }) {
  return <span className={`post-badge post-status-${status}`}>{statusLabels[status] ?? status}</span>;
}

export function VideoVisibilityBadge({ visibility }: { visibility: number }) {
  return <span className={`post-badge visibility-${visibility}`}>{visibilityLabels[visibility] ?? visibility}</span>;
}

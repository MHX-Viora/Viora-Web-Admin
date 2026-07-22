const statusLabels: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Hidden', 3: 'Deleted' };
const visibilityLabels: Record<number, string> = { 0: 'Public', 1: 'Followers', 2: 'Private' };

export function VideoTypeBadge() {
  return <span className="post-badge post-type-1">Video ngắn</span>;
}

export function VideoStatusBadge({ status }: { status: number }) {
  return <span className={`post-badge post-status-${status}`}>{statusLabels[status] ?? status}</span>;
}

export function VideoVisibilityBadge({ visibility }: { visibility: number }) {
  return <span className={`post-badge visibility-${visibility}`}>{visibilityLabels[visibility] ?? visibility}</span>;
}

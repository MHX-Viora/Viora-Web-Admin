export function DetailPostTypeBadge({ type }: { type: number }) {
  return <span className={`post-badge post-type-${type}`}>{type === 1 ? 'Video ngắn' : 'Bài viết'}</span>;
}

export function DetailPostStatusBadge({ status }: { status: number }) {
  const labels: Record<number, string> = { 0: 'Draft', 1: 'Published', 2: 'Hidden', 3: 'Deleted' };
  return <span className={`post-badge post-status-${status}`}>{labels[status] ?? status}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: number }) {
  const labels: Record<number, string> = { 0: 'Public', 1: 'Followers', 2: 'Private' };
  return <span className={`post-badge visibility-${visibility}`}>{labels[visibility] ?? visibility}</span>;
}

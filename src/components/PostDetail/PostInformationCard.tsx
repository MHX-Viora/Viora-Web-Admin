import type { AdminPostDetail } from '../../types/admin-post';
import { formatDate } from '../../utils/format';
import { DetailPostStatusBadge, DetailPostTypeBadge, VisibilityBadge } from './PostBadges';

export function PostInformationCard({ post }: { post: AdminPostDetail }) {
  return (
    <section className="user-card">
      <h2>Thông tin bài viết</h2>
      <div className="info-grid">
        <span>Post ID<strong className="mono-value">{post.id}</strong></span>
        <span>User ID<strong className="mono-value">{post.userId}</strong></span>
        <span>Địa điểm<strong>{post.location || '-'}</strong></span>
        <span>Ngày tạo<strong>{formatDate(post.createdAt)}</strong></span>
        <span>Visibility<strong><VisibilityBadge visibility={post.visibility} /></strong></span>
        <span>Status<strong><DetailPostStatusBadge status={post.status} /></strong></span>
        <span>Loại bài viết<strong><DetailPostTypeBadge type={post.postType} /></strong></span>
      </div>
    </section>
  );
}

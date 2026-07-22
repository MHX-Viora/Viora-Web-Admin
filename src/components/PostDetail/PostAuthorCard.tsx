import { Link } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { AdminPostDetail } from '../../types/admin-post';
import { DetailPostStatusBadge, DetailPostTypeBadge, VisibilityBadge } from './PostBadges';

export function PostAuthorCard({ post }: { post: AdminPostDetail }) {
  return (
    <section className="user-card post-author-detail">
      <div className="post-author-cell">
        <UserAvatar src={post.avatarUrl} name={post.displayName || 'User'} size="lg" />
        <div>
          <h2>{post.displayName || '-'}</h2>
          <span>{post.userId}</span>
          <Link className="btn" to={`/admin/users/${post.userId}`}>Xem người dùng</Link>
        </div>
      </div>
      <div className="badge-row">
        <DetailPostTypeBadge type={post.postType} />
        <DetailPostStatusBadge status={post.status} />
        <VisibilityBadge visibility={post.visibility} />
      </div>
    </section>
  );
}

import { TechnicalDetails } from '../TechnicalDetails';
import type { AdminPostDetail } from '../../types/admin-post';
import { formatDate } from '../../utils/format';
import { DetailPostStatusBadge, DetailPostTypeBadge, VisibilityBadge } from './PostBadges';

export function PostInformationCard({ post }: { post: AdminPostDetail }) {
  const label = post.postType === 2 ? 'bài báo' : 'bài viết';
  return (
    <section className="user-card">
      <h2>Thông tin {label}</h2>
      <div className="info-grid">
        <span>Địa điểm<strong>{post.location || '-'}</strong></span>
        <span>Ngày tạo<strong>{formatDate(post.createdAt)}</strong></span>
        <span>Hiển thị<strong><VisibilityBadge visibility={post.visibility} /></strong></span>
        <span>Trạng thái<strong><DetailPostStatusBadge status={post.status} /></strong></span>
        <span>Loại nội dung<strong><DetailPostTypeBadge type={post.postType} /></strong></span>
      </div>
      <TechnicalDetails values={{ [`Mã ${label}`]: post.id, 'Mã người đăng': post.userId }} />
    </section>
  );
}

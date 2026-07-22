import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { AdminPost } from '../../types/admin-post';
import { formatNumber } from '../../utils/format';
import { PostStatusBadge, PostTypeBadge, ReportBadge } from './PostBadges';

export function PostRow({ post }: { post: AdminPost }) {
  const navigate = useNavigate();
  const openDetail = () => navigate(`/admin/posts/${post.id}`);

  return (
    <tr onClick={openDetail}>
      <td>
        <div className="post-author-cell">
          <UserAvatar src={post.avatarUrl} name={post.displayName || 'User'} />
          <div><strong>{post.displayName || '-'}</strong><span>{post.userId}</span></div>
        </div>
      </td>
      <td><PostTypeBadge type={post.postType} /></td>
      <td><span className="post-content-clamp" title={post.content}>{post.content || '-'}</span></td>
      <td><PostStatusBadge status={post.status} /></td>
      <td>{formatNumber(post.reactionCount)}</td>
      <td>{formatNumber(post.commentCount)}</td>
      <td>{formatNumber(post.shareCount)}</td>
      <td><ReportBadge count={post.reportCount} /></td>
      <td><DateCell value={post.createdAt} /></td>
      <td><button className="btn" onClick={(event) => { event.stopPropagation(); openDetail(); }} type="button"><Eye size={16} />Xem</button></td>
    </tr>
  );
}

export function PostCardRow({ post }: { post: AdminPost }) {
  const navigate = useNavigate();
  return (
    <article className="mobile-user-card" onClick={() => navigate(`/admin/posts/${post.id}`)}>
      <UserAvatar src={post.avatarUrl} name={post.displayName || 'User'} />
      <div>
        <strong>{post.displayName || '-'}</strong>
        <span className="post-content-clamp">{post.content || '-'}</span>
        <div className="badge-row"><PostTypeBadge type={post.postType} /><PostStatusBadge status={post.status} /><ReportBadge count={post.reportCount} /></div>
      </div>
      <button className="btn" type="button"><Eye size={16} /></button>
    </article>
  );
}

function DateCell({ value }: { value: string }) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <>-</>;
  return <div className="date-cell"><strong>{date.toLocaleDateString('vi-VN')}</strong><span>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>;
}

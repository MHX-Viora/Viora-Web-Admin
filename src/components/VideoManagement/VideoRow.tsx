import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { AdminVideo } from '../../types/admin-video';
import { formatNumber } from '../../utils/format';
import { PostStatusBadge, PostTypeBadge, ReportBadge } from '../PostManagement/PostBadges';

export function VideoRow({ video }: { video: AdminVideo }) {
  const navigate = useNavigate();
  const openDetail = () => navigate(`/admin/videos/${video.id}`);

  return (
    <tr onClick={openDetail}>
      <td className="column-author"><div className="post-author-cell"><UserAvatar src={video.avatarUrl} name={video.displayName || 'User'} /><div><strong>{video.displayName || '-'}</strong><span>{video.userId}</span></div></div></td>
      <td className="column-type table-column-secondary"><PostTypeBadge type={1} /></td>
      <td className="column-content"><span className="post-content-clamp" title={video.content}>{video.content || '-'}</span></td>
      <td className="column-status"><PostStatusBadge status={video.status} /></td>
      <td className="column-engagement table-column-secondary">{formatNumber(video.reactionCount)}</td>
      <td className="column-engagement table-column-secondary">{formatNumber(video.commentCount)}</td>
      <td className="column-engagement table-column-secondary">{formatNumber(video.shareCount)}</td>
      <td className="column-report"><ReportBadge count={video.reportCount} /></td>
      <td className="column-date"><DateCell value={video.createdAt} /></td>
      <td className="column-action"><button aria-label="Xem chi tiết video" className="table-action-button" onClick={(event) => { event.stopPropagation(); openDetail(); }} title="Xem chi tiết" type="button"><Eye size={16} /></button></td>
    </tr>
  );
}

export function VideoCardRow({ video }: { video: AdminVideo }) {
  const navigate = useNavigate();
  return (
    <article className="mobile-user-card" onClick={() => navigate(`/admin/videos/${video.id}`)}>
      <UserAvatar src={video.avatarUrl} name={video.displayName || 'User'} />
      <div>
        <strong>{video.displayName || '-'}</strong>
        <span className="post-content-clamp">{video.content || '-'}</span>
        <div className="badge-row"><PostTypeBadge type={1} /><PostStatusBadge status={video.status} /><ReportBadge count={video.reportCount} /></div>
      </div>
      <button aria-label="Xem chi tiết video" className="btn" type="button"><Eye size={16} /></button>
    </article>
  );
}

function DateCell({ value }: { value: string }) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <>-</>;
  return <div className="date-cell"><strong>{date.toLocaleDateString('vi-VN')}</strong><span>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>;
}

import { Link } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { AdminVideoDetail } from '../../types/admin-video';
import { VideoStatusBadge, VideoTypeBadge, VideoVisibilityBadge } from './VideoBadges';

export function VideoAuthorCard({ video }: { video: AdminVideoDetail }) {
  return (
    <section className="user-card post-author-detail">
      <Link className="post-author-cell clean-link" to={`/admin/users/${video.userId}`}>
        <UserAvatar src={video.avatarUrl} name={video.displayName || 'User'} size="lg" />
        <div>
          <h2>{video.displayName || '-'}</h2>
          <span>{video.userId}</span>
          <small>Xem người dùng</small>
        </div>
      </Link>
      <div className="badge-row">
        <VideoTypeBadge />
        <VideoStatusBadge status={video.status} />
        <VideoVisibilityBadge visibility={video.visibility} />
      </div>
    </section>
  );
}

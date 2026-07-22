import type { AdminVideoDetail } from '../../types/admin-video';
import { formatDate } from '../../utils/format';
import { VideoStatusBadge, VideoTypeBadge, VideoVisibilityBadge } from './VideoBadges';

export function VideoInformationCard({ video }: { video: AdminVideoDetail }) {
  return (
    <section className="user-card">
      <h2>Thông tin Video</h2>
      <div className="info-grid">
        <span>Video ID<strong className="mono-value">{video.id}</strong></span>
        <span>User ID<strong className="mono-value">{video.userId}</strong></span>
        <span>Địa điểm<strong>{video.location || '-'}</strong></span>
        <span>Ngày đăng<strong>{formatDate(video.createdAt)}</strong></span>
        <span>Visibility<strong><VideoVisibilityBadge visibility={video.visibility} /></strong></span>
        <span>Status<strong><VideoStatusBadge status={video.status} /></strong></span>
        <span>Loại<strong><VideoTypeBadge /></strong></span>
      </div>
    </section>
  );
}

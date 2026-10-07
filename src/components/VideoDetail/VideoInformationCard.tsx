import { TechnicalDetails } from '../TechnicalDetails';
import type { AdminVideoDetail } from '../../types/admin-video';
import { formatDate } from '../../utils/format';
import { VideoStatusBadge, VideoTypeBadge, VideoVisibilityBadge } from './VideoBadges';

export function VideoInformationCard({ video }: { video: AdminVideoDetail }) {
  return (
    <section className="user-card">
      <h2>Thông tin video</h2>
      <div className="info-grid">
        <span>Địa điểm<strong>{video.location || '-'}</strong></span>
        <span>Ngày đăng<strong>{formatDate(video.createdAt)}</strong></span>
        <span>Hiển thị<strong><VideoVisibilityBadge visibility={video.visibility} /></strong></span>
        <span>Trạng thái<strong><VideoStatusBadge status={video.status} /></strong></span>
        <span>Loại<strong><VideoTypeBadge /></strong></span>
      </div>
      <TechnicalDetails values={{ 'Mã video': video.id, 'Mã người đăng': video.userId }} />
    </section>
  );
}

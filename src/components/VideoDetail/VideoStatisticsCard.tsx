import { Bookmark, Eye, Flag, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import type { AdminVideoDetail } from '../../types/admin-video';
import { formatNumber } from '../../utils/format';

const stats = [
  ['reactionCount', 'Reaction', Heart],
  ['commentCount', 'Comment', MessageCircle],
  ['shareCount', 'Share', Repeat2],
  ['saveCount', 'Save', Bookmark],
  ['viewCount', 'View', Eye],
  ['reportCount', 'Report', Flag],
] as const;

export function VideoStatisticsCard({ video }: { video: AdminVideoDetail }) {
  return (
    <section className="user-card">
      <h2>Thống kê</h2>
      <div className="user-stat-grid">
        {stats.map(([key, label, Icon]) => (
          <div className={`user-stat-card ${key === 'reportCount' && video.reportCount > 0 ? 'danger-stat' : ''}`} key={key}>
            <Icon size={20} />
            <strong>{formatNumber(video[key])}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

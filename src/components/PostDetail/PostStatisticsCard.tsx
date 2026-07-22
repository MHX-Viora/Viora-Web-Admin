import { Bookmark, Eye, Flag, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import type { AdminPostDetail } from '../../types/admin-post';
import { formatNumber } from '../../utils/format';

const stats = [
  ['reactionCount', 'Reaction', Heart],
  ['commentCount', 'Comment', MessageCircle],
  ['shareCount', 'Share', Repeat2],
  ['saveCount', 'Save', Bookmark],
  ['viewCount', 'View', Eye],
  ['reportCount', 'Report', Flag],
] as const;

export function PostStatisticsCard({ post }: { post: AdminPostDetail }) {
  return (
    <section className="user-card">
      <h2>Thống kê</h2>
      <div className="user-stat-grid">
        {stats.map(([key, label, Icon]) => (
          <div className="user-stat-card" key={key}>
            <Icon size={20} />
            <strong>{formatNumber(post[key])}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

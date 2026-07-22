import { FileText, Flag, UserRoundCheck, Users, Video } from 'lucide-react';
import type { AdminUserDetail } from '../../types/admin-user';
import { formatNumber } from '../../utils/format';

const statConfig = [
  ['postCount', 'Bài viết', FileText],
  ['videoCount', 'Video', Video],
  ['friendCount', 'Bạn bè', UserRoundCheck],
  ['followerCount', 'Follower', Users],
  ['followingCount', 'Following', Users],
  ['reportCount', 'Report', Flag],
] as const;

export function UserStatisticsCard({ user }: { user: AdminUserDetail }) {
  return (
    <section className="user-card">
      <h2>Thống kê</h2>
      <div className="user-stat-grid">
        {statConfig.map(([key, label, Icon]) => (
          <div className="user-stat-card" key={key}>
            <Icon size={20} />
            <strong>{formatNumber(user[key])}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

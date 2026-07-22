import { Flag, Heart, MessageCircle, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdminVideo } from '../../types/admin-video';
import { formatNumber } from '../../utils/format';

export function VideoStatisticsCards({ videos, total }: { videos: AdminVideo[]; total: number }) {
  const reactionTotal = videos.reduce((sum, video) => sum + video.reactionCount, 0);
  const commentTotal = videos.reduce((sum, video) => sum + video.commentCount, 0);
  const reportedTotal = videos.filter((video) => video.reportCount > 0).length;

  return (
    <div className="video-stat-grid">
      <QuickStat icon={<Video size={22} />} label="Tổng Video" value={total} />
      <QuickStat icon={<Heart size={22} />} label="Tổng Reaction" value={reactionTotal} />
      <QuickStat icon={<MessageCircle size={22} />} label="Tổng Comment" value={commentTotal} />
      <QuickStat icon={<Flag size={22} />} label="Video bị báo cáo" value={reportedTotal} danger />
    </div>
  );
}

function QuickStat({ icon, label, value, danger }: { icon: ReactNode; label: string; value: number; danger?: boolean }) {
  return (
    <div className={`video-stat-card ${danger ? 'danger' : ''}`}>
      <span>{icon}</span>
      <strong>{formatNumber(value)}</strong>
      <small>{label}</small>
    </div>
  );
}

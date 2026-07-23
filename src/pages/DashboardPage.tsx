import { useQuery } from '@tanstack/react-query';
import { Activity, FileText, Flag, MessageCircle, MessageSquare, ShieldCheck, UserPlus, Users, Video } from 'lucide-react';
import { ErrorView, Loading, PageHeader, StatCard } from '../components/common';
import { getDashboardStats } from '../services/admin-dashboard.service';
import { getErrorMessage } from '../services/http';
import { formatNumber } from '../utils/format';

const stats = [
  ['totalUsers', 'Tổng người dùng', Users, 'blue'],
  ['newUsersToday', 'Người dùng mới hôm nay', UserPlus, 'green'],
  ['activeUsersToday', 'Hoạt động hôm nay', Activity, 'info'],
  ['totalPosts', 'Tổng bài viết', FileText, 'warning'],
  ['todayPosts', 'Bài viết hôm nay', FileText, 'green'],
  ['totalVideos', 'Tổng video', Video, 'rose'],
  ['todayVideos', 'Video hôm nay', Video, 'info'],
  ['totalComments', 'Tổng bình luận', MessageCircle, 'blue'],
  ['chatRooms', 'Phòng chat', MessageSquare, 'info'],
  ['pendingReports', 'Báo cáo chờ xử lý', Flag, 'red'],
  ['pendingIdentities', 'CCCD chờ duyệt', ShieldCheck, 'warning'],
] as const;

export function DashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats });

  return (
    <section className="dashboard-page">
      <PageHeader title="Bảng điều khiển" description="Tổng quan vận hành, kiểm duyệt và hoạt động người dùng của Viora." />
      {query.isLoading ? <Loading rows={9} /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <div className="stats-grid">
          {stats.map(([key, label, Icon, tone]) => (
            <StatCard key={key} icon={<Icon size={20} />} label={label} value={formatNumber(query.data[key])} tone={tone} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

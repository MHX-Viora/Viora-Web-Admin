import { useQuery } from '@tanstack/react-query';
import { Activity, FileText, Flag, MessageCircle, MessageSquare, RefreshCw, ShieldCheck, UserPlus, Users, Video } from 'lucide-react';
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
  const today = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'full',
  }).format(new Date());

  return (
    <section className="dashboard-page">
      <PageHeader
        eyebrow="Tổng quan hệ thống"
        title="Bảng điều khiển"
        description={`Theo dõi tăng trưởng, nội dung và hàng đợi kiểm duyệt · ${today}`}
        actions={(
          <button className="btn primary" disabled={query.isFetching} onClick={() => void query.refetch()} type="button">
            <RefreshCw className={query.isFetching ? 'spin' : undefined} size={17} />
            Làm mới dữ liệu
          </button>
        )}
      />
      {query.isLoading ? <Loading rows={9} /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <div className="dashboard-summary">
            <div><span>Người dùng hôm nay</span><strong>{formatNumber(query.data.activeUsersToday)}</strong><small>trên {formatNumber(query.data.totalUsers)} tài khoản</small></div>
            <div><span>Nội dung mới</span><strong>{formatNumber(query.data.todayPosts + query.data.todayVideos)}</strong><small>bài viết và video hôm nay</small></div>
            <div><span>Cần xử lý</span><strong>{formatNumber(query.data.pendingReports + query.data.pendingIdentities)}</strong><small>báo cáo và xác minh đang chờ</small></div>
          </div>
          <div className="section-heading"><div><span>Chỉ số nhanh</span><h2>Hoạt động nền tảng</h2></div><p>Dữ liệu cập nhật từ hệ thống quản trị hiện tại.</p></div>
          <div className="stats-grid">
            {stats.map(([key, label, Icon, tone]) => (
              <StatCard key={key} icon={<Icon size={20} />} label={label} value={formatNumber(query.data[key])} tone={tone} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

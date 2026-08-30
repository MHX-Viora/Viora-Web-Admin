import { useQuery } from '@tanstack/react-query';
import {
  Activity, ArrowUpRight, FileText, Flag, MessageCircle, MessageSquare,
  RefreshCw, ShieldCheck, UserPlus, Users, Video,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorView, Loading, PageHeader } from '../components/common';
import { getDashboardStats } from '../services/admin-dashboard.service';
import { getErrorMessage } from '../services/http';
import type { DashboardStats } from '../types/admin';
import { formatNumber } from '../utils/format';

function percentage(value: number, total: number) {
  if (total <= 0) return '0%';
  return `${Math.min(100, Math.round((value / total) * 100))}%`;
}

function DashboardContent({ data, updatedAt }: { data: DashboardStats; updatedAt: number }) {
  const newContent = data.todayPosts + data.todayVideos;
  const pendingWork = data.pendingReports + data.pendingIdentities;
  const contentTotal = data.totalPosts + data.totalVideos;
  const queueMax = Math.max(pendingWork, 1);
  const contentMax = Math.max(data.totalPosts, data.totalVideos, data.totalComments, 1);
  const headlineMetrics = [
    { label: 'Người dùng hoạt động', value: data.activeUsersToday, detail: `${percentage(data.activeUsersToday, data.totalUsers)} trên tổng tài khoản`, icon: Activity, tone: 'cyan', to: '/users' },
    { label: 'Người dùng mới', value: data.newUsersToday, detail: 'Ghi nhận trong hôm nay', icon: UserPlus, tone: 'violet', to: '/users' },
    { label: 'Nội dung mới', value: newContent, detail: `${formatNumber(data.todayPosts)} bài viết · ${formatNumber(data.todayVideos)} video`, icon: FileText, tone: 'blue', to: '/posts' },
    { label: 'Đang chờ xử lý', value: pendingWork, detail: 'Báo cáo và xác minh danh tính', icon: Flag, tone: 'danger', to: '/reports' },
  ] as const;
  const overviewRows = [
    { label: 'Người dùng', icon: Users, total: data.totalUsers, today: data.newUsersToday, secondary: `${formatNumber(data.activeUsersToday)} đang hoạt động`, to: '/users' },
    { label: 'Bài viết', icon: FileText, total: data.totalPosts, today: data.todayPosts, secondary: `${formatNumber(data.totalComments)} bình luận`, to: '/posts' },
    { label: 'Video ngắn', icon: Video, total: data.totalVideos, today: data.todayVideos, secondary: 'Nội dung video trên hệ thống', to: '/videos' },
    { label: 'Phòng trò chuyện', icon: MessageSquare, total: data.chatRooms, today: null, secondary: 'Không gian trao đổi đang quản lý', to: '/chat-rooms' },
  ] as const;
  const queueItems = [
    { label: 'Báo cáo nội dung', value: data.pendingReports, icon: Flag, to: '/reports', tone: 'danger' },
    { label: 'Xác minh danh tính', value: data.pendingIdentities, icon: ShieldCheck, to: '/identities', tone: 'warning' },
  ] as const;
  const contentItems = [
    { label: 'Bài viết', value: data.totalPosts, icon: FileText },
    { label: 'Video', value: data.totalVideos, icon: Video },
    { label: 'Bình luận', value: data.totalComments, icon: MessageCircle },
  ] as const;

  return (
    <>
      <section aria-label="Chỉ số quan trọng" className="dashboard-kpis">
        {headlineMetrics.map(({ label, value, detail, icon: Icon, tone, to }) => (
          <Link className={`dashboard-kpi ${tone}`} key={label} to={to}>
            <span className="dashboard-kpi-icon"><Icon aria-hidden size={20} /></span>
            <span className="dashboard-kpi-label">{label}</span>
            <strong>{formatNumber(value)}</strong>
            <small>{detail}</small>
            <ArrowUpRight aria-hidden className="dashboard-kpi-arrow" size={17} />
          </Link>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-overview" aria-labelledby="overview-title">
          <div className="dashboard-panel-header">
            <div><span>Tổng hợp vận hành</span><h2 id="overview-title">Số liệu theo khu vực</h2></div>
            <small>Cập nhật lúc {new Date(updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Hạng mục</th><th>Tổng hiện có</th><th>Hôm nay</th><th>Chỉ số liên quan</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
              <tbody>
                {overviewRows.map(({ label, icon: Icon, total, today, secondary, to }) => (
                  <tr key={label}>
                    <td><span className="dashboard-row-label"><Icon aria-hidden size={17} /><strong>{label}</strong></span></td>
                    <td className="numeric-cell">{formatNumber(total)}</td>
                    <td className="numeric-cell">{today === null ? '—' : `+${formatNumber(today)}`}</td>
                    <td><span className="dashboard-secondary">{secondary}</span></td>
                    <td><Link aria-label={`Quản lý ${label}`} className="dashboard-row-link" to={to}>Quản lý <ArrowUpRight aria-hidden size={14} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="dashboard-panel dashboard-queue" aria-labelledby="queue-title">
          <div className="dashboard-panel-header">
            <div><span>Ưu tiên hôm nay</span><h2 id="queue-title">Hàng đợi xử lý</h2></div>
            <strong className="queue-total">{formatNumber(pendingWork)}</strong>
          </div>
          <div className="queue-list">
            {queueItems.map(({ label, value, icon: Icon, to, tone }) => (
              <Link className={`queue-item ${tone}`} key={label} to={to}>
                <span className="queue-icon"><Icon aria-hidden size={18} /></span>
                <span><strong>{label}</strong><small>{value > 0 ? 'Cần quản trị viên kiểm tra' : 'Không có mục đang chờ'}</small></span>
                <b>{formatNumber(value)}</b>
                <progress aria-label={`${label}: ${value}`} max={queueMax} value={value} />
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <section className="dashboard-panel content-distribution" aria-labelledby="content-title">
        <div className="dashboard-panel-header">
          <div><span>Quy mô dữ liệu</span><h2 id="content-title">Phân bổ nội dung cộng đồng</h2></div>
          <strong>{formatNumber(contentTotal)} <small>bài viết và video</small></strong>
        </div>
        <div className="content-bars">
          {contentItems.map(({ label, value, icon: Icon }) => (
            <div className="content-bar" key={label}>
              <span><Icon aria-hidden size={16} />{label}</span><strong>{formatNumber(value)}</strong>
              <progress aria-label={`${label}: ${value}`} max={contentMax} value={value} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function DashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats });
  const today = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date());

  return (
    <section className="dashboard-page">
      <PageHeader
        eyebrow="Trung tâm vận hành"
        title="Tổng quan hệ thống"
        description={`Theo dõi tăng trưởng, nội dung và các công việc cần xử lý · ${today}`}
        actions={<button className="btn primary" disabled={query.isFetching} onClick={() => void query.refetch()} type="button"><RefreshCw className={query.isFetching ? 'spin' : undefined} size={17} />Làm mới dữ liệu</button>}
      />
      {query.isLoading ? <Loading rows={7} /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <DashboardContent data={query.data} updatedAt={query.dataUpdatedAt} /> : null}
    </section>
  );
}

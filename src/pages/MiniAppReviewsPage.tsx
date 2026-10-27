import { statusLabel } from '../types/mini-app-review';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCheck, ClipboardList, Clock3, FilePenLine, LayoutGrid, ListFilter, PauseCircle, RefreshCw, Send, XCircle } from 'lucide-react';
import { PageHeader } from '../components/common';
import { ReviewQueue, ReviewError } from '../components/MiniAppReview/ReviewQueue';
import { useMiniAppOverview, useMiniAppReviews } from '../hooks/useMiniAppReviews';
import '../components/MiniAppReview/mini-app-review.css';

const metrics = [
  { status: 'PendingReview', icon: Clock3, tone: 'warning' },
  { status: 'InReview', icon: ClipboardList, tone: 'info' },
  { status: 'ChangesRequested', icon: FilePenLine, tone: 'warning' },
  { status: 'Rejected', icon: XCircle, tone: 'danger' },
  { status: 'Approved', icon: CheckCheck, tone: 'success' },
] as const;

export function MiniAppReviewsPage() {
  const { query, result, update } = useMiniAppReviews();
  const overview = useMiniAppOverview();
  const refreshing = result.isFetching || overview.isFetching;
  return <section className="mini-review-page mini-review-dashboard">
    <PageHeader eyebrow="QUẢN LÝ MINI APP" title="Kiểm duyệt Mini App" description="Theo dõi yêu cầu, xét duyệt phiên bản và quản lý trạng thái phát hành." actions={<button type="button" className="btn" disabled={refreshing} onClick={() => { void result.refetch(); void overview.refetch(); }}><RefreshCw size={16} className={refreshing ? 'mini-review-spinning' : ''} aria-hidden="true" />Tải lại</button>} />
    <nav className="mini-review-tabs" aria-label="Quản lý Mini App"><Link aria-current="page" to="/mini-app-reviews"><ClipboardList size={17} aria-hidden="true" />Hàng đợi & lịch sử</Link><Link to="/mini-apps"><LayoutGrid size={17} aria-hidden="true" />Ứng dụng & phát hành</Link></nav>
    <div className="mini-review-overview-heading"><h2>Tổng quan kiểm duyệt</h2><span>Phê duyệt không tự phát hành</span></div>
    {overview.isError && <ReviewError error={overview.error} reload={() => void overview.refetch()} />}
    {overview.isPending && <div className="mini-review-counts" role="status" aria-label="Đang tải thống kê">{Array.from({ length: 7 }, (_, index) => <div key={index} className="mini-review-metric-skeleton" aria-hidden="true"><span /><strong /></div>)}</div>}
    {overview.data && <div className="mini-review-counts" aria-label="Thống kê Mini App">{metrics.map(({ status, icon: Icon, tone }) => <button type="button" className={`mini-review-metric ${tone}`} key={status} aria-pressed={query.status === status} onClick={() => update({ status })}><span className="mini-review-metric-top"><span className="mini-review-metric-icon"><Icon size={18} aria-hidden="true" /></span><ListFilter size={13} aria-hidden="true" /></span><strong>{overview.data.reviews[status].toLocaleString('vi-VN')}</strong><span>{statusLabel[status]}</span></button>)}
      <Link className="mini-review-metric success" to="/mini-apps?view=published"><span className="mini-review-metric-top"><span className="mini-review-metric-icon"><Send size={18} aria-hidden="true" /></span><ArrowUpRight size={14} aria-hidden="true" /></span><strong>{overview.data.publishedApps.toLocaleString('vi-VN')}</strong><span>Đang phát hành</span></Link>
      <Link className="mini-review-metric neutral" to="/mini-apps?view=suspended"><span className="mini-review-metric-top"><span className="mini-review-metric-icon"><PauseCircle size={18} aria-hidden="true" /></span><ArrowUpRight size={14} aria-hidden="true" /></span><strong>{overview.data.suspendedApps.toLocaleString('vi-VN')}</strong><span>Tạm ngưng</span></Link></div>}
    <ReviewQueue query={query} update={update} data={result.data} loading={result.isPending} error={result.error} reload={() => void result.refetch()} />
  </section>;
}

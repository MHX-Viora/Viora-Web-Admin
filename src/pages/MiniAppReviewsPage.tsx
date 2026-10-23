import { statusLabel } from '../types/mini-app-review';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { ReviewQueue, ReviewError } from '../components/MiniAppReview/ReviewQueue';
import { useMiniAppOverview, useMiniAppReviews } from '../hooks/useMiniAppReviews';
import '../components/MiniAppReview/mini-app-review.css';

export function MiniAppReviewsPage() {
  const { query, result, update } = useMiniAppReviews();
  const overview = useMiniAppOverview();
  return <section className="mini-review-page">
    <PageHeader title="Kiểm duyệt Mini App" description="Xét duyệt phiên bản đã gửi. Phê duyệt không tự phát hành." actions={<button type="button" className="btn" onClick={() => { void result.refetch(); void overview.refetch(); }}>Tải lại</button>} />
    <nav className="mini-review-tabs" aria-label="Quản lý Mini App"><Link aria-current="page" to="/mini-app-reviews">Hàng đợi & lịch sử</Link><Link to="/mini-apps">Ứng dụng & phát hành</Link></nav>
    {overview.isError && <ReviewError error={overview.error} reload={() => void overview.refetch()} />}
    {overview.data && <div className="mini-review-counts">{Object.entries(overview.data.reviews).map(([status, count]) => <button type="button" key={status} onClick={() => update({ status })}><span>{statusLabel[status]}</span><strong>{count}</strong></button>)}<Link to="/mini-apps?view=published">Đang phát hành <strong>{overview.data.publishedApps}</strong></Link><Link to="/mini-apps?view=suspended">Tạm ngưng <strong>{overview.data.suspendedApps}</strong></Link></div>}
    <ReviewQueue query={query} update={update} data={result.data} loading={result.isPending} error={result.error} reload={() => void result.refetch()} />
  </section>;
}

import { Link, useParams } from 'react-router-dom';
import { useMiniAppReview } from '../hooks/useMiniAppReviews';
import { ReviewError, ReviewStatus } from '../components/MiniAppReview/ReviewQueue';
import { ReviewSnapshot } from '../components/MiniAppReview/ReviewSnapshot';
import { ReviewTimeline } from '../components/MiniAppReview/ReviewTimeline';
import { ReviewActions } from '../components/MiniAppReview/ReviewActions';
import '../components/MiniAppReview/mini-app-review.css';

export function MiniAppReviewDetailPage() {
  const { id = '' } = useParams();
  const result = useMiniAppReview(id);
  const data = result.data;
  return <section className="mini-review-page"><Link to="/mini-app-reviews">← Hàng đợi xét duyệt</Link>
    {result.isPending && <p role="status">Đang tải phiên bản đã gửi…</p>}
    {result.isError && <ReviewError error={result.error} reload={() => void result.refetch()} />}
    {!result.isError && data && <>
      <header className="mini-review-heading"><div><p className="muted">{data.appId} · #{data.review.review.versionCode} · {data.review.versionName}</p><h1>{data.review.snapshot.name}</h1><ReviewStatus status={data.review.review.status} /></div><button className="btn" type="button" disabled={result.isFetching} onClick={() => void result.refetch()}>Tải lại trạng thái</button></header>
      <section className="mini-review-section"><h2>Nhà phát triển</h2><p>{data.developerName} · {data.developerEmail}</p><p>{data.assignedAdminAccountId ? `Admin được giao: ${data.assignedAdminAccountId}` : 'Chưa giao người xét duyệt'}</p><Link to={`/mini-apps/${data.appId}`}>Ứng dụng & lịch sử phát hành</Link></section>
      <ReviewActions key={id} detail={data} refreshing={result.isFetching} refresh={() => void result.refetch()} />
      <ReviewSnapshot snapshot={data.review.snapshot} /><ReviewTimeline detail={data.review} />
      <details className="mini-review-section"><summary>Định danh phiên bản</summary><dl className="mini-review-facts"><dt>Version ID</dt><dd>{data.review.review.versionId}</dd><dt>SHA-256</dt><dd><code>{data.review.snapshotHash}</code></dd></dl></details>
    </>}
  </section>;
}

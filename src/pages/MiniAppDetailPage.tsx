import { Link, useParams } from 'react-router-dom';
import { useMiniApp } from '../hooks/useMiniAppReviews';
import { ReviewError, ReviewStatus } from '../components/MiniAppReview/ReviewQueue';
import { ReviewSnapshot } from '../components/MiniAppReview/ReviewSnapshot';
import { ModerationDialog } from '../components/MiniAppReview/ModerationDialog';
import '../components/MiniAppReview/mini-app-review.css';
export function MiniAppDetailPage() {
  const { id = '' } = useParams(), result = useMiniApp(id), detail = result.data;
  return <section className="mini-review-page"><Link to="/mini-apps">← Ứng dụng & phát hành</Link>
    {result.isPending && <p role="status">Đang tải trạng thái ứng dụng…</p>}{result.isError && <ReviewError error={result.error} reload={() => void result.refetch()} />}
    {!result.isError && detail && <><header className="mini-review-heading"><div><h1>{detail.app.name}</h1><p>{detail.app.appId} · {detail.app.developerName} · {detail.app.developerEmail}</p><ReviewStatus status={detail.app.operationalStatus} /><p>{detail.app.publicationId ? 'Production đang phát hành' : 'Production chưa phát hành'}</p></div><button type="button" className="btn" disabled={result.isFetching} onClick={() => void result.refetch()}>Tải lại trạng thái</button></header>
      <section className="mini-review-section"><h2>Lý do vận hành gần nhất</h2><p className="mini-review-prose">{detail.app.operationalReason || 'Chưa có thay đổi vận hành.'}</p></section><ModerationDialog key={id} detail={detail} refreshing={result.isFetching} refresh={() => void result.refetch()} />
      {detail.publishedSnapshot ? <ReviewSnapshot snapshot={detail.publishedSnapshot} title="Bản chụp Production đang phát hành" /> : <section className="mini-review-section"><h2>Production</h2><p>Chưa phát hành. Khôi phục không tự đưa phiên bản cũ trở lại Production.</p></section>}
      <section className="mini-review-section"><h2>Lịch sử phát hành</h2><p>Tối đa 20 lần gần nhất.</p>{detail.publications.length === 0 ? <p>Chưa có lần phát hành.</p> : <ol className="mini-review-timeline">{detail.publications.map(publication => <li key={publication.id}><ReviewStatus status={publication.status} /><p><time dateTime={publication.publishedAt}>{new Date(publication.publishedAt).toLocaleString('vi-VN')}</time>{publication.unpublishedAt && <> → <time dateTime={publication.unpublishedAt}>{new Date(publication.unpublishedAt).toLocaleString('vi-VN')}</time></>}</p><Link to={`/mini-app-reviews/${publication.reviewId}`}>Xem quyết định đã duyệt</Link><p>Version: {publication.versionId}</p>{publication.suspensionReason && <p className="mini-review-prose">{publication.suspensionReason}</p>}</li>)}</ol>}</section>
      <section className="mini-review-section"><h2>Phiên bản gần nhất</h2><p>Tối đa 20 phiên bản; trạng thái bản chụp độc lập với quyết định xét duyệt.</p><ol className="mini-review-timeline">{detail.versions.map(version => <li key={version.id}><strong>#{version.versionCode} · {version.versionName}</strong> · <ReviewStatus status={version.state} /><p>{version.id}{version.id === detail.app.publishedVersionId ? ' · Đang phát hành' : ''}</p></li>)}</ol></section>
    </>}
  </section>;
}

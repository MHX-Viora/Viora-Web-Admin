import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { useMiniApps } from '../hooks/useMiniAppReviews';
import { ReviewError, ReviewPagination, ReviewStatus } from '../components/MiniAppReview/ReviewQueue';
import '../components/MiniAppReview/mini-app-review.css';
export function MiniAppsPage() {
  const { query, result, update } = useMiniApps();
  return <section className="mini-review-page"><PageHeader title="Mini App · Vận hành & phát hành" description="Theo dõi trạng thái độc lập với bản nháp và lịch sử xét duyệt." actions={<button type="button" className="btn" disabled={result.isFetching} onClick={() => void result.refetch()}>Tải lại</button>} />
    <nav className="mini-review-tabs" aria-label="Quản lý Mini App"><Link to="/mini-app-reviews">Hàng đợi & lịch sử</Link><Link aria-current="page" to="/mini-apps">Ứng dụng & phát hành</Link></nav>
    <form key={query.search} className="mini-review-filters" onSubmit={event => { event.preventDefault(); update({ search: String(new FormData(event.currentTarget).get('search') ?? '').trim() }); }}><label>Tìm tên / mã ứng dụng<input type="search" name="search" defaultValue={query.search} maxLength={128} /></label><button className="btn" type="submit">Tìm kiếm</button><label>Trạng thái<select value={query.view ?? ''} onChange={event => update({ view: event.target.value })}><option value="">Tất cả ứng dụng</option><option value="published">Đang phát hành</option><option value="suspended">Tạm ngưng</option></select></label></form>
    {result.isPending && <p role="status">Đang tải ứng dụng…</p>}{result.isError && <ReviewError error={result.error} reload={() => void result.refetch()} />}
    {!result.isError && result.data && <>{result.data.items.length === 0 ? <p role="status">Không có ứng dụng phù hợp.</p> : <ol className="mini-review-queue">{result.data.items.map(item => <li key={item.appId}><div><Link to={`/mini-apps/${item.appId}`}><strong>{item.name}</strong></Link><p>{item.appId}</p><p>{item.developerName} · {item.developerEmail}</p></div><div><ReviewStatus status={item.operationalStatus} /><p>{item.publicationId ? 'Production đang phát hành' : 'Production chưa phát hành'}</p></div></li>)}</ol>}<ReviewPagination page={query.page} pageSize={query.pageSize} total={result.data.total} update={update} /></>}
  </section>;
}

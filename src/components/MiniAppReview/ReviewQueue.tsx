import { Link } from 'react-router-dom';
import type { QueueQuery, ReviewPage } from '../../types/mini-app-review';
import { reviewStatuses, statusLabel } from '../../types/mini-app-review';
import { ReviewLogo } from './ReviewSnapshot';
import { ArrowRight, ChevronLeft, ChevronRight, Filter, Inbox, Search, SlidersHorizontal } from 'lucide-react';
import { ErrorView } from '../common';


export function ReviewStatus({ status }: { status: string }) {
  const tone = status === 'PendingReview' || status === 'ChangesRequested' ? 'warning' : status === 'InReview' ? 'info' : status === 'Approved' || status === 'Published' || status === 'Active' ? 'success' : status === 'Rejected' || status === 'Suspended' ? 'danger' : 'neutral';
  return <span className={`mini-review-status ${tone}`}><span aria-hidden="true" />{statusLabel[status] ?? status}</span>;
}
export function ReviewError({ error, reload }: { error: Error; reload: () => void }) { return <ErrorView message={error.message} onRetry={reload} />; }
export function ReviewPagination({ page, pageSize, total, update }: { page: number; pageSize: number; total: number; update: (next: Record<string, string | number>) => void }) {
  return <nav className="mini-review-pagination" aria-label="Phân trang"><span role="status">Trang <strong>{page}</strong> · {total.toLocaleString('vi-VN')} kết quả</span><button type="button" className="btn" disabled={page <= 1} onClick={() => update({ page: page - 1 })}><ChevronLeft size={16} aria-hidden="true" />Trang trước</button><button type="button" className="btn" disabled={page >= 100000 || page * pageSize >= total} onClick={() => update({ page: page + 1 })}>Trang sau<ChevronRight size={16} aria-hidden="true" /></button></nav>;
}
export function ReviewQueue({ query, update, data, loading, error, reload }: { query: QueueQuery; update: (next: Record<string, string | number>) => void; data?: ReviewPage; loading?: boolean; error?: Error | null; reload: () => void }) {
  const filtered = !!(query.search || query.status || query.assignee);
  return <section className="mini-review-worklist" aria-label="Danh sách yêu cầu xét duyệt">
    <header className="mini-review-worklist-heading"><div><h2>Yêu cầu xét duyệt</h2><p>Xem thông tin phiên bản và theo dõi tiến độ xử lý.</p></div>{data && !error && <span className="mini-review-result-count">{data.total.toLocaleString('vi-VN')} yêu cầu</span>}</header>
    <form className="mini-review-filters mini-review-queue-filters" key={`${query.search ?? ''}:${query.assignee ?? ''}`} onSubmit={event => { event.preventDefault(); update({ search: String(new FormData(event.currentTarget).get('search') ?? '').trim() }); }}>
      <label className="mini-review-search-label">Tìm ứng dụng / phiên bản<span className="mini-review-search"><Search size={17} aria-hidden="true" /><input name="search" type="search" maxLength={128} defaultValue={query.search} placeholder="Tên ứng dụng, mã hoặc phiên bản…" /></span></label>
      <button className="btn primary" type="submit">Tìm kiếm</button>
      <label>Trạng thái<select value={query.status ?? ''} onChange={event => update({ status: event.target.value })}><option value="">Tất cả lịch sử</option>{reviewStatuses.map(status => <option value={status} key={status}>{statusLabel[status]}</option>)}</select></label>
      <label>Thứ tự<select value={query.sort ?? 'oldest'} onChange={event => update({ sort: event.target.value })}><option value="oldest">Cũ nhất trước</option><option value="newest">Mới nhất trước</option></select></label>
      <label>Mỗi trang<select value={query.pageSize} onChange={event => update({ pageSize: Number(event.target.value) })}>{[20, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label>
      <details className="mini-review-assignee"><summary><SlidersHorizontal size={16} aria-hidden="true" />Lọc người được giao</summary><div><label>Admin ID<input name="assignee" defaultValue={query.assignee} maxLength={36} placeholder="Nhập ID quản trị viên" /></label><button className="btn" type="button" onClick={event => update({ assignee: (event.currentTarget.form?.elements.namedItem('assignee') as HTMLInputElement)?.value.trim() ?? '' })}>Áp dụng</button></div></details>
    </form>
    {filtered && <div className="mini-review-filter-summary"><span><Filter size={14} aria-hidden="true" />Đang áp dụng bộ lọc</span><button type="button" onClick={() => update({ search: '', status: '', assignee: '' })}>Xóa bộ lọc</button></div>}
    {loading && <div role="status" className="mini-review-loading"><span className="sr-only">Đang tải hàng đợi…</span>{Array.from({ length: 4 }, (_, index) => <div key={index} aria-hidden="true"><span /><span /><span /></div>)}</div>}
    {error && <ReviewError error={error} reload={reload} />}
    {!error && data && <>
      {data.items.length === 0 ? <div role="status" className="mini-review-empty"><span className="mini-review-empty-icon"><Inbox size={30} strokeWidth={1.5} aria-hidden="true" /></span><h3>Không có yêu cầu phù hợp</h3><p>{filtered ? 'Thử thay đổi hoặc xóa bộ lọc để xem các yêu cầu khác.' : 'Các phiên bản được nhà phát triển gửi duyệt sẽ hiển thị tại đây.'}</p>{filtered ? <button type="button" className="btn" onClick={() => update({ search: '', status: '', assignee: '' })}>Xóa bộ lọc</button> : <Link className="btn" to="/mini-apps">Xem danh sách Mini App<ArrowRight size={15} aria-hidden="true" /></Link>}</div> : <div className="mini-review-table-scroll" role="region" aria-label="Bảng yêu cầu xét duyệt" tabIndex={0}><table className="mini-review-table"><thead><tr><th scope="col">Ứng dụng / phiên bản</th><th scope="col">Nhà phát triển</th><th scope="col">Trạng thái</th><th scope="col">Thời gian gửi</th><th scope="col"><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{data.items.map(item => <tr key={item.review.id}>
        <td><Link className="mini-review-app-identity" to={`/mini-app-reviews/${item.review.id}`}><ReviewLogo value={item.logoUrl} /><span><strong>{item.appName}</strong><small>{item.versionName} <span>· #{item.review.versionCode}</span></small></span></Link><code className="mini-review-app-id" title={item.appId}>{item.appId}</code></td>
        <td><strong>{item.developerName}</strong><small>{item.developerEmail}</small></td>
        <td><ReviewStatus status={item.review.status} /><small className="mini-review-assignment" title={item.assignedAdminAccountId ?? undefined}>{item.assignedAdminAccountId ? `Đã giao: ${item.assignedAdminAccountId}` : 'Chưa được giao'}</small></td>
        <td><time dateTime={item.review.submittedAt}>{new Date(item.review.submittedAt).toLocaleDateString('vi-VN')}<small>{new Date(item.review.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></time></td>
        <td><Link className="mini-review-open" aria-label={`Xem xét duyệt ${item.appName}`} to={`/mini-app-reviews/${item.review.id}`}><span>Xem chi tiết</span><ArrowRight size={16} aria-hidden="true" /></Link></td>
      </tr>)}</tbody></table></div>}
      <ReviewPagination page={query.page} pageSize={query.pageSize} total={data.total} update={update} />
    </>}
  </section>;
}

import { Link } from 'react-router-dom';
import type { QueueQuery, ReviewPage } from '../../types/mini-app-review';
import { reviewStatuses, statusLabel } from '../../types/mini-app-review';
import { ReviewLogo } from './ReviewSnapshot';


export function ReviewStatus({ status }: { status: string }) { return <span className="badge">{statusLabel[status] ?? status}</span>; }
export function ReviewError({ error, reload }: { error: Error; reload: () => void }) { return <div role="alert" className="empty-state"><p>{error.message}</p><button type="button" className="btn" onClick={reload}>Tải lại</button></div>; }
export function ReviewPagination({ page, pageSize, total, update }: { page: number; pageSize: number; total: number; update: (next: Record<string, string | number>) => void }) {
  return <nav className="mini-review-pagination" aria-label="Phân trang"><span role="status">Trang {page} · {total} kết quả</span><button type="button" className="btn" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Trang trước</button><button type="button" className="btn" disabled={page >= 100000 || page * pageSize >= total} onClick={() => update({ page: page + 1 })}>Trang sau</button></nav>;
}
export function ReviewQueue({ query, update, data, loading, error, reload }: { query: QueueQuery; update: (next: Record<string, string | number>) => void; data?: ReviewPage; loading?: boolean; error?: Error | null; reload: () => void }) {
  return <>
    <form className="mini-review-filters" key={query.search} onSubmit={event => { event.preventDefault(); update({ search: String(new FormData(event.currentTarget).get('search') ?? '').trim() }); }}>
      <label>Tìm ứng dụng / phiên bản<input name="search" type="search" maxLength={128} defaultValue={query.search} /></label>
      <button className="btn" type="submit">Tìm kiếm</button>
      <label>Trạng thái<select value={query.status ?? ''} onChange={event => update({ status: event.target.value })}><option value="">Tất cả lịch sử</option>{reviewStatuses.map(status => <option value={status} key={status}>{statusLabel[status]}</option>)}</select></label>
      <label>Thứ tự<select value={query.sort ?? 'oldest'} onChange={event => update({ sort: event.target.value })}><option value="oldest">Cũ nhất trước</option><option value="newest">Mới nhất trước</option></select></label>
      <label>Mỗi trang<select value={query.pageSize} onChange={event => update({ pageSize: Number(event.target.value) })}>{[20, 50, 100].map(size => <option key={size}>{size}</option>)}</select></label>
      <details><summary>Lọc người được giao</summary><label>Admin ID<input name="assignee" defaultValue={query.assignee} maxLength={36} /></label><button className="btn" type="button" onClick={event => update({ assignee: (event.currentTarget.form?.elements.namedItem('assignee') as HTMLInputElement)?.value.trim() ?? '' })}>Áp dụng</button></details>
    </form>
    {loading && <p role="status">Đang tải hàng đợi…</p>}
    {error && <ReviewError error={error} reload={reload} />}
    {!error && data && <>
      {data.items.length === 0 ? <p role="status" className="empty-state">Không có yêu cầu phù hợp. Thử đổi bộ lọc.</p> : <ol className="mini-review-queue">{data.items.map(item => <li key={item.review.id}>
        <div><Link className="mini-review-app-identity" to={`/mini-app-reviews/${item.review.id}`}><ReviewLogo value={item.logoUrl} /><strong>{item.appName}</strong></Link><p>{item.appId} · {item.versionName} (#{item.review.versionCode})</p><p>{item.developerName} · {item.developerEmail}</p></div>
        <div><ReviewStatus status={item.review.status} /><p><time dateTime={item.review.submittedAt}>{new Date(item.review.submittedAt).toLocaleString('vi-VN')}</time></p><small>{item.assignedAdminAccountId ? `Đã giao: ${item.assignedAdminAccountId}` : 'Chưa được giao'}</small></div>
      </li>)}</ol>}
      <ReviewPagination page={query.page} pageSize={query.pageSize} total={data.total} update={update} />
    </>}
  </>;
}

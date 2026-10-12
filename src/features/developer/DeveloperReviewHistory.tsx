import { StatusBadge } from '../../components/common';
import type { DeveloperReviewEvent } from '../../types/developer-platform';

export function DeveloperReviewHistory({ items = [], internal = false }: { items?: DeveloperReviewEvent[]; internal?: boolean }) {
  return <div><h2>Lịch sử xét duyệt</h2>{!items.length ? <p>Chưa có quyết định xét duyệt.</p> : <ol className="mini-timeline">{items.map(event => <li key={event.id}>
    <div className="mini-row"><strong>Hồ sơ phiên bản {event.version}</strong><StatusBadge status={event.status} /></div>
    <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString('vi-VN')}</time>
    {event.reason ? <p>{event.reason}</p> : <p>Trạng thái hồ sơ đã được cập nhật.</p>}
    {internal && event.internalNotes ? <details><summary>Ghi chú nội bộ · đối tác không thấy</summary><p>{event.internalNotes}</p></details> : null}
    {internal ? <small className="mini-muted">Người xét duyệt: {event.reviewerId}</small> : null}
  </li>)}</ol>}</div>;
}

export function PostPagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="user-pagination">
      <span><strong>{start}-{end}</strong> / {total} bài viết</span>
      <select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>
        {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} / trang</option>)}
      </select>
      <button className="btn" disabled={page <= 1} onClick={() => onPage(1)} type="button">Trang đầu</button>
      <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)} type="button">Trang trước</button>
      <button className="btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} type="button">Trang sau</button>
      <button className="btn" disabled={page >= totalPages} onClick={() => onPage(totalPages)} type="button">Trang cuối</button>
    </div>
  );
}

import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, Search } from 'lucide-react';
import type { Status } from '../types/admin';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}

const statusLabels: Record<string, string> = {
  active: 'Đang hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Đã khóa',
  pending: 'Chờ xử lý',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
  hidden: 'Đã ẩn',
  deleted: 'Đã xóa',
  resolved: 'Đã xử lý',
  0: 'Chưa kích hoạt',
  1: 'Đang hoạt động',
  2: 'Đã khóa',
};

export function getStatusLabel(status: Status | string | number) {
  return statusLabels[status] ?? status;
}

export function SearchBox({ value, onChange, placeholder = 'Tìm kiếm' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="search-box">
      <Search size={16} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Loading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-row" key={index} />
      ))}
    </div>
  );
}

export function Empty({ title = 'Chưa có dữ liệu', description = 'Dữ liệu sẽ hiển thị tại đây khi API trả về kết quả.' }: { title?: string; description?: string }) {
  return (
    <div className="state-view" role="status">
      <Inbox size={32} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="state-view error" role="alert">
      <AlertTriangle size={32} />
      <strong>Không tải được dữ liệu</strong>
      <span>{message}</span>
      <button className="btn primary" type="button" onClick={onRetry}>
        Thử lại
      </button>
    </div>
  );
}

export function StatusBadge({ status }: { status: Status | string | number }) {
  return <span className={`status-badge ${status}`}>{getStatusLabel(status)}</span>;
}

export function UserAvatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return src ? <img className={`avatar ${size}`} src={src} alt={name} /> : <span className={`avatar ${size}`}>{initials}</span>;
}

export function StatCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export type Column<T> = {
  key: string;
  title: string;
  render: (item: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({ columns, items = [], onRowClick }: { columns: Column<T>[]; items?: T[]; onRowClick?: (item: T) => void }) {
  if (items.length === 0) return <Empty />;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.title}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} onClick={() => onRowClick?.(item)} className={onRowClick ? 'clickable' : undefined}>
              {columns.map((column) => <td key={column.key}>{column.render(item)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pagination">
      <span>{total} kết quả</span>
      <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
        <option value={10}>10 / trang</option>
        <option value={20}>20 / trang</option>
        <option value={50}>50 / trang</option>
      </select>
      <button className="btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} type="button">
        Trước
      </button>
      <strong>{page} / {pageCount}</strong>
      <button className="btn" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} type="button">
        Sau
      </button>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmText = 'Xác nhận',
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel} disabled={loading} type="button">Hủy</button>
          <button className="btn danger" onClick={onConfirm} disabled={loading} type="button">
            {loading ? <Loader2 className="spin" size={16} /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

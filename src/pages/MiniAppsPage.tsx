import { useQuery } from '@tanstack/react-query';
import { AppWindow, CheckCircle2, Clock3, Code2, PauseCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatCard, StatusBadge, type Column } from '../components/common';
import { getMiniAppAuditLogs, getMiniAppDashboard, getMiniApps } from '../services/admin-mini-app.service';
import { getErrorMessage } from '../services/http';
import type { MiniAppAudit, MiniAppListItem, MiniAppStatus } from '../types/mini-app';

export function MiniAppsPage({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const navigate = useNavigate(); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(20); const [search, setSearch] = useState(''); const [status, setStatus] = useState<MiniAppStatus | ''>(pendingOnly ? 'PendingReview' : '');
  const dashboard = useQuery({ queryKey: ['mini-app-dashboard'], queryFn: getMiniAppDashboard });
  const list = useQuery({ queryKey: ['mini-apps', page, pageSize, search, status], queryFn: () => getMiniApps({ page, pageSize, search: search || undefined, status: status || undefined }) });
  const logs = useQuery({ queryKey: ['mini-app-audit'], queryFn: () => getMiniAppAuditLogs({ page: 1, pageSize: 10 }) });
  const columns: Column<MiniAppListItem>[] = [
    { key: 'name', title: 'Mini App', render: (item) => <div><strong>{item.name}</strong><small className="table-subtitle">{item.slug}</small></div> },
    { key: 'developer', title: 'Developer', render: (item) => item.developer },
    { key: 'webUrl', title: 'Web URL', render: (item) => <span className="truncate-url">{item.webUrl}</span> },
    { key: 'status', title: 'Trạng thái', render: (item) => <div><StatusBadge status={item.status} />{item.pendingVersion ? <small className="table-subtitle">Chờ duyệt phiên bản {item.pendingVersion}</small> : null}</div> },
    { key: 'createdAt', title: 'Ngày tạo', render: (item) => new Date(item.createdAt).toLocaleDateString('vi-VN') },
  ];
  const logColumns: Column<MiniAppAudit>[] = [{ key: 'action', title: 'Sự kiện', render: (item) => <strong>{item.action}</strong> }, { key: 'app', title: 'Mini App ID', render: (item) => item.miniAppId || '—' }, { key: 'detail', title: 'Chi tiết', render: (item) => item.detail || '—' }, { key: 'created', title: 'Thời gian', render: (item) => new Date(item.createdAt).toLocaleString('vi-VN') }];
  return <section><PageHeader eyebrow="Mini App Platform" title={pendingOnly ? 'Mini Apps chờ duyệt' : 'Quản lý Mini Apps'} description="Kiểm duyệt cấu hình, quyền và trạng thái các ứng dụng đối tác." actions={<button className="btn primary" onClick={() => { void dashboard.refetch(); void list.refetch(); }} type="button"><RefreshCw size={16} /> Làm mới</button>} />
    <nav className="mini-tabs" aria-label="Quản lý Mini Apps"><Link to="/mini-apps">Tất cả ứng dụng</Link><Link to="/mini-apps/pending">Chờ duyệt</Link><Link to="/mini-apps/new">Tạo Mini App</Link><Link to="/mini-apps/policy">Danh mục & quyền</Link><Link to="/mini-apps/reports">Báo cáo</Link><Link to="/mini-apps/audit">Nhật ký</Link><Link to="/developers">Developers</Link></nav>
    {dashboard.isError ? <ErrorView message={getErrorMessage(dashboard.error)} onRetry={() => void dashboard.refetch()} /> : null}
    {dashboard.data ? <div className="stats-grid mini-stats"><StatCard icon={<AppWindow />} label="Tổng Mini Apps" value={String(dashboard.data.totalMiniApps)} tone="blue" /><StatCard icon={<CheckCircle2 />} label="Đã duyệt" value={String(dashboard.data.active)} tone="green" /><StatCard icon={<Clock3 />} label="Chờ duyệt" value={String(dashboard.data.pendingReview)} tone="warning" /><StatCard icon={<PauseCircle />} label="Tạm ngừng" value={String(dashboard.data.suspended)} tone="red" /><StatCard icon={<Code2 />} label="Developers" value={String(dashboard.data.developers)} tone="info" /></div> : null}
    <div className="toolbar mini-toolbar"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tên, slug hoặc developer" /><select aria-label="Trạng thái Mini App" disabled={pendingOnly} value={status} onChange={(event) => { setStatus(event.target.value as MiniAppStatus | ''); setPage(1); }}><option value="">Tất cả trạng thái</option>{Object.entries({ PendingReview: 'Chờ duyệt', Active: 'Đã duyệt', Suspended: 'Tạm ngừng', Rejected: 'Từ chối', Draft: 'Bản nháp', Archived: 'Lưu trữ' }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {list.isLoading ? <Loading /> : null}{list.isError ? <ErrorView message={getErrorMessage(list.error)} onRetry={() => void list.refetch()} /> : null}{list.data ? <><DataTable columns={columns} items={list.data.items} onRowClick={(item) => navigate(`/mini-apps/${item.id}`)} /><Pagination page={page} pageSize={pageSize} total={list.data.total} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} /></> : null}
    <div className="section-heading"><div><span>Audit</span><h2>Hoạt động Mini App gần đây</h2></div></div>{logs.isError ? <ErrorView message={getErrorMessage(logs.error)} onRetry={() => void logs.refetch()} /> : null}{logs.isLoading ? <Loading rows={3} /> : null}{logs.data ? <DataTable columns={logColumns} items={logs.data.items} /> : null}
  </section>;
}

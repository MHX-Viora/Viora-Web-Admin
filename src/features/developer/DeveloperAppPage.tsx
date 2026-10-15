import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog, ErrorView, Loading, PageHeader, StatusBadge } from '../../components/common';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import type { HybridApp } from '../../types/mini-app';
import { ConfigFields } from './ConfigFields';
import { newConfig, validateConfig } from './config';
import { CopyValue, QueryState, VersionHistory } from './Shared';
import { useDeveloperApp, useDeveloperProfile } from './context';
import { DeveloperLifecyclePanel } from './DeveloperLifecyclePanel';

export function DeveloperAppLayout() {
  const { id = '' } = useParams(); const app = useQuery({ queryKey: ['developer-app', id], queryFn: () => developerApi.app(id), enabled: Boolean(id) });
  if (app.isLoading) return <Loading />;
  if (app.isError || !app.data) return <ErrorView message={getErrorMessage(app.error)} onRetry={() => void app.refetch()} />;
  const base = `/developer/apps/${id}`;
  return <section><PageHeader eyebrow="Mini App" title={app.data.name} description={app.data.description ?? undefined} actions={<><StatusBadge status={app.data.status} /><Link className="btn" to="/developer/apps">Tất cả ứng dụng</Link></>} /><div className="mini-app-identity">{app.data.iconUrl ? <img src={app.data.iconUrl} alt={`Logo ${app.data.name}`} /> : null}<p>{app.data.developer} · {app.data.authenticationMode === 'Independent' ? 'Standard WebView' : 'ANKT SSO'} · Phiên bản đã phát hành: {app.data.publishedVersion || 'Chưa có'}</p></div><nav className="mini-tabs" aria-label="Cấu hình ứng dụng">{[{ path: '', label: 'Tổng quan' }, { path: '/connection', label: 'Thông tin kết nối' }, { path: '/domains', label: 'Tên miền' }, { path: '/sso', label: 'Đăng nhập ANKT' }, { path: '/members', label: 'Thành viên' }, { path: '/releases', label: 'Phiên bản & phát hành' }, { path: '/analytics', label: 'Thống kê' }, { path: '/settings', label: 'Cài đặt' }].map(tab => <NavLink key={tab.path} to={`${base}${tab.path}`} end={tab.path === ''}>{tab.label}</NavLink>)}</nav><Outlet context={app.data} /></section>;
}
export function DeveloperAppDetailsPage() {
  const app = useDeveloperApp();
  return <div className="mini-stack">{app.coverUrl && <img className="developer-app-cover" src={app.coverUrl} alt={`Ảnh bìa ${app.name}`} />}<article className="detail-card mini-stack"><h2>Thông tin ứng dụng</h2><dl className="mini-definition"><dt>Slug</dt><dd>{app.slug}</dd><dt>Danh mục</dt><dd>{app.category || 'Chưa chọn'}</dd><dt>Xét duyệt</dt><dd><StatusBadge status={app.reviewState || app.status} /></dd><dt>Phát hành</dt><dd><StatusBadge status={app.publicationStatus || 'Unpublished'} /></dd><dt>Ngày tạo</dt><dd>{new Date(app.createdAt).toLocaleString('vi-VN')}</dd><dt>Cập nhật</dt><dd>{new Date(app.updatedAt).toLocaleString('vi-VN')}</dd></dl><CopyValue label="App ID" value={app.id} /><CopyValue label="Website" value={app.webUrl} /></article><DeveloperConfigEditor key={app.updatedAt} app={app} sections={[0]} /></div>;
}
export function DeveloperReleasesPage() {
  const app = useDeveloperApp(); const versions = useQuery({ queryKey: ['developer-versions', app.id], queryFn: () => developerApi.versions(app.id) });
  return <div className="mini-stack"><DeveloperLifecyclePanel app={app} /><article className="detail-card"><h2>Phiên bản & xét duyệt</h2><QueryState query={versions}><VersionHistory items={versions.data ?? []} /></QueryState></article></div>;
}
export function DeveloperSettingsPage() { const app = useDeveloperApp(); return <div className="mini-stack"><DeveloperConfigEditor key={app.updatedAt} app={app} sections={[1]} /><Link className="btn" to={`/developer/apps/${app.id}/audit`}>Lịch sử hoạt động</Link></div>; }
export function DeveloperPermissionsPage() { const app = useDeveloperApp(); return <DeveloperConfigEditor key={app.updatedAt} app={app} sections={[3]} />; }

export function DeveloperConfigEditor({ app, sections }: { app: HybridApp; sections: number[] }) {
  const profile = useDeveloperProfile();
  const client = useQueryClient(); const [form, setForm] = useState(() => newConfig(app)); const [confirm, setConfirm] = useState(false); const [uploading, setUploading] = useState(0);
  const metadata = useQuery({ queryKey: ['developer-metadata'], queryFn: async () => { const [categories, permissions] = await Promise.all([developerApi.categories(), developerApi.permissions()]); return { categories, permissions }; } });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['developer-app', app.id] }); await client.invalidateQueries({ queryKey: ['developer-versions', app.id] }); await client.invalidateQueries({ queryKey: ['developer-apps'] }); };
  const save = useMutation({ mutationFn: () => developerApi.update(app.id, form), onSuccess: async () => { toast.success('Đã lưu bản nháp cấu hình'); await refresh(); }, onError: e => toast.error(getErrorMessage(e)) });
  const submit = useMutation({ mutationFn: () => developerApi.submit(app.id), onSuccess: async () => { setConfirm(false); toast.success('Đã gửi phiên bản xét duyệt'); await refresh(); }, onError: e => toast.error(getErrorMessage(e)) });
  const awaiting = app.status === 'PendingReview' || Boolean(app.pendingVersion);
  const readOnly = awaiting || app.status === 'Archived' || app.status === 'Suspended' || !['Owner', 'Admin', 'Developer', 'Member'].includes(app.membershipRole ?? profile.membershipRole ?? "");
  const scopeOptions = [...(metadata.data?.permissions ?? []), ...app.permissions.filter(scope => !metadata.data?.permissions.some(option => option.code === scope.code)).map(scope => ({ ...scope, isActive: false }))];
  return <QueryState query={metadata}><form className="mini-stack" onSubmit={e => { e.preventDefault(); const error = validateConfig(form); if (uploading) return; if (error) return toast.error(error); save.mutate(); }}>{app.status === 'Active' ? <p className="mini-notice">Thay đổi được lưu vào bản nháp. Cấu hình đã phát hành tiếp tục được sử dụng đến khi phiên bản mới được duyệt.</p> : null}{awaiting ? <p className="mini-notice">Phiên bản đang xét duyệt được giữ nguyên. Theo dõi quyết định trong lịch sử phiên bản.</p> : null}{sections.map(section => <fieldset className="detail-card" disabled={readOnly || save.isPending || submit.isPending} key={section}><h2>{['Thông tin ứng dụng', 'Website & domain', 'Bảo mật & đăng nhập', 'Quyền yêu cầu'][section]}</h2><ConfigFields value={form} onChange={setForm} section={section} onUploadBusyChange={busy => setUploading(count => Math.max(0, count + (busy ? 1 : -1)))} categories={metadata.data?.categories} permissions={scopeOptions} /></fieldset>)}<div className="mini-row"><button className="btn primary" disabled={save.isPending || submit.isPending || uploading > 0 || readOnly}>Lưu bản nháp</button><button className="btn" type="button" disabled={readOnly || uploading > 0 || save.isPending || submit.isPending || awaiting || app.status === 'Archived' || app.status === 'Suspended'} onClick={() => setConfirm(true)}>Gửi xét duyệt</button><Link className="btn" to={`/developer/apps/${app.id}/domains`}>Xác minh domain</Link></div><small className="mini-muted">Gửi xét duyệt sử dụng cấu hình đã lưu. Hoàn tất lưu và xác minh domain trước khi gửi.</small></form>{confirm ? <ConfirmDialog title="Gửi Mini App xét duyệt" description="ANKT sẽ kiểm tra domain, cấu hình bảo mật và quyền yêu cầu. Phiên bản gửi duyệt không thể chỉnh sửa." confirmText="Gửi xét duyệt" loading={submit.isPending} onCancel={() => setConfirm(false)} onConfirm={() => submit.mutate()} /> : null}</QueryState>;
}

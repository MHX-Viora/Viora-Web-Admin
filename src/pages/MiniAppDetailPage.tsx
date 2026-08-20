import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog, ErrorView, Loading, PageHeader, StatusBadge } from '../components/common';
import { getMiniApp, getMiniAppPermissions, transitionMiniApp, updateMiniApp } from '../services/admin-mini-app.service';
import { getErrorMessage } from '../services/http';
import type { MiniAppDetail, MiniAppPermission, MiniAppUpdate } from '../types/mini-app';

const emptyForm: MiniAppUpdate = { name: '', slug: '', description: '', iconUrl: '', coverUrl: '', webUrl: '', callbackUrl: '', allowedDomains: [], permissions: [], isFeatured: false };

export function MiniAppDetailPage() {
  const { id = '' } = useParams();
  const app = useQuery({ queryKey: ['mini-app', id], queryFn: () => getMiniApp(id), enabled: Boolean(id) });
  const permissions = useQuery({ queryKey: ['mini-app-permissions'], queryFn: getMiniAppPermissions });
  if (app.isLoading) return <Loading />;
  if (app.isError || !app.data) return <ErrorView message={getErrorMessage(app.error)} onRetry={() => void app.refetch()} />;
  return <MiniAppDetailEditor key={app.data.updatedAt} app={app.data} permissions={permissions.data ?? []} />;
}

function MiniAppDetailEditor({ app, permissions }: { app: MiniAppDetail; permissions: MiniAppPermission[] }) {
  const navigate = useNavigate(); const client = useQueryClient();
  const [form, setForm] = useState<MiniAppUpdate>(() => ({ ...emptyForm, name: app.name, slug: app.slug, description: app.description || '', iconUrl: app.iconUrl || '', coverUrl: app.coverUrl || '', webUrl: app.webUrl, callbackUrl: app.callbackUrl, allowedDomains: app.allowedDomains, permissions: app.permissions.map((item) => item.code), isFeatured: app.isFeatured }));
  const [domains, setDomains] = useState(() => app.allowedDomains.join('\n')); const [action, setAction] = useState<'approve' | 'reject' | 'suspend' | 'reactivate'>();
  const save = useMutation({ mutationFn: () => updateMiniApp(app.id, { ...form, allowedDomains: domains.split(/[,\n]/).map((value) => value.trim()).filter(Boolean) }), onSuccess: async () => { toast.success('Đã lưu cấu hình Mini App'); await client.invalidateQueries({ queryKey: ['mini-app', app.id] }); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const transition = useMutation({ mutationFn: () => transitionMiniApp(app.id, action!), onSuccess: async () => { toast.success('Đã cập nhật trạng thái'); setAction(undefined); await client.invalidateQueries({ queryKey: ['mini-app', app.id] }); await client.invalidateQueries({ queryKey: ['mini-apps'] }); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const status = app.status;
  return <section><PageHeader eyebrow="Mini App detail" title={app.name} description={`${app.developer} · ClientId: ${app.clientId}`} actions={<><button className="btn" onClick={() => navigate('/mini-apps')} type="button"><ArrowLeft size={16} /> Quay lại</button><StatusBadge status={status} /></>} />
    <div className="detail-grid"><div className="detail-card"><h2>Basic Information</h2><label>Tên<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><label>Mô tả<textarea rows={4} value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="check-row"><input checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} type="checkbox" /> Nổi bật</label></div>
      <div className="detail-card"><h2>Web Configuration</h2><label>Web URL<input value={form.webUrl} onChange={(event) => setForm({ ...form, webUrl: event.target.value })} /></label><label>Callback URL<input value={form.callbackUrl} onChange={(event) => setForm({ ...form, callbackUrl: event.target.value })} /></label><label>Allowed Domains<textarea rows={5} value={domains} onChange={(event) => setDomains(event.target.value)} /><small>Mỗi domain một dòng; wildcard dạng *.partner.vn</small></label></div>
      <div className="detail-card full"><h2>Permissions</h2><div className="permission-grid">{permissions.map((permission) => <label className="permission-option" key={permission.code}><input checked={form.permissions.includes(permission.code)} onChange={(event) => setForm({ ...form, permissions: event.target.checked ? [...form.permissions, permission.code] : form.permissions.filter((code) => code !== permission.code) })} type="checkbox" /><span><strong>{permission.name}</strong><small>{permission.code}{permission.isSensitive ? ' · Nhạy cảm' : ''}</small></span></label>)}</div></div></div>
    <div className="detail-actions"><button className="btn primary" disabled={save.isPending} onClick={() => save.mutate()} type="button"><Save size={16} /> Lưu cấu hình</button>{status === 'PendingReview' ? <><button className="btn" onClick={() => setAction('approve')} type="button">Approve</button><button className="btn danger" onClick={() => setAction('reject')} type="button">Reject</button></> : null}{status === 'Active' ? <button className="btn danger" onClick={() => setAction('suspend')} type="button">Suspend</button> : null}{status === 'Suspended' ? <button className="btn" onClick={() => setAction('reactivate')} type="button">Reactivate</button> : null}</div>
    {action ? <ConfirmDialog title="Xác nhận thay đổi trạng thái" description={`Hành động ${action} có hiệu lực ngay với mọi lần launch mới.`} loading={transition.isPending} onCancel={() => setAction(undefined)} onConfirm={() => transition.mutate()} /> : null}
  </section>;
}

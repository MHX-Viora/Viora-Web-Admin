import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DataTable, PageHeader } from '../components/common';
import { QueryState } from '../features/developer/Shared';
import { editorialApi, type Banner } from '../services/mini-app-editorial.service';
import { getMiniAppCategories, getMiniApps } from '../services/admin-mini-app.service';
import { getErrorMessage } from '../services/http';

const empty = (): Omit<Banner, 'id'> => ({ title: '', imageUrl: '', miniAppId: null, categoryId: null, sortOrder: 0, isActive: true, startsAt: new Date().toISOString(), endsAt: null });
export function MiniAppEditorialPage() {
  const client = useQueryClient(); const [form, setForm] = useState(empty); const [id, setId] = useState<string>();
  const [appSearch, setAppSearch] = useState(''); const [selectedApp, setSelectedApp] = useState(''); const [order, setOrder] = useState(0); const [featured, setFeatured] = useState(true); const [hidden, setHidden] = useState(false);
  const [start, setStart] = useState(new Date().toISOString()); const [end, setEnd] = useState('');
  const banners = useQuery({ queryKey: ['editorial-banners'], queryFn: editorialApi.banners });
  const placements = useQuery({ queryKey: ['editorial-placements'], queryFn: editorialApi.placements });
  const apps = useQuery({ queryKey: ['editorial-apps', appSearch], queryFn: () => getMiniApps({ page: 1, pageSize: 30, search: appSearch }) });
  const categories = useQuery({ queryKey: ['mini-app-categories'], queryFn: getMiniAppCategories });
  const operation = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: async () => { toast.success('Đã lưu nội dung'); await client.invalidateQueries({ queryKey: ['editorial-banners'] }); await client.invalidateQueries({ queryKey: ['editorial-placements'] }); }, onError: e => toast.error(getErrorMessage(e)) });
  return <section><PageHeader title="Nội dung Mini App trong Tiện ích" description="Banner có lịch hiển thị và chỉ dẫn tới ứng dụng hoặc danh mục nội bộ." actions={<Link to="/mini-apps" className="btn">Quay lại</Link>} />
    <div className="detail-grid"><div className="detail-card mini-stack"><h2>{id ? 'Sửa banner' : 'Tạo banner'}</h2>
      <form className="mini-stack" onSubmit={e => { e.preventDefault(); operation.mutate(async () => { await editorialApi.save(form, id); setForm(empty()); setId(undefined); }); }}>
        <label>Tiêu đề<input required maxLength={160} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
        <label>URL ảnh HTTPS<input required type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></label>
        <label>Ứng dụng đích<select value={form.miniAppId ?? ''} onChange={e => setForm({ ...form, miniAppId: e.target.value || null, categoryId: null })}><option value="">Chọn ứng dụng</option>{apps.data?.items.map(app => <option key={app.id} value={app.id}>{app.name}</option>)}</select></label>
        <label>Hoặc danh mục đích<select value={form.categoryId ?? ''} onChange={e => setForm({ ...form, categoryId: e.target.value || null, miniAppId: null })}><option value="">Chọn danh mục</option>{categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Thứ tự<input type="number" min={0} max={10000} value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></label>
        <label>Bắt đầu (UTC ISO)<input required value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} /></label>
        <label>Kết thúc (UTC ISO, có thể trống)<input value={form.endsAt ?? ''} onChange={e => setForm({ ...form, endsAt: e.target.value || null })} /></label>
        <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Đang bật</label>
        <button className="btn primary" disabled={operation.isPending}>Lưu banner</button><button className="btn" type="button" onClick={() => { setForm(empty()); setId(undefined); }}>Tạo mới</button>
      </form></div>
      <div className="detail-card mini-stack"><h2>Nổi bật & hiển thị</h2><label>Tìm ứng dụng<input value={appSearch} onChange={e => setAppSearch(e.target.value)} /></label>
        <label>Ứng dụng<select value={selectedApp} onChange={e => { setSelectedApp(e.target.value); setHidden(apps.data?.items.find(app => app.id === e.target.value)?.hiddenFromCatalog ?? false); }}><option value="">Chọn ứng dụng</option>{apps.data?.items.map(app => <option key={app.id} value={app.id}>{app.name} · {app.status}</option>)}</select></label>
        <label>Thứ tự<input type="number" min={0} max={10000} value={order} onChange={e => setOrder(Number(e.target.value))} /></label><label>Bắt đầu UTC<input value={start} onChange={e => setStart(e.target.value)} /></label><label>Kết thúc UTC<input value={end} onChange={e => setEnd(e.target.value)} /></label>
        <label className="check-row"><input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />Đặt trong nhóm nổi bật</label>
        <button className="btn primary" disabled={!selectedApp || operation.isPending} onClick={() => operation.mutate(() => editorialApi.place(selectedApp, { sortOrder: order, isActive: featured, startsAt: start, endsAt: end || null }))}>Lưu vị trí</button>
        <label className="check-row"><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} />Ẩn khỏi catalog</label><button className="btn" disabled={!selectedApp || operation.isPending} onClick={() => operation.mutate(() => editorialApi.visibility(selectedApp, hidden))}>Lưu hiển thị</button>
        <QueryState query={placements}>{placements.data?.map(p => <button key={p.miniAppId} className="btn" onClick={() => { setSelectedApp(p.miniAppId); setOrder(p.sortOrder); setFeatured(p.isActive); setStart(p.startsAt); setEnd(p.endsAt ?? ''); }}>{p.name} · {p.sortOrder} · {p.isActive ? 'Bật' : 'Tắt'}</button>)}</QueryState>
      </div></div>
    <QueryState query={banners}><DataTable items={banners.data ?? []} columns={[{ key: 'title', title: 'Banner', render: b => b.title }, { key: 'schedule', title: 'Lịch', render: b => `${b.startsAt} → ${b.endsAt ?? 'Không giới hạn'}` }, { key: 'order', title: 'Thứ tự', render: b => b.sortOrder }, { key: 'actions', title: 'Thao tác', render: b => <div className="mini-row"><button className="btn" onClick={() => { setId(b.id); setForm(b); }}>Sửa</button><button className="btn" disabled={operation.isPending} onClick={() => operation.mutate(() => editorialApi.save({ ...b, isActive: !b.isActive }, b.id))}>{b.isActive ? 'Tắt' : 'Bật'}</button><button className="btn danger" disabled={operation.isPending} onClick={() => { if (window.confirm(`Xóa banner ${b.title}?`)) operation.mutate(() => editorialApi.remove(b.id)); }}>Xóa</button></div> }]} /></QueryState>
  </section>;
}

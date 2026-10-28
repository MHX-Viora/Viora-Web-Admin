import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteUtilityBanner, getUtilityBanners, saveUtilityBanner, type UtilityBanner, type UtilityBannerInput } from '../services/admin-utility-banner.service';
import { getErrorMessage } from '../services/http';
import '../utility-banners.css';
import { ModalFrame } from '../components/ModalFrame';

const empty: UtilityBannerInput = { title: '', imageUrl: '', targetUrl: null, sortOrder: 0, isActive: false, version: 0 };
export function UtilityBannersPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['utility-banners'], queryFn: getUtilityBanners });
  const [draft, setDraft] = useState<UtilityBannerInput | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<UtilityBanner | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => client.invalidateQueries({ queryKey: ['utility-banners'] });
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!draft || busy) return;
    setBusy(true);
    try { await saveUtilityBanner(editing, draft); setDraft(null); await refresh(); toast.success('Đã lưu banner.'); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  async function toggle(item: UtilityBanner) {
    setBusy(true);
    try { await saveUtilityBanner(item.id, { ...item, isActive: !item.isActive }); await refresh(); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return; setBusy(true);
    try { await deleteUtilityBanner(deleting); setDeleting(null); await refresh(); toast.success('Đã xóa banner.'); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className="utility-banners-page">
    <div className="utility-banner-heading"><div><h1>Banner tiện ích</h1><p>Ảnh tự chuyển mỗi 4 giây ở trang Tiện ích. Hiển thị theo thứ tự tăng dần, tối đa 20 ảnh đang bật.</p></div>
      <button type="button" className="btn primary" disabled={busy || !!draft} onClick={() => { setEditing(null); setDraft({ ...empty }); }}>Thêm banner</button></div>
    {draft && <form className="utility-banner-form" onSubmit={submit} aria-busy={busy}>
      <h2>{editing ? 'Sửa banner' : 'Banner mới'}</h2>
      <fieldset disabled={busy}>
        <label>Tiêu đề / mô tả ảnh<input required maxLength={160} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
        <label>URL ảnh HTTPS<input required type="url" pattern="https://.*" maxLength={2048} placeholder="https://…/banner.webp" value={draft.imageUrl} onChange={e => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
        <p>Dùng ảnh ngang tỷ lệ 5:2 (gợi ý 1200 × 480px). Banner giãn theo chiều rộng vùng hiển thị. Ảnh khác tỷ lệ sẽ được cắt vừa khung.</p>
        <label>Liên kết khi bấm (tùy chọn)<input maxLength={2048} placeholder="/wallet hoặc https://…" value={draft.targetUrl ?? ''} onChange={e => setDraft({ ...draft, targetUrl: e.target.value || null })} /></label>
        <label>Thứ tự<input required type="number" min={0} max={10000} step={1} value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></label>
        <label className="utility-banner-check"><input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />Đang bật</label>
        {draft.imageUrl.startsWith('https://') && <img className="utility-banner-preview" src={draft.imageUrl} alt={draft.title || 'Xem trước banner'} referrerPolicy="no-referrer" />}
        <div className="utility-banner-actions"><button type="submit" className="btn primary">{busy ? 'Đang lưu…' : 'Lưu banner'}</button><button type="button" className="btn ghost" onClick={() => setDraft(null)}>Hủy</button></div>
      </fieldset>
    </form>}
    {query.isPending ? <p role="status">Đang tải banner…</p> : query.isError ? <div role="alert"><p>{getErrorMessage(query.error)}</p><button type="button" className="btn ghost" onClick={() => void query.refetch()}>Thử lại</button></div> :
      <div className="utility-banner-list">{query.data?.length ? query.data.map(item => <article key={item.id}>
        <img src={item.imageUrl} alt={item.title} referrerPolicy="no-referrer" />
        <div><h2>{item.title}</h2><p>Thứ tự {item.sortOrder} · {item.isActive ? 'Đang bật' : 'Đã ẩn'}</p><p className="utility-banner-target">{item.targetUrl || 'Không có liên kết'}</p></div>
        <div className="utility-banner-actions"><button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => { setEditing(item.id); setDraft({ title: item.title, imageUrl: item.imageUrl, targetUrl: item.targetUrl, sortOrder: item.sortOrder, isActive: item.isActive, version: item.version }); }}>Sửa</button>
          <button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => void toggle(item)}>{item.isActive ? 'Ẩn' : 'Bật'}</button>
          <button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => setDeleting(item)}>Xóa</button></div>
      </article>) : <p>Chưa có banner. Ứng dụng sẽ hiển thị banner Mini App mặc định.</p>}</div>}
    {deleting && <ModalFrame titleId="banner-delete-title" busy={busy} onClose={() => setDeleting(null)}>
      <h2 id="banner-delete-title">Xóa banner “{deleting.title}”?</h2><p>Ảnh này sẽ bị gỡ khỏi danh sách banner.</p>
      <div className="utility-banner-actions"><button type="button" className="btn primary" disabled={busy} onClick={() => void remove()}>Xóa banner</button><button type="button" className="btn ghost" disabled={busy} onClick={() => setDeleting(null)}>Hủy</button></div>
    </ModalFrame>}
  </div>;
}

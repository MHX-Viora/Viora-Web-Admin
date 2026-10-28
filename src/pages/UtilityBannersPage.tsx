import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteUtilityBanner, getUtilityBanners, saveUtilityBanner, type UtilityBanner, type UtilityBannerInput } from '../services/admin-utility-banner.service';
import { getErrorMessage } from '../services/http';
import '../utility-banners.css';
import { ModalFrame } from '../components/ModalFrame';
import { ImageFileField } from '../components/ImageFileField';
import { uploadAdminImage } from '../services/admin-image.service';

const empty: UtilityBannerInput = { imageUrl: '', targetUrl: null, isActive: false, version: 0 };
export function UtilityBannersPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['utility-banners'], queryFn: getUtilityBanners });
  const [draft, setDraft] = useState<UtilityBannerInput | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<UtilityBanner | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: ['utility-banners'] });
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!draft || busy) return;
    setBusy(true);
    try {
      const imageUrl = imageFile ? await uploadAdminImage(imageFile) : draft.imageUrl;
      if (!imageUrl) throw new Error('Vui lòng chọn ảnh banner.');
      setDraft({ ...draft, imageUrl }); setImageFile(null);
      await saveUtilityBanner(editing, { ...draft, imageUrl }); setDraft(null); await refresh(); toast.success('Đã lưu banner.');
    }
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
    <div className="utility-banner-heading"><div><h1>Banner tiện ích</h1><p>Ảnh tự chuyển mỗi 4 giây ở trang Tiện ích. Tối đa 20 ảnh đang bật.</p></div>
      <button type="button" className="btn primary" disabled={busy || !!draft} onClick={() => { setEditing(null); setDraft({ ...empty }); }}>Thêm banner</button></div>
    {draft && <form className="utility-banner-form" onSubmit={submit} aria-busy={busy}>
      <h2>{editing ? 'Sửa banner' : 'Banner mới'}</h2>
      <fieldset disabled={busy}>
        <ImageFileField label="Ảnh banner" required file={imageFile} existingUrl={draft.imageUrl} onChange={setImageFile} disabled={busy} />
        <p>Banner hiển thị trọn ảnh, phần trống được lấp bằng nền ảnh làm mờ. Gợi ý ảnh ngang 1200 × 480px để phù hợp vùng hiển thị.</p>
        <label>Liên kết khi bấm (tùy chọn)<input maxLength={2048} placeholder="/wallet hoặc https://…" value={draft.targetUrl ?? ''} onChange={e => setDraft({ ...draft, targetUrl: e.target.value || null })} /></label>
        <label className="utility-banner-check"><input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />Đang bật</label>
        <div className="utility-banner-actions"><button type="submit" className="btn primary">{busy ? 'Đang lưu…' : 'Lưu banner'}</button><button type="button" className="btn ghost" onClick={() => { setDraft(null); setImageFile(null); }}>Hủy</button></div>
      </fieldset>
    </form>}
    {query.isPending ? <p role="status">Đang tải banner…</p> : query.isError ? <div role="alert"><p>{getErrorMessage(query.error)}</p><button type="button" className="btn ghost" onClick={() => void query.refetch()}>Thử lại</button></div> :
      <div className="utility-banner-list">{query.data?.length ? query.data.map(item => <article key={item.id}>
        <img src={item.imageUrl} alt="Banner tiện ích" referrerPolicy="no-referrer" />
        <div><p>{item.isActive ? 'Đang bật' : 'Đã ẩn'}</p><p className="utility-banner-target">{item.targetUrl || 'Không có liên kết'}</p></div>
        <div className="utility-banner-actions"><button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => { setEditing(item.id); setDraft({ imageUrl: item.imageUrl, targetUrl: item.targetUrl, isActive: item.isActive, version: item.version }); }}>Sửa</button>
          <button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => void toggle(item)}>{item.isActive ? 'Ẩn' : 'Bật'}</button>
          <button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => setDeleting(item)}>Xóa</button></div>
      </article>) : <p>Chưa có banner. Ứng dụng sẽ hiển thị banner Mini App mặc định.</p>}</div>}
    {deleting && <ModalFrame titleId="banner-delete-title" busy={busy} onClose={() => setDeleting(null)}>
      <h2 id="banner-delete-title">Xóa banner này?</h2><p>Ảnh này sẽ bị gỡ khỏi danh sách banner.</p>
      <div className="utility-banner-actions"><button type="button" className="btn primary" disabled={busy} onClick={() => void remove()}>Xóa banner</button><button type="button" className="btn ghost" disabled={busy} onClick={() => setDeleting(null)}>Hủy</button></div>
    </ModalFrame>}
  </div>;
}

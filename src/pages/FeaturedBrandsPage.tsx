import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteFeaturedBrand, getFeaturedBrands, saveFeaturedBrand, type FeaturedBrand, type FeaturedBrandInput } from '../services/admin-featured-brand.service';
import { getErrorMessage } from '../services/http';
import { ModalFrame } from '../components/ModalFrame';
import { ImageFileField } from '../components/ImageFileField';
import { uploadAdminImage } from '../services/admin-image.service';
import '../featured-brands.css';

const empty: FeaturedBrandInput = { name: '', logoUrl: '', sortOrder: 0, isActive: false, version: 0 };
export function FeaturedBrandsPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['featured-brands'], queryFn: getFeaturedBrands });
  const [draft, setDraft] = useState<FeaturedBrandInput | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FeaturedBrand | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: ['featured-brands'] });
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!draft || busy) return; setBusy(true);
    try {
      const logoUrl = imageFile ? await uploadAdminImage(imageFile) : draft.logoUrl;
      if (!logoUrl) throw new Error('Vui lòng chọn logo thương hiệu.');
      setDraft({ ...draft, logoUrl }); setImageFile(null);
      await saveFeaturedBrand(editing, { ...draft, logoUrl }); setDraft(null); await refresh(); toast.success('Đã lưu thương hiệu.');
    }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  async function toggle(item: FeaturedBrand) {
    setBusy(true);
    const { id, ...input } = item;
    try { await saveFeaturedBrand(id, { ...input, isActive: !item.isActive }); await refresh(); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return; setBusy(true);
    try { await deleteFeaturedBrand(deleting); setDeleting(null); await refresh(); toast.success('Đã xóa thương hiệu.'); }
    catch (error) { toast.error(getErrorMessage(error)); }
    finally { setBusy(false); }
  }
  return <div className="featured-brands-page">
    <div className="featured-brand-heading"><div><h1>Thương hiệu nổi bật</h1><p>Hiển thị logo bên dưới Mini App theo thứ tự tăng dần. Tên chỉ dùng để quản lý và hỗ trợ truy cập.</p></div>
      <button type="button" className="btn primary" disabled={busy || !!draft} onClick={() => { setEditing(null); setDraft({ ...empty }); }}>Thêm thương hiệu</button></div>
    {draft && <form className="featured-brand-form" onSubmit={submit} aria-busy={busy}>
      <h2>{editing ? 'Sửa thương hiệu' : 'Thương hiệu mới'}</h2>
      <fieldset disabled={busy}>
        <label>Tên thương hiệu<input required maxLength={160} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <ImageFileField label="Logo thương hiệu" required file={imageFile} existingUrl={draft.logoUrl} onChange={setImageFile} disabled={busy} />
        <p>Gợi ý PNG/WebP nền trong suốt. Logo được giữ nguyên tỷ lệ, không cắt ảnh.</p>
        <label>Thứ tự<input required type="number" min={0} max={10000} step={1} value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></label>
        <label className="featured-brand-check"><input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />Đang bật</label>
        <div className="featured-brand-actions"><button type="submit" className="btn primary">{busy ? 'Đang lưu…' : 'Lưu thương hiệu'}</button><button type="button" className="btn ghost" onClick={() => { setDraft(null); setImageFile(null); }}>Hủy</button></div>
      </fieldset>
    </form>}
    {query.isPending ? <p role="status">Đang tải thương hiệu…</p> : query.isError ? <div role="alert"><p>{getErrorMessage(query.error)}</p><button type="button" className="btn ghost" onClick={() => void query.refetch()}>Thử lại</button></div> :
      <div className="featured-brand-list">{query.data?.length ? query.data.map(item => <article key={item.id}>
        <img src={item.logoUrl} alt={item.name} referrerPolicy="no-referrer" />
        <div><h2>{item.name}</h2><p>Thứ tự {item.sortOrder} · {item.isActive ? 'Đang bật' : 'Đã ẩn'}</p></div>
        <div className="featured-brand-actions"><button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => { setEditing(item.id); setDraft({ name: item.name, logoUrl: item.logoUrl, sortOrder: item.sortOrder, isActive: item.isActive, version: item.version }); }}>Sửa</button>
          <button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => void toggle(item)}>{item.isActive ? 'Ẩn' : 'Bật'}</button>
          <button className="btn ghost" type="button" disabled={busy || !!draft} onClick={() => setDeleting(item)}>Xóa</button></div>
      </article>) : <p>Chưa có thương hiệu. Thêm logo và bật để hiển thị trên ứng dụng.</p>}</div>}
    {deleting && <ModalFrame titleId="brand-delete-title" busy={busy} onClose={() => setDeleting(null)}>
      <h2 id="brand-delete-title">Xóa thương hiệu “{deleting.name}”?</h2><p>Logo này sẽ được gỡ khỏi danh sách thương hiệu.</p>
      <div className="featured-brand-actions"><button type="button" className="btn primary" disabled={busy} onClick={() => void remove()}>Xóa thương hiệu</button><button type="button" className="btn ghost" disabled={busy} onClick={() => setDeleting(null)}>Hủy</button></div>
    </ModalFrame>}
  </div>;
}

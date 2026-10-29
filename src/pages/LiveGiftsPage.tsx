import { useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImageFileField } from '../components/ImageFileField';
import { ModalFrame } from '../components/ModalFrame';
import { SvgaPreview } from '../components/SvgaPreview';
import { uploadAdminImage } from '../services/admin-image.service';
import { getErrorMessage } from '../services/http';
import { deleteLiveGift, getLiveGifts, giftAssetUrl, saveLiveGift, type AdminLiveGift, type LiveGiftInput } from '../services/admin-live-gift.service';
import '../live-gifts.css';

const presets = [ { id: 'lion', name: 'Sư tử' }, { id: 'heart-rocket', name: 'Tên lửa' }, { id: 'kiss', name: 'Nụ hôn' } ];
const empty: LiveGiftInput = { name: '', imageUrl: '', animationUrl: null, price: 0, animationType: 2, sortOrder: 0, isActive: false, effectType: 0, effectTier: 0, effectDurationMs: 0 };
async function presetFile(id: string, extension: string) {
  const response = await fetch(`/gift-presets/${id}.${extension}`);
  if (!response.ok) throw new Error('Không tải được hiệu ứng mẫu.');
  return new File([await response.blob()], `${id}.${extension}`, { type: extension === 'png' ? 'image/png' : 'application/octet-stream' });
}
export function LiveGiftsPage() {
  const client = useQueryClient(); const query = useQuery({ queryKey: ['live-gifts'], queryFn: getLiveGifts });
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const [draft, setDraft] = useState<LiveGiftInput | null>(null); const [editing, setEditing] = useState<AdminLiveGift | null>(null);
  const [image, setImage] = useState<File | null>(null); const [animation, setAnimation] = useState<File | null>(null);
  const [effect, setEffect] = useState('none'); const [busy, setBusy] = useState(false); const saving = useRef(false);
  const [deleting, setDeleting] = useState<AdminLiveGift | null>(null); const [fileError, setFileError] = useState('');
  const close = () => { if (!saving.current) { setDraft(null); setImage(null); setAnimation(null); setFileError(''); } };
  const refresh = () => client.invalidateQueries({ queryKey: ['live-gifts'] });
  const rows = (query.data ?? []).filter(item => item.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')) && (status === 'all' || item.isActive === (status === 'active')));
  function open(item: AdminLiveGift | null) { setEditing(item); setDraft(item ? { ...item } : { ...empty }); setImage(null); setAnimation(null); setEffect(item ? 'keep' : 'none'); setFileError(''); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!draft || saving.current || fileError) return;
    saving.current = true; setBusy(true);
    try {
      if (!Number.isSafeInteger(draft.price) || draft.price <= 0) throw new Error('Nhập giá quà VNĐ nguyên, lớn hơn 0.');
      const preset = presets.find(p => p.id === effect);
      let file = animation;
      if (preset) file = await presetFile(preset.id, 'svga');
      if (effect === 'file' && !file) throw new Error('Chọn file hiệu ứng SVGA.');
      const thumbnail = image ?? (preset && !draft.imageUrl ? await presetFile(preset.id, 'png') : null);
      const imageUrl = thumbnail ? await uploadAdminImage(thumbnail) : draft.imageUrl;
      if (!imageUrl) throw new Error('Chọn ảnh đại diện quà.');
      if (thumbnail) { setDraft({ ...draft, imageUrl }); setImage(null); }
      const type = effect.startsWith('legacy-') ? Number(effect.slice(7)) : effect === 'keep' ? draft.effectType : 0;
      const input = { ...draft, imageUrl, effectType: type, effectTier: type ? draft.effectTier || 1 : 0, effectDurationMs: type ? draft.effectDurationMs || 5000 : 0,
        animationType: file ? 2 : draft.animationType, animationUrl: effect === 'keep' ? draft.animationUrl : null };
      await saveLiveGift(editing?.id ?? null, input, file, effect !== 'keep');
      setDraft(null); setImage(null); setAnimation(null); await refresh(); toast.success('Đã lưu quà livestream.');
    } catch (error) { toast.error(getErrorMessage(error)); } finally { saving.current = false; setBusy(false); }
  }
  async function toggle(item: AdminLiveGift) {
    if (saving.current) return; saving.current = true; setBusy(true);
    try { await saveLiveGift(item.id, { ...item, isActive: !item.isActive }); await refresh(); toast.success(item.isActive ? 'Đã tắt quà.' : 'Đã bật quà.'); }
    catch (error) { toast.error(getErrorMessage(error)); } finally { saving.current = false; setBusy(false); }
  }
  async function remove() {
    if (!deleting || saving.current) return; saving.current = true; setBusy(true);
    try { await deleteLiveGift(deleting.id); setDeleting(null); await refresh(); toast.success('Đã xóa quà.'); }
    catch (error) { toast.error(getErrorMessage(error)); } finally { saving.current = false; setBusy(false); }
  }
  const preset = presets.find(p => p.id === effect);
  const previewUrl = preset ? `/gift-presets/${preset.id}.svga` : effect === 'keep' && draft?.animationUrl ? giftAssetUrl(draft.animationUrl) : null;
  return <div className="live-gifts-page">
    <div className="gift-heading"><div><h1>Quà livestream</h1><p>Quản lý quà, giá VNĐ và hiệu ứng trong cùng một danh sách.</p></div><button className="btn primary" disabled={busy} onClick={() => open(null)}>Thêm quà</button></div>
    <div className="gift-filters"><input aria-label="Tìm quà" placeholder="Tìm tên quà…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Lọc trạng thái quà" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option><option value="active">Đang bật</option><option value="inactive">Đang tắt</option></select><span>{rows.length} quà</span></div>
    {query.isPending ? <p role="status">Đang tải quà…</p> : query.isError ? <div role="alert"><p>{getErrorMessage(query.error)}</p><button className="btn" onClick={() => void query.refetch()}>Thử lại</button></div> : <div className="gift-table-wrap"><table className="gift-table"><thead><tr><th>Quà tặng</th><th>Giá VNĐ</th><th>Hiệu ứng</th><th>Thứ tự</th><th>Trạng thái</th><th>Lượt tặng</th><th>Thao tác</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><div className="gift-name"><img src={item.imageUrl} alt="" /><strong>{item.name}</strong></div></td><td>{item.price.toLocaleString('vi-VN')} ₫</td><td>{item.animationDurationMs > 0 ? `SVGA · ${(item.animationDurationMs / 1000).toFixed(1)} giây` : ['Không có', 'Pháo hoa', 'Tên lửa', 'Vương miện'][item.effectType] ?? 'Hiệu ứng'}</td><td>{item.sortOrder}</td><td><button className={`btn ${item.isActive ? 'primary' : ''}`} disabled={busy} onClick={() => void toggle(item)}>{item.isActive ? 'Đang bật' : 'Đang tắt'}</button></td><td>{item.useCount.toLocaleString('vi-VN')}</td><td><div className="gift-actions"><button className="btn" disabled={busy} onClick={() => open(item)}>Sửa</button><button className="btn danger" disabled={busy || item.useCount > 0} title={item.useCount ? 'Quà đã được tặng chỉ có thể tắt' : 'Xóa quà'} onClick={() => setDeleting(item)}>Xóa</button></div></td></tr>)}</tbody></table>{!rows.length && <p className="gift-empty">Chưa có quà phù hợp. Thêm quà mới để bắt đầu.</p>}</div>}
    {draft && <ModalFrame titleId="gift-form-title" busy={busy} onClose={close} className="modal gift-modal"><form onSubmit={submit}>
      <div className="gift-heading"><h2 id="gift-form-title">{editing ? 'Sửa quà' : 'Thêm quà livestream'}</h2><button type="button" className="btn" disabled={busy} onClick={close}>Đóng</button></div>
      <fieldset disabled={busy} className="gift-form-grid"><div className="gift-form-fields">
        <label>Tên quà<input required maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
        <label>Giá VNĐ<input type="number" required min={1} max={Number.MAX_SAFE_INTEGER} step={1} value={draft.price || ''} onChange={e => setDraft({ ...draft, price: Number(e.target.value) })} placeholder="Nhập giá quà" /></label>
        <ImageFileField label="Ảnh đại diện quà" file={image} existingUrl={draft.imageUrl || (preset ? `/gift-presets/${preset.id}.png` : '')} onChange={setImage} disabled={busy} />
        <label>Hiệu ứng<select value={effect} onChange={e => { setEffect(e.target.value); setAnimation(null); setFileError(''); const p = presets.find(p => p.id === e.target.value); if (p && !draft.name) setDraft({ ...draft, name: p.name }); }}>
          {editing && <option value="keep">Giữ hiệu ứng hiện tại</option>}<option value="none">Không có hiệu ứng</option>{presets.map(p => <option key={p.id} value={p.id}>{p.name} · SVGA</option>)}<option value="file">Tải file SVGA mới</option><option value="legacy-1">Pháo hoa</option><option value="legacy-2">Tên lửa cinematic</option><option value="legacy-3">Vương miện</option>
        </select></label>
        {effect === 'file' && <label>File hiệu ứng<input type="file" accept=".svga" required onChange={e => { const file = e.target.files?.[0] ?? null; const error = file && (!file.name.toLowerCase().endsWith('.svga') || file.size > 5 * 1024 * 1024) ? 'Chọn file SVGA tối đa 5 MB.' : ''; setFileError(error); setAnimation(error ? null : file); }} /><small>SVGA 2 · tối đa 5 MB, 30 giây. File được lưu cùng quà trong DB.</small></label>}
        {fileError && <p role="alert">{fileError}</p>}
        <label>Thứ tự hiển thị<input type="number" required min={0} step={1} value={draft.sortOrder} onChange={e => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></label>
        <label className="gift-check"><input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />Bật quà để người xem có thể gửi</label>
      </div><aside><h3>Xem trước hiệu ứng</h3>{previewUrl || animation ? <SvgaPreview key={effect + (animation?.name ?? '')} source={previewUrl} file={animation} /> : <div className="gift-preview-empty">Chọn hiệu ứng hoặc tải file SVGA để xem trước.</div>}<p>Giá và trạng thái chỉ thay đổi khi bạn bấm lưu.</p></aside></fieldset>
      <div className="gift-actions"><button className="btn" type="button" disabled={busy} onClick={close}>Hủy</button><button className="btn primary" type="submit" disabled={busy || !!fileError}>{busy ? 'Đang lưu…' : 'Lưu quà'}</button></div>
    </form></ModalFrame>}
    {deleting && <ModalFrame titleId="gift-delete-title" busy={busy} onClose={() => setDeleting(null)}><h2 id="gift-delete-title">Xóa {deleting.name}?</h2><p>Quà chưa được sử dụng sẽ được xóa khỏi danh sách.</p><div className="gift-actions"><button className="btn" disabled={busy} onClick={() => setDeleting(null)}>Hủy</button><button className="btn danger" disabled={busy} onClick={() => void remove()}>Xóa quà</button></div></ModalFrame>}
  </div>;
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ImagePlus, RefreshCw, Sticker as StickerIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, ErrorView, Loading, PageHeader, type Column } from '../components/common';
import { createSticker, createStickerPack, getStickerPack, getStickerPacks, setStickerActive, setStickerPackActive, updateStickerPack, uploadStickerImage, uploadStickerThumbnail } from '../services/admin-sticker.service';
import { getErrorMessage } from '../services/http';
import type { AdminStickerPack, SaveStickerPack } from '../types/sticker';

const emptyPack: SaveStickerPack = { name: '', description: null, thumbnailUrl: '', price: 0, isFeatured: false, isActive: true, availableFrom: null, availableUntil: null };

function getStickerErrorMessage(error: unknown, missingEndpoint: boolean) {
  if (missingEndpoint && axios.isAxiosError(error) && error.response?.status === 404) {
    return 'API quản lý nhãn dán chưa được triển khai trên máy chủ.';
  }
  return getErrorMessage(error);
}

export function StickerPacksPage() {
  const client = useQueryClient(); const [selectedId, setSelectedId] = useState(''); const [draft, setDraft] = useState(emptyPack); const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); const [thumbnailObjectUrl, setThumbnailObjectUrl] = useState(''); const thumbnailObjectUrlRef = useRef<string | null>(null); const [stickerName, setStickerName] = useState(''); const [stickerUrl, setStickerUrl] = useState('');
  const packs = useQuery({ queryKey: ['sticker-packs'], queryFn: getStickerPacks });
  const detail = useQuery({ queryKey: ['sticker-pack', selectedId], queryFn: () => getStickerPack(selectedId), enabled: Boolean(selectedId) });
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['sticker-packs'] }); if (selectedId) await client.invalidateQueries({ queryKey: ['sticker-pack', selectedId] }); };
  const releaseThumbnailObjectUrl = () => {
    if (thumbnailObjectUrlRef.current) URL.revokeObjectURL(thumbnailObjectUrlRef.current);
    thumbnailObjectUrlRef.current = null;
  };
  const clearThumbnailFile = () => {
    releaseThumbnailObjectUrl();
    setThumbnailObjectUrl('');
    setThumbnailFile(null);
  };
  useEffect(() => {
    return () => releaseThumbnailObjectUrl();
  }, []);
  const chooseThumbnail = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh không được vượt quá 5 MB'); return; }
    releaseThumbnailObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    thumbnailObjectUrlRef.current = objectUrl;
    setThumbnailObjectUrl(objectUrl);
    setThumbnailFile(file);
  };
  const savePack = useMutation({ mutationFn: async () => {
    if (!selectedId) {
      if (!thumbnailFile) throw new Error('Vui lòng chọn ảnh đại diện');
      return createStickerPack(draft, thumbnailFile);
    }
    const thumbnailUrl = thumbnailFile ? await uploadStickerThumbnail(selectedId, thumbnailFile) : draft.thumbnailUrl;
    return updateStickerPack(selectedId, { ...draft, thumbnailUrl });
  }, onSuccess: async (pack) => { toast.success(selectedId ? 'Đã cập nhật bộ nhãn dán' : 'Đã tạo bộ nhãn dán'); setSelectedId(pack.id); clearThumbnailFile(); setDraft({ name: pack.name, description: pack.description, thumbnailUrl: pack.thumbnailUrl, price: pack.price, isFeatured: pack.isFeatured, isActive: pack.isActive, availableFrom: pack.availableFrom, availableUntil: pack.availableUntil }); await refresh(); }, onError: (error) => toast.error(getStickerErrorMessage(error, !selectedId)) });
  const columns: Column<AdminStickerPack>[] = [
    { key: 'name', title: 'Bộ nhãn dán', render: (item) => <div className="sticker-pack-cell"><img alt="" src={item.thumbnailUrl} /><strong>{item.name}</strong></div> },
    { key: 'count', title: 'Nhãn dán', render: (item) => item.stickerCount }, { key: 'price', title: 'Giá', render: (item) => item.price === 0 ? 'Miễn phí' : `${item.price.toLocaleString('vi-VN')} xu` },
    { key: 'owners', title: 'Sở hữu', render: (item) => item.ownerCount }, { key: 'usage', title: 'Lượt dùng', render: (item) => item.usageCount },
    { key: 'status', title: 'Trạng thái', render: (item) => <button className={`btn ${item.isActive ? 'secondary' : 'ghost'}`} onClick={(event) => { event.stopPropagation(); void setStickerPackActive(item.id, !item.isActive).then(refresh); }} type="button">{item.isActive ? 'Đang hiện' : 'Đang ẩn'}</button> },
  ];
  const thumbnailPreviewUrl = thumbnailObjectUrl || (selectedId ? draft.thumbnailUrl : '');
  return <section><PageHeader eyebrow="Nội dung chat" title="Nhãn dán" description="Quản lý bộ nhãn dán, ảnh CDN, giá và trạng thái mà không xoá lịch sử chat." actions={<button className="btn secondary" onClick={() => void refresh()} type="button"><RefreshCw size={16} /> Làm mới</button>} />
    <div className="admin-sticker-grid"><div>{packs.isLoading ? <Loading /> : null}{packs.isError ? <ErrorView message={getStickerErrorMessage(packs.error, true)} onRetry={() => void packs.refetch()} /> : null}{packs.data ? <DataTable columns={columns} items={packs.data} onRowClick={(item) => { setSelectedId(item.id); clearThumbnailFile(); setDraft({ name: item.name, description: item.description, thumbnailUrl: item.thumbnailUrl, price: item.price, isFeatured: item.isFeatured, isActive: item.isActive, availableFrom: item.availableFrom, availableUntil: item.availableUntil }); }} /> : null}</div>
      <aside className="sticker-editor"><div className="section-heading"><h2>{selectedId ? 'Sửa bộ nhãn dán' : 'Tạo bộ nhãn dán'}</h2>{selectedId ? <button className="btn ghost" onClick={() => { setSelectedId(''); clearThumbnailFile(); setDraft(emptyPack); }} type="button">Tạo mới</button> : null}</div><label>Tên<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><div className="sticker-thumbnail-field"><span>Ảnh đại diện</span><label aria-label={thumbnailPreviewUrl ? 'Thay ảnh đại diện' : 'Chọn ảnh đại diện'} className="sticker-thumbnail-picker" title={thumbnailPreviewUrl ? 'Nhấn để chọn ảnh khác' : 'Nhấn để chọn ảnh'}><input accept="image/jpeg,image/png,image/webp" aria-label={thumbnailPreviewUrl ? 'Thay ảnh đại diện' : 'Chọn ảnh đại diện'} className="sticker-thumbnail-input" type="file" onChange={(event) => { chooseThumbnail(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />{thumbnailPreviewUrl ? <><img alt={`Ảnh đại diện ${draft.name || 'đã chọn'}`} src={thumbnailObjectUrl || draft.thumbnailUrl} /><span className="sticker-thumbnail-overlay"><ImagePlus size={15} /> Thay ảnh</span></> : <span className="sticker-thumbnail-placeholder"><ImagePlus size={24} /><strong>Chọn ảnh</strong><small>JPEG · PNG · WebP</small></span>}</label><small>{thumbnailFile?.name ?? (thumbnailPreviewUrl ? 'Nhấn vào ảnh để thay đổi' : 'Tối đa 5 MB')}</small></div><label>Giá xu<input min="0" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></label><label>Mở từ<input type="datetime-local" value={draft.availableFrom?.slice(0, 16) ?? ''} onChange={(e) => setDraft({ ...draft, availableFrom: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label><label>Đến<input type="datetime-local" value={draft.availableUntil?.slice(0, 16) ?? ''} onChange={(e) => setDraft({ ...draft, availableUntil: e.target.value ? new Date(e.target.value).toISOString() : null })} /></label><label className="check"><input checked={draft.isFeatured} type="checkbox" onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} /> Nổi bật</label><label className="check"><input checked={draft.isActive} type="checkbox" onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Hiển thị</label><button className="btn primary" disabled={!draft.name || (!selectedId && !thumbnailFile) || savePack.isPending} onClick={() => savePack.mutate()} type="button"><StickerIcon size={16} /> {selectedId ? 'Lưu thay đổi' : 'Tạo bộ'}</button></aside></div>
    {selectedId && <section className="sticker-detail"><h2>{detail.data?.pack.name ?? 'Chi tiết bộ nhãn dán'}</h2><div className="sticker-upload-row"><label className="btn secondary"><ImagePlus size={16} /> Upload PNG/WebP<input accept="image/png,image/webp" hidden type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadStickerImage(selectedId, file).then(setStickerUrl).catch((error) => toast.error(getErrorMessage(error))); }} /></label><input placeholder="Tên nhãn dán" value={stickerName} onChange={(e) => setStickerName(e.target.value)} /><input placeholder="Image URL" value={stickerUrl} onChange={(e) => setStickerUrl(e.target.value)} /><button className="btn primary" onClick={() => void createSticker(selectedId, { name: stickerName, imageUrl: stickerUrl, thumbnailUrl: null, format: stickerUrl.toLowerCase().endsWith('.png') ? 0 : 1, sortOrder: detail.data?.stickers.length ?? 0, isActive: true }).then(async () => { setStickerName(''); setStickerUrl(''); await refresh(); })} type="button">Thêm</button></div><div className="sticker-admin-list">{detail.data?.stickers.map((item) => <article key={item.id}><img alt={item.name} src={item.imageUrl} /><strong>{item.name}</strong><button className="btn ghost" onClick={() => void setStickerActive(item.id, !item.isActive).then(refresh)} type="button">{item.isActive ? 'Ẩn' : 'Hiện'}</button></article>)}</div></section>}
  </section>;
}

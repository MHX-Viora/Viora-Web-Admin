import { apiClient } from './http';
import type { AdminStickerPack, SaveSticker, SaveStickerPack, Sticker, StickerPackDetail } from '../types/sticker';

export const getStickerPacks = async () => (await apiClient.get<AdminStickerPack[]>('/api/admin/sticker-packs')).data;
export const getStickerPack = async (id: string) => (await apiClient.get<StickerPackDetail>(`/api/admin/sticker-packs/${encodeURIComponent(id)}`)).data;
export const createStickerPack = async (input: SaveStickerPack, thumbnail: File) => {
  const form = new FormData();
  form.append('name', input.name);
  if (input.description) form.append('description', input.description);
  form.append('price', String(input.price));
  form.append('isFeatured', String(input.isFeatured));
  form.append('isActive', String(input.isActive));
  if (input.availableFrom) form.append('availableFrom', input.availableFrom);
  if (input.availableUntil) form.append('availableUntil', input.availableUntil);
  form.append('thumbnail', thumbnail);
  return (await apiClient.post<AdminStickerPack>('/api/admin/sticker-packs', form)).data;
};
export const updateStickerPack = async (id: string, input: SaveStickerPack) => (await apiClient.put<AdminStickerPack>(`/api/admin/sticker-packs/${encodeURIComponent(id)}`, input)).data;
export const setStickerPackActive = async (id: string, isActive: boolean) => { await apiClient.patch(`/api/admin/sticker-packs/${encodeURIComponent(id)}/active`, { isActive }); };
export const createSticker = async (packId: string, input: SaveSticker) => (await apiClient.post<Sticker>(`/api/admin/sticker-packs/${encodeURIComponent(packId)}/stickers`, input)).data;
export const setStickerActive = async (id: string, isActive: boolean) => { await apiClient.patch(`/api/admin/sticker-packs/stickers/${encodeURIComponent(id)}/active`, { isActive }); };
export const uploadStickerImage = async (packId: string, file: File) => {
  const form = new FormData(); form.append('file', file);
  return (await apiClient.post<{ url: string }>(`/api/admin/sticker-packs/${encodeURIComponent(packId)}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.url;
};
export const uploadStickerThumbnail = async (packId: string, file: File) => {
  const form = new FormData(); form.append('file', file);
  return (await apiClient.post<{ url: string }>(`/api/admin/sticker-packs/${encodeURIComponent(packId)}/thumbnail`, form)).data.url;
};

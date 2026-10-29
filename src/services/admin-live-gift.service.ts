import { apiClient } from './http';

export type LiveGiftInput = {
  name: string; imageUrl: string; animationUrl: string | null; price: number;
  animationType: number; sortOrder: number; isActive: boolean;
  effectType: number; effectTier: number; effectDurationMs: number;
};
export type AdminLiveGift = LiveGiftInput & { id: string; useCount: number; animationDurationMs: number };
export const getLiveGifts = async () => (await apiClient.get<AdminLiveGift[]>('/api/live-gifts/admin')).data;
export async function saveLiveGift(id: string | null, input: LiveGiftInput, animation?: File | null, removeAnimation = false) {
  if (!Number.isSafeInteger(input.price) || input.price <= 0) throw new Error('Nhập giá quà VNĐ nguyên, lớn hơn 0.');
  if (animation && (!animation.name.toLowerCase().endsWith('.svga') || animation.size > 5 * 1024 * 1024)) throw new Error('Chọn file SVGA tối đa 5 MB.');
  const form = new FormData();
  form.append('metadata', JSON.stringify({ ...input, animationUrl: input.animationUrl?.startsWith('/api/live-gifts/') ? null : input.animationUrl }));
  if (animation) form.append('animation', animation);
  form.append('removeAnimation', String(removeAnimation));
  const path = id ? `/api/live-gifts/admin/${encodeURIComponent(id)}/upload` : '/api/live-gifts/admin/upload';
  return (await apiClient.request<AdminLiveGift>({ method: id ? 'PUT' : 'POST', url: path, data: form })).data;
}
export const deleteLiveGift = (id: string) => apiClient.delete(`/api/live-gifts/${encodeURIComponent(id)}`);
export function giftAssetUrl(url: string) { return new URL(url, apiClient.defaults.baseURL || window.location.origin).href; }

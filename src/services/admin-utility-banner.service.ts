import { apiClient, unwrapApiData } from './http';

export type UtilityBannerInput = {
  imageUrl: string; targetUrl: string | null;
  isActive: boolean; version: number;
};
export type UtilityBanner = UtilityBannerInput & { id: string };
export const getUtilityBanners = async () => unwrapApiData<UtilityBanner[]>((await apiClient.get('/api/admin/utility-banners', { headers: { 'Cache-Control': 'no-cache' } })).data);
export const saveUtilityBanner = async (id: string | null, input: UtilityBannerInput) =>
  unwrapApiData<UtilityBanner>((await (id ? apiClient.put(`/api/admin/utility-banners/${encodeURIComponent(id)}`, input) : apiClient.post('/api/admin/utility-banners', input))).data);
export const deleteUtilityBanner = (item: UtilityBanner) => apiClient.delete(`/api/admin/utility-banners/${encodeURIComponent(item.id)}`, { params: { version: item.version } });

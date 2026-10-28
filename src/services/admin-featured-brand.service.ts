import { apiClient, unwrapApiData } from './http';

export type FeaturedBrandInput = { name: string; logoUrl: string; sortOrder: number; isActive: boolean; version: number };
export type FeaturedBrand = FeaturedBrandInput & { id: string };
export const getFeaturedBrands = async () => unwrapApiData<FeaturedBrand[]>((await apiClient.get('/api/admin/featured-brands', { headers: { 'Cache-Control': 'no-cache' } })).data);
export const saveFeaturedBrand = async (id: string | null, input: FeaturedBrandInput) =>
  unwrapApiData<FeaturedBrand>((await (id ? apiClient.put(`/api/admin/featured-brands/${encodeURIComponent(id)}`, input) : apiClient.post('/api/admin/featured-brands', input))).data);
export const deleteFeaturedBrand = (item: FeaturedBrand) => apiClient.delete(`/api/admin/featured-brands/${encodeURIComponent(item.id)}`, { params: { version: item.version } });

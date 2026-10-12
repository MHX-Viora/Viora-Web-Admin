import { apiClient } from './http';
export type Banner = { id: string; title: string; imageUrl: string; miniAppId: string | null; categoryId: string | null; sortOrder: number; isActive: boolean; startsAt: string; endsAt: string | null };
export type Placement = { miniAppId: string; name: string; sortOrder: number; isActive: boolean; startsAt: string; endsAt: string | null };
const root = '/api/admin/mini-app-editorial';
export const editorialApi = {
  banners: async () => (await apiClient.get<Banner[]>(`${root}/banners`)).data,
  save: async (input: Omit<Banner, 'id'>, id?: string) => id ? apiClient.put(`${root}/banners/${encodeURIComponent(id)}`, input) : apiClient.post(`${root}/banners`, input),
  remove: (id: string) => apiClient.delete(`${root}/banners/${encodeURIComponent(id)}`),
  placements: async () => (await apiClient.get<Placement[]>(`${root}/placements`)).data,
  place: (appId: string, input: Omit<Placement, 'miniAppId' | 'name'>) => apiClient.put(`${root}/placements/${encodeURIComponent(appId)}`, input),
  visibility: (appId: string, hidden: boolean) => apiClient.put(`${root}/visibility/${encodeURIComponent(appId)}`, { hidden }),
};

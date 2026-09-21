import type { AdminAdvertisement, AdminAdvertisementPage } from '../types/advertisement';
import { apiClient, unwrapApiData } from './http';

export async function getAdminAdvertisements(page: number, pageSize: number, status?: number) {
  const { data } = await apiClient.get<AdminAdvertisementPage>('/api/admin/advertisements', { params: { page, pageSize, status } });
  return unwrapApiData<AdminAdvertisementPage>(data);
}

export async function approveAdminAdvertisement(id: string) {
  const { data } = await apiClient.post(`/api/admin/advertisements/${id}/approve`);
  return unwrapApiData<AdminAdvertisement>(data);
}

export async function rejectAdminAdvertisement(id: string, reason: string) {
  const { data } = await apiClient.post(`/api/admin/advertisements/${id}/reject`, { reason });
  return unwrapApiData<AdminAdvertisement>(data);
}

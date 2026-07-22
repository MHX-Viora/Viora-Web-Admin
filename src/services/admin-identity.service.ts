import { apiClient } from './http';
import type { Identity, ListParams, PageResult } from '../types/admin';

export async function getIdentities(params: ListParams) {
  const { data } = await apiClient.get<PageResult<Identity>>('/api/admin/identities', { params });
  return data;
}

export async function reviewIdentity(id: string, payload: { status: 'approved' | 'rejected'; reason?: string }) {
  const { data } = await apiClient.patch<Identity>(`/api/admin/identities/${id}/review`, payload);
  return data;
}

import { apiClient } from './http';
import type { ListParams, PageResult, Report } from '../types/admin';

export async function getReports(params: ListParams) {
  const { data } = await apiClient.get<PageResult<Report>>('/api/admin/reports', { params });
  return data;
}

export async function reviewReport(id: string, payload: { status: 'approved' | 'rejected'; action?: string }) {
  const { data } = await apiClient.patch<Report>(`/api/admin/reports/${id}/review`, payload);
  return data;
}

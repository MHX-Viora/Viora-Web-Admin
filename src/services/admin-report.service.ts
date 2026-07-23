import { apiClient, normalizePageResult, unwrapApiData } from './http';
import type { AdminReport, ReportListParams } from '../types/admin-report';
import type { ListParams, Report } from '../types/admin';

type ApiReport = Partial<AdminReport>;

export async function getAdminReports(params: ReportListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/reports', { params });
  const result = normalizePageResult<ApiReport>(data);
  return { ...result, items: result.items.map(mapReport) };
}

export async function getReports(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/reports', { params });
  return normalizePageResult<Report>(data);
}

export async function reviewReport(id: string, payload: { status: 'approved' | 'rejected'; action?: string }) {
  const endpoint = payload.status === 'approved' ? 'approve' : 'reject';
  const body = payload.status === 'approved' ? { action: payload.action } : undefined;
  const { data } = await apiClient.patch<unknown>(`/api/admin/reports/${id}/${endpoint}`, body);
  return unwrapApiData(data);
}

export async function getReport(id: string) {
  const { data } = await apiClient.get<unknown>(`/api/admin/reports/${id}`);
  return unwrapApiData<AdminReportDetail>(data);
}

function mapReport(report: ApiReport): AdminReport {
  return {
    id: report.id ?? '',
    reporterUserId: report.reporterUserId ?? '',
    reporterDisplayName: report.reporterDisplayName ?? '',
    targetId: report.targetId ?? '',
    targetType: report.targetType ?? 0,
    reason: report.reason ?? 0,
    status: report.status ?? 0,
    description: report.description ?? '',
    createdAt: report.createdAt ?? '',
  };
}

export type AdminReportDetail = {
  id: string;
  summary: AdminReport;
  target?: unknown;
};

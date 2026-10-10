import { apiClient } from './http';
import type { AdminPage, Developer, DeveloperStatus, MiniAppAudit, MiniAppDashboard, MiniAppListItem, MiniAppPermission, MiniAppStatus, MiniAppUpdate } from '../types/mini-app';
import type { AdminReviewContext, AppVersion, CreatedMiniApp, DeveloperInput, HybridApp, HybridConfig, MiniAppCategory, MiniAppReport } from '../types/mini-app';

export async function getMiniAppDashboard() { return (await apiClient.get<MiniAppDashboard>('/api/admin/mini-apps/dashboard')).data; }
export async function getMiniApps(params: { page: number; pageSize: number; search?: string; status?: MiniAppStatus }) { return (await apiClient.get<AdminPage<MiniAppListItem>>('/api/admin/mini-apps', { params })).data; }
export async function getMiniApp(id: string) { return (await apiClient.get<HybridApp>(`/api/admin/mini-apps/${encodeURIComponent(id)}`)).data; }
export async function getMiniAppPermissions() { return (await apiClient.get<MiniAppPermission[]>('/api/admin/mini-apps/permissions')).data; }
export async function getMiniAppAuditLogs(params: { page: number; pageSize: number; miniAppId?: string }) { return (await apiClient.get<AdminPage<MiniAppAudit>>('/api/admin/mini-apps/logs', { params })).data; }
export async function updateMiniApp(id: string, input: MiniAppUpdate) { await apiClient.put(`/api/admin/mini-apps/${encodeURIComponent(id)}`, input); }
export async function transitionMiniApp(id: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive', reason?: string, version?: number) { await apiClient.post(`/api/admin/mini-apps/${encodeURIComponent(id)}/${action}`, { reason, version }); }
export async function getMiniAppReviewContext(id: string) { return (await apiClient.get<AdminReviewContext>(`/api/admin/mini-apps/${encodeURIComponent(id)}/review`)).data; }
export async function verifyMiniAppDomain(id: string, domainId: string) { await apiClient.post(`/api/admin/mini-apps/${encodeURIComponent(id)}/domains/${encodeURIComponent(domainId)}/verify`); }
export async function getDevelopers(params: { page: number; pageSize: number; search?: string; status?: DeveloperStatus }) { return (await apiClient.get<AdminPage<Developer>>('/api/admin/developers', { params })).data; }
export async function transitionDeveloper(id: string, action: 'approve' | 'suspend' | 'reject') { await apiClient.post(`/api/admin/developers/${encodeURIComponent(id)}/${action}`); }
export async function createDeveloper(input: DeveloperInput) { return (await apiClient.post<Developer>('/api/admin/developers', input)).data; }
export async function getMiniAppVersions(id: string) { return (await apiClient.get<AppVersion[]>(`/api/admin/mini-apps/${encodeURIComponent(id)}/versions`)).data; }
export async function createAdminMiniApp(developerId: string, configuration: HybridConfig) { return (await apiClient.post<CreatedMiniApp>('/api/admin/mini-apps', { developerId, configuration })).data; }
export async function getMiniAppCategories() { return (await apiClient.get<MiniAppCategory[]>('/api/admin/mini-app-categories')).data; }
export async function saveMiniAppCategory(input: Omit<MiniAppCategory, 'id'>, id?: string) { if (id) await apiClient.put(`/api/admin/mini-app-categories/${encodeURIComponent(id)}`, input); else await apiClient.post('/api/admin/mini-app-categories', input); }
export async function saveMiniAppPermission(input: MiniAppPermission, code?: string) { if (code) await apiClient.put(`/api/admin/mini-apps/permissions/${encodeURIComponent(code)}`, input); else await apiClient.post('/api/admin/mini-apps/permissions', input); }
export async function getMiniAppReports(page = 1) { return (await apiClient.get<AdminPage<MiniAppReport>>('/api/admin/mini-apps/reports', { params: { page, pageSize: 20 } })).data; }
export async function resolveMiniAppReport(id: string, reason: string) { await apiClient.post(`/api/admin/mini-apps/reports/${encodeURIComponent(id)}/resolve`, { reason }); }

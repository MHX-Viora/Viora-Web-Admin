import { apiClient } from './http';
import type { AdminPage, Developer, DeveloperStatus, MiniAppAudit, MiniAppDashboard, MiniAppDetail, MiniAppListItem, MiniAppPermission, MiniAppStatus, MiniAppUpdate } from '../types/mini-app';

export async function getMiniAppDashboard() { return (await apiClient.get<MiniAppDashboard>('/api/admin/mini-apps/dashboard')).data; }
export async function getMiniApps(params: { page: number; pageSize: number; search?: string; status?: MiniAppStatus }) { return (await apiClient.get<AdminPage<MiniAppListItem>>('/api/admin/mini-apps', { params })).data; }
export async function getMiniApp(id: string) { return (await apiClient.get<MiniAppDetail>(`/api/admin/mini-apps/${encodeURIComponent(id)}`)).data; }
export async function getMiniAppPermissions() { return (await apiClient.get<MiniAppPermission[]>('/api/admin/mini-apps/permissions')).data; }
export async function getMiniAppAuditLogs(params: { page: number; pageSize: number; miniAppId?: string }) { return (await apiClient.get<AdminPage<MiniAppAudit>>('/api/admin/mini-apps/logs', { params })).data; }
export async function updateMiniApp(id: string, input: MiniAppUpdate) { await apiClient.put(`/api/admin/mini-apps/${encodeURIComponent(id)}`, input); }
export async function transitionMiniApp(id: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string) { await apiClient.post(`/api/admin/mini-apps/${encodeURIComponent(id)}/${action}`, { reason }); }
export async function getDevelopers(params: { page: number; pageSize: number; search?: string; status?: DeveloperStatus }) { return (await apiClient.get<AdminPage<Developer>>('/api/admin/developers', { params })).data; }
export async function transitionDeveloper(id: string, action: 'approve' | 'suspend' | 'reject') { await apiClient.post(`/api/admin/developers/${encodeURIComponent(id)}/${action}`); }

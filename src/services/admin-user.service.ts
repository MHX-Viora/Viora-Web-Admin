import { apiClient, normalizePageResult } from './http';
import type { ListParams, User } from '../types/admin';

export async function getUsers(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/users', { params });
  return normalizePageResult<User>(data);
}

export async function updateUserStatus(userId: string, action: 'lock' | 'unlock' | 'verify' | 'unverify') {
  const { data } = await apiClient.patch<User>(`/api/admin/users/${userId}/${action}`);
  return data;
}

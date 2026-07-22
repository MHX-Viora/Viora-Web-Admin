import { apiClient } from './http';
import type { ListParams, PageResult, User } from '../types/admin';

export async function getUsers(params: ListParams) {
  const { data } = await apiClient.get<PageResult<User>>('/api/admin/users', { params });
  return data;
}

export async function updateUserStatus(userId: string, action: 'lock' | 'unlock' | 'verify' | 'unverify') {
  const { data } = await apiClient.patch<User>(`/api/admin/users/${userId}/${action}`);
  return data;
}

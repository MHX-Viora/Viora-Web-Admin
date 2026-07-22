import { apiClient, normalizePageResult } from './http';
import type { AdminLog, ChatRoom, Hashtag, ListParams, NotificationPayload } from '../types/admin';

export async function getHashtags(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/hashtags', { params });
  return normalizePageResult<Hashtag>(data);
}

export async function renameHashtag(id: string, name: string) {
  const { data } = await apiClient.patch<Hashtag>(`/api/admin/hashtags/${id}`, { name });
  return data;
}

export async function deleteHashtag(id: string) {
  await apiClient.delete(`/api/admin/hashtags/${id}`);
}

export async function getChatRooms(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/chat-rooms', { params });
  return normalizePageResult<ChatRoom>(data);
}

export async function getAdminLogs(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/logs', { params });
  return normalizePageResult<AdminLog>(data);
}

export async function sendSystemNotification(payload: NotificationPayload) {
  const { data } = await apiClient.post<{ id: string }>('/api/admin/notifications', payload);
  return data;
}

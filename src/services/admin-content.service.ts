import { apiClient, normalizePageResult } from './http';
import type { ContentItem, ListParams } from '../types/admin';

export async function getPosts(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/posts', { params });
  return normalizePageResult<ContentItem>(data);
}

export async function getVideos(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/videos', { params });
  return normalizePageResult<ContentItem>(data);
}

export async function moderateContent(kind: 'posts' | 'videos', id: string, action: 'hide' | 'restore' | 'delete') {
  const { data } = await apiClient.patch<ContentItem>(`/api/admin/${kind}/${id}/${action}`);
  return data;
}

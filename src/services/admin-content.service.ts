import { apiClient } from './http';
import type { ContentItem, ListParams, PageResult } from '../types/admin';

export async function getPosts(params: ListParams) {
  const { data } = await apiClient.get<PageResult<ContentItem>>('/api/admin/posts', { params });
  return data;
}

export async function getVideos(params: ListParams) {
  const { data } = await apiClient.get<PageResult<ContentItem>>('/api/admin/videos', { params });
  return data;
}

export async function moderateContent(kind: 'posts' | 'videos', id: string, action: 'hide' | 'restore' | 'delete') {
  const { data } = await apiClient.patch<ContentItem>(`/api/admin/${kind}/${id}/${action}`);
  return data;
}

import { apiClient, normalizePageResult, unwrapApiData } from './http';
import type { ContentItem, ListParams } from '../types/admin';

export async function getPosts(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/posts', { params: toContentParams(params) });
  const result = normalizePageResult<ApiContentItem>(data);
  return { ...result, items: result.items.map(mapContentItem) };
}

export async function getVideos(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/videos', { params: toContentParams(params) });
  const result = normalizePageResult<ApiContentItem>(data);
  return { ...result, items: result.items.map(mapContentItem) };
}

export async function moderateContent(kind: 'posts' | 'videos', id: string, action: 'hide' | 'restore' | 'delete') {
  const { data } = action === 'delete'
    ? await apiClient.delete<unknown>(`/api/admin/${kind}/${id}`)
    : await apiClient.patch<unknown>(`/api/admin/${kind}/${id}/${action}`);
  return unwrapApiData(data);
}

type ApiContentItem = Partial<ContentItem> & {
  displayName?: string;
  media?: { mediaUrl?: string; thumbnailUrl?: string }[];
  reactionCount?: number;
  commentCount?: number;
  shareCount?: number;
  reportCount?: number;
};

function toContentParams(params: ListParams) {
  const [sortBy, sortDirection] = params.sort?.split(':') ?? [];

  return {
    page: params.page,
    pageSize: params.pageSize,
    keyword: params.search || undefined,
    status: params.status || undefined,
    sortBy: sortBy || undefined,
    sortDirection: sortDirection || undefined,
  };
}

function mapContentItem(item: ApiContentItem): ContentItem {
  const firstMedia = item.media?.[0];

  return {
    id: item.id ?? '',
    imageUrl: item.imageUrl ?? firstMedia?.mediaUrl,
    thumbnailUrl: item.thumbnailUrl ?? firstMedia?.thumbnailUrl,
    authorName: item.authorName ?? item.displayName ?? '',
    content: item.content ?? '',
    reactions: item.reactions ?? item.reactionCount ?? 0,
    comments: item.comments ?? item.commentCount ?? 0,
    shares: item.shares ?? item.shareCount ?? 0,
    reports: item.reports ?? item.reportCount ?? 0,
    createdAt: item.createdAt ?? '',
    status: item.status ?? 0,
  };
}

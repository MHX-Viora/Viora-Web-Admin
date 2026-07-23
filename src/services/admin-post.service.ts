import { apiClient, normalizePageResult, unwrapApiData } from './http';
import type { AdminPost, AdminPostDetail, PostListParams } from '../types/admin-post';

type ApiPost = Partial<AdminPost> & {
  location?: string;
  visibility?: number;
  saveCount?: number;
  viewCount?: number;
  media?: AdminPostDetail['media'];
  hashtags?: string[];
  reactionCount?: number;
  reactions?: number;
  commentCount?: number;
  comments?: number;
  shareCount?: number;
  shares?: number;
  reportCount?: number;
  reports?: number;
};

export async function getAdminPosts(params: PostListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/posts', { params });
  const result = normalizePageResult<ApiPost>(data);
  return { ...result, items: result.items.map(mapPost) };
}

export async function getAdminPost(id: string) {
  const { data } = await apiClient.get<unknown>(`/api/admin/posts/${id}`);
  return mapPostDetail(unwrapApiData<ApiPost>(data));
}

export async function moderateAdminPost(id: string, action: 'hide' | 'restore' | 'delete') {
  const { data } = action === 'delete'
    ? await apiClient.delete<unknown>(`/api/admin/posts/${id}`)
    : await apiClient.patch<unknown>(`/api/admin/posts/${id}/${action}`);
  return unwrapApiData(data);
}

function mapPost(post: ApiPost): AdminPost {
  return {
    id: post.id ?? '',
    userId: post.userId ?? '',
    displayName: post.displayName ?? '',
    avatarUrl: post.avatarUrl,
    postType: post.postType ?? 0,
    content: post.content ?? '',
    status: post.status ?? 0,
    reactionCount: post.reactionCount ?? post.reactions ?? 0,
    commentCount: post.commentCount ?? post.comments ?? 0,
    shareCount: post.shareCount ?? post.shares ?? 0,
    reportCount: post.reportCount ?? post.reports ?? 0,
    createdAt: post.createdAt ?? '',
  };
}

function mapPostDetail(post: ApiPost): AdminPostDetail {
  return {
    ...mapPost(post),
    location: post.location,
    visibility: post.visibility ?? 0,
    saveCount: post.saveCount ?? 0,
    viewCount: post.viewCount ?? 0,
    media: post.media ?? [],
    hashtags: post.hashtags ?? [],
  };
}

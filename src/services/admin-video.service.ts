import { apiClient, normalizePageResult } from './http';
import type { AdminVideo, AdminVideoDetail, VideoListParams } from '../types/admin-video';

type ApiVideo = Partial<AdminVideo> & {
  location?: string;
  visibility?: number;
  saveCount?: number;
  viewCount?: number;
  media?: AdminVideoDetail['media'];
  hashtags?: string[];
  reactions?: number;
  comments?: number;
  shares?: number;
  reports?: number;
};

export async function getAdminVideos(params: VideoListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/videos', { params });
  const result = normalizePageResult<ApiVideo>(data);
  return { ...result, items: result.items.map(mapVideo) };
}

export async function getAdminVideo(id: string) {
  const { data } = await apiClient.get<unknown>(`/api/admin/videos/${id}`);
  return mapVideoDetail(unwrapApiData<ApiVideo>(data));
}

function mapVideo(video: ApiVideo): AdminVideo {
  return {
    id: video.id ?? '',
    userId: video.userId ?? '',
    displayName: video.displayName ?? '',
    avatarUrl: video.avatarUrl,
    postType: video.postType ?? 1,
    content: video.content ?? '',
    status: video.status ?? 0,
    reactionCount: video.reactionCount ?? video.reactions ?? 0,
    commentCount: video.commentCount ?? video.comments ?? 0,
    shareCount: video.shareCount ?? video.shares ?? 0,
    reportCount: video.reportCount ?? video.reports ?? 0,
    createdAt: video.createdAt ?? '',
  };
}

function mapVideoDetail(video: ApiVideo): AdminVideoDetail {
  return {
    ...mapVideo(video),
    location: video.location,
    visibility: video.visibility ?? 0,
    saveCount: video.saveCount ?? 0,
    viewCount: video.viewCount ?? 0,
    media: video.media ?? [],
    hashtags: video.hashtags ?? [],
  };
}

function unwrapApiData<T>(value: unknown) {
  if (!value || typeof value !== 'object') return value as T;

  const record = value as Record<string, unknown>;
  return (record.data ?? value) as T;
}

export type AdminVideo = {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  postType: number;
  content: string;
  status: number;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  reportCount: number;
  createdAt: string;
};

export type AdminVideoMedia = {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
};

export type AdminVideoDetail = AdminVideo & {
  location?: string;
  visibility: number;
  saveCount: number;
  viewCount: number;
  media: AdminVideoMedia[];
  hashtags: string[];
};

export type VideoListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  userId?: string;
  reported?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
};

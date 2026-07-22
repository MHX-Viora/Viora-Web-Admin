export type AdminPost = {
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

export type AdminPostMedia = {
  id: string;
  mediaUrl: string;
  thumbnailUrl?: string;
};

export type AdminPostDetail = AdminPost & {
  location?: string;
  visibility: number;
  saveCount: number;
  viewCount: number;
  media: AdminPostMedia[];
  hashtags: string[];
};

export type PostListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  userId?: string;
  reported?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: string;
};

export type Status = 'active' | 'inactive' | 'locked' | 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted' | 'resolved';

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ListParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  identityStatus?: string;
  isVerified?: string;
  sort?: string;
};

export type DashboardStats = {
  totalUsers: number;
  newUsersToday: number;
  activeUsersToday: number;
  totalPosts: number;
  todayPosts: number;
  totalVideos: number;
  todayVideos: number;
  totalComments: number;
  chatRooms: number;
  pendingReports: number;
  pendingIdentities: number;
};

export type User = {
  id: string;
  accountId?: string;
  avatarUrl?: string;
  coverUrl?: string;
  name: string;
  email: string;
  phone?: string;
  role?: number;
  status: Status | string | number;
  identityStatus?: number;
  identity?: Identity | null;
  verified: boolean;
  identityNumber?: string;
  postCount: number;
  videoCount: number;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  reportCount: number;
  createdAt: string;
  lastLoginAt?: string;
};

export type Identity = {
  id: string;
  userId?: string;
  userName?: string;
  displayName?: string;
  avatarUrl?: string;
  fullName?: string;
  birthday?: string;
  identityNumber?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  rejectReason?: string;
  createdAt?: string;
  reviewedAt?: string;
  submittedAt?: string;
  status: Status | string | number;
};

export type ContentItem = {
  id: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  authorName: string;
  content: string;
  reactions: number;
  comments: number;
  shares: number;
  reports: number;
  createdAt: string;
  status: Status;
};

export type Report = {
  id: string;
  reporterName: string;
  targetType: 'post' | 'video' | 'comment' | 'user';
  targetLabel: string;
  reason: string;
  createdAt: string;
  status: Status;
  content?: ContentItem;
  user?: User;
};

export type Hashtag = {
  id: string;
  name: string;
  postCount: number;
  createdAt: string;
};

export type ChatRoom = {
  id: string;
  name: string;
  type: 'direct' | 'group';
  memberCount: number;
  lastMessage?: string;
  createdAt: string;
  members?: User[];
  messages?: ChatMessage[];
};

export type ChatMessage = {
  id: string;
  senderName: string;
  content: string;
  createdAt: string;
};

export type AdminLog = {
  id: string;
  adminName: string;
  action: string;
  target: string;
  description: string;
  createdAt: string;
};

export type NotificationPayload = {
  title: string;
  content: string;
  imageUrl?: string;
  sendTo: 'all' | 'verified' | 'unverified';
};

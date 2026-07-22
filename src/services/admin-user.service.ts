import { apiClient, normalizePageResult } from './http';
import type { ListParams, User } from '../types/admin';

export async function getUsers(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/users', { params: toUserParams(params) });
  const result = normalizePageResult<ApiUser>(data);
  return { ...result, items: result.items.map(mapUser) };
}

export async function getUser(id: string) {
  const { data } = await apiClient.get<unknown>(`/api/admin/users/${id}`);
  return mapUser(unwrapApiData<ApiUser>(data));
}

export async function updateUserStatus(userId: string, payload: { status: number; reason?: string }) {
  const { data } = await apiClient.patch<unknown>(`/api/admin/users/${userId}/status`, payload);
  return unwrapApiData(data);
}

export async function updateUserVerification(userId: string, payload: { isVerified: boolean }) {
  const { data } = await apiClient.patch<unknown>(`/api/admin/users/${userId}/verify`, payload);
  return unwrapApiData(data);
}

type ApiUser = {
  id: string;
  accountId?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  coverUrl?: string;
  email?: string;
  phone?: string | null;
  role?: number;
  status?: User['status'];
  identityStatus?: number;
  identity?: User['identity'];
  isVerified?: boolean;
  verified?: boolean;
  identityNumber?: string;
  postCount?: number;
  videoCount?: number;
  followerCount?: number;
  followingCount?: number;
  friendCount?: number;
  reportCount?: number;
  createdAt?: string;
  lastLoginAt?: string;
};

function toUserParams(params: ListParams) {
  const [sortBy, sortDirection] = params.sort?.split(':') ?? [];

  return {
    page: params.page,
    pageSize: params.pageSize,
    keyword: params.search,
    status: params.status || undefined,
    identityStatus: params.identityStatus || undefined,
    isVerified: params.isVerified || undefined,
    sortBy: sortBy || undefined,
    sortDirection: sortDirection || undefined,
  };
}

function mapUser(user: ApiUser): User {
  return {
    id: user.id,
    accountId: user.accountId,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    name: user.displayName ?? user.name ?? 'Chưa có tên',
    email: user.email ?? '-',
    phone: user.phone ?? undefined,
    role: user.role,
    status: user.status ?? 'inactive',
    identityStatus: user.identityStatus,
    identity: user.identity,
    verified: user.isVerified ?? user.verified ?? false,
    identityNumber: user.identityNumber,
    postCount: user.postCount ?? 0,
    videoCount: user.videoCount ?? 0,
    followerCount: user.followerCount ?? 0,
    followingCount: user.followingCount ?? 0,
    friendCount: user.friendCount ?? 0,
    reportCount: user.reportCount ?? 0,
    createdAt: user.createdAt ?? '',
    lastLoginAt: user.lastLoginAt,
  };
}

function unwrapApiData<T>(value: unknown) {
  if (!value || typeof value !== 'object') return value as T;

  const record = value as Record<string, unknown>;
  return (record.data ?? value) as T;
}

import { apiClient } from './http';
import type { DashboardStats } from '../types/admin';

const emptyStats: DashboardStats = {
  totalUsers: 0,
  newUsersToday: 0,
  activeUsersToday: 0,
  totalPosts: 0,
  todayPosts: 0,
  totalVideos: 0,
  todayVideos: 0,
  totalComments: 0,
  chatRooms: 0,
  pendingReports: 0,
  pendingIdentities: 0,
};

export async function getDashboardStats() {
  const { data } = await apiClient.get<unknown>('/api/admin/dashboard');
  const stats = unwrapDashboardData(data);

  return {
    ...emptyStats,
    totalUsers: stats.userCount ?? emptyStats.totalUsers,
    activeUsersToday: stats.activeUserToday ?? emptyStats.activeUsersToday,
    newUsersToday: stats.newUserToday ?? emptyStats.newUsersToday,
    totalPosts: stats.postCount ?? emptyStats.totalPosts,
    todayPosts: stats.todayPostCount ?? emptyStats.todayPosts,
    totalVideos: stats.videoCount ?? emptyStats.totalVideos,
    todayVideos: stats.todayVideoCount ?? emptyStats.todayVideos,
    totalComments: stats.commentCount ?? emptyStats.totalComments,
    chatRooms: stats.conversationCount ?? emptyStats.chatRooms,
    pendingReports: stats.pendingReportCount ?? emptyStats.pendingReports,
    pendingIdentities: stats.pendingIdentityCount ?? emptyStats.pendingIdentities,
  };
}

function unwrapDashboardData(value: unknown) {
  if (!value || typeof value !== 'object') return {};

  const record = value as Record<string, unknown>;
  const payload = record.data;
  if (payload && typeof payload === 'object') {
    return payload as Partial<Record<string, number>>;
  }

  return record as Partial<Record<string, number>>;
}

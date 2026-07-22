import { apiClient } from './http';
import type { DashboardStats } from '../types/admin';

const emptyStats: DashboardStats = {
  totalUsers: 0,
  newUsersToday: 0,
  activeUsersToday: 0,
  totalPosts: 0,
  totalVideos: 0,
  totalComments: 0,
  chatRooms: 0,
  pendingReports: 0,
  pendingIdentities: 0,
};

export async function getDashboardStats() {
  const { data } = await apiClient.get<Partial<DashboardStats>>('/api/admin/dashboard');
  return { ...emptyStats, ...data };
}

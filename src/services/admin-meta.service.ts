import { apiClient, normalizePageResult, unwrapApiData } from './http';
import type { AdminLog, ChatRoom, Hashtag, ListParams, NotificationPayload } from '../types/admin';

export async function getHashtags(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/hashtags', { params: toListParams(params) });
  return normalizePageResult<Hashtag>(data);
}

export async function renameHashtag(id: string, name: string) {
  const { data } = await apiClient.patch<unknown>(`/api/admin/hashtags/${id}`, { name });
  return unwrapApiData(data);
}

export async function deleteHashtag(id: string) {
  await apiClient.delete(`/api/admin/hashtags/${id}`);
}

export async function getChatRooms(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/conversations', { params: toListParams(params) });
  const result = normalizePageResult<ApiConversation>(data);
  return { ...result, items: result.items.map(mapConversation) };
}

export async function getChatRoom(id: string) {
  const { data } = await apiClient.get<unknown>(`/api/admin/conversations/${id}`);
  return mapConversation(unwrapApiData<ApiConversation>(data));
}

export async function getAdminLogs(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/logs', { params: toListParams(params) });
  const result = normalizePageResult<ApiLog>(data);
  return { ...result, items: result.items.map(mapLog) };
}

export async function sendSystemNotification(payload: NotificationPayload) {
  const { data } = await apiClient.post<unknown>('/api/admin/announcements', payload);
  return unwrapApiData(data);
}

type ApiConversation = {
  id?: string;
  name?: string;
  type?: ChatRoom['type'];
  memberCount?: number;
  lastMessage?: string;
  createdAt?: string;
  conversationType?: number;
  updatedAt?: string;
  lastMessageAt?: string;
  members?: { userId: string; displayName: string; avatarUrl?: string }[];
  messages?: { id: string; senderDisplayName?: string; content?: string; createdAt: string; isDeleted?: boolean }[];
};

type ApiLog = Partial<AdminLog> & {
  adminDisplayName?: string;
  targetType?: string;
  targetId?: string;
};

function toListParams(params: ListParams) {
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

function mapConversation(room: ApiConversation): ChatRoom {
  return {
    id: room.id ?? '',
    name: room.name ?? (room.conversationType === 0 ? 'Trò chuyện trực tiếp' : 'Nhóm trò chuyện'),
    type: room.type ?? (room.conversationType === 0 ? 'direct' : 'group'),
    memberCount: room.memberCount ?? 0,
    lastMessage: room.lastMessage ?? room.lastMessageAt,
    createdAt: room.createdAt ?? room.updatedAt ?? '',
    members: room.members?.map((member) => ({
      id: member.userId,
      name: member.displayName,
      email: '',
      status: 'active',
      verified: false,
      postCount: 0,
      videoCount: 0,
      followerCount: 0,
      followingCount: 0,
      friendCount: 0,
      reportCount: 0,
      createdAt: '',
      avatarUrl: member.avatarUrl,
    })),
    messages: room.messages?.map((message) => ({
      id: message.id,
      senderName: message.senderDisplayName ?? '',
      content: message.isDeleted ? '[Đã xóa]' : message.content ?? '',
      createdAt: message.createdAt,
    })),
  };
}

function mapLog(log: ApiLog): AdminLog {
  return {
    id: log.id ?? '',
    adminName: log.adminName ?? log.adminDisplayName ?? '',
    action: log.action ?? '',
    target: log.target ?? [log.targetType, log.targetId].filter(Boolean).join(' / '),
    description: log.description ?? '',
    createdAt: log.createdAt ?? '',
  };
}

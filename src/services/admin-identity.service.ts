import { apiClient, normalizePageResult, unwrapApiData } from './http';
import type { Identity, ListParams } from '../types/admin';

export async function getIdentities(params: ListParams) {
  const { data } = await apiClient.get<unknown>('/api/admin/identities', { params: toIdentityParams(params) });
  const result = normalizePageResult<ApiIdentity>(data);
  return { ...result, items: result.items.map(mapIdentity) };
}

export async function getIdentity(id: string) {
  const { data } = await apiClient.get<unknown>(`/api/admin/identities/${id}`);
  return mapIdentity(unwrapApiData<ApiIdentity>(data));
}

export async function reviewIdentity(id: string, payload: { status: 'approved' | 'rejected'; reason?: string }) {
  const endpoint = payload.status === 'approved' ? 'approve' : 'reject';
  const body = payload.status === 'rejected' ? { reason: payload.reason } : undefined;
  const { data } = await apiClient.patch<unknown>(`/api/admin/identities/${id}/${endpoint}`, body);
  return unwrapApiData(data);
}

type ApiIdentity = Partial<Identity> & {
  displayName?: string;
  fullName?: string;
  createdAt?: string;
  reviewedAt?: string;
};

function toIdentityParams(params: ListParams) {
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

function mapIdentity(identity: ApiIdentity): Identity {
  return {
    id: identity.id ?? '',
    userId: identity.userId,
    userName: identity.displayName ?? identity.userName ?? '',
    displayName: identity.displayName,
    avatarUrl: identity.avatarUrl,
    fullName: identity.fullName,
    birthday: identity.birthday,
    identityNumber: identity.identityNumber,
    frontImageUrl: identity.frontImageUrl,
    backImageUrl: identity.backImageUrl,
    rejectReason: identity.rejectReason,
    createdAt: identity.createdAt,
    reviewedAt: identity.reviewedAt,
    submittedAt: identity.createdAt ?? identity.submittedAt,
    status: identity.status ?? 0,
  };
}

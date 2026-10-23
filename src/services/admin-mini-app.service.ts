import { apiClient } from './http';
import { parseAppDetail, parseAppId, parseAppPage, parseId, parseModerationResult, parseOverview, parseQuery, parseReview, parseReviewDetail, parseReviewPage, validateCommand, validateModeration } from '../types/mini-app-review';
import type { ModerationCommand, QueueQuery, ReviewAction, ReviewCommand } from '../types/mini-app-review';

export class MiniAppAdminError extends Error {
  readonly status: number;
  readonly ambiguous: boolean;
  constructor(status: number) {
    super(status === 401 ? 'Phiên quản trị đã hết hạn. Hãy đăng nhập lại.' : status === 403 ? 'Bạn không có quyền thực hiện thao tác này.' : status === 409 ? 'Trạng thái đã thay đổi. Hãy tải lại và kiểm tra trước khi thao tác.' : status === 404 ? 'Không tìm thấy dữ liệu hoặc module chưa được bật.' : status === 429 ? 'Quá nhiều yêu cầu. Hãy thử lại sau.' : status === 400 ? 'Dữ liệu không hợp lệ. Hãy kiểm tra nội dung và lý do.' : 'Chưa xác nhận được kết quả. Thử lại cùng yêu cầu hoặc tải lại để kiểm tra.');
    this.status = status; this.ambiguous = status === 0 || status >= 500;
  }
}
async function request<T>(method: 'get' | 'post', path: string, parse: (value: unknown) => T, payload?: unknown, signal?: AbortSignal) {
  let data: unknown;
  try {
    const config = { signal, timeout: 45000, headers: { 'Cache-Control': 'no-store' } };
    const response = method === 'get' ? await apiClient.get<unknown>(path, { ...config, params: payload }) : await apiClient.post<unknown>(path, payload, config);
    data = response.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    throw new MiniAppAdminError(typeof status === 'number' ? status : 0);
  }
  try { return parse(data); } catch (error) { if (method === 'post') throw new MiniAppAdminError(0); throw error; }
}
export async function listReviews(query: QueueQuery, signal?: AbortSignal) { return request('get', '/api/admin/mini-app-reviews', parseReviewPage, parseQuery(query), signal); }
export async function getOverview(signal?: AbortSignal) { return request('get', '/api/admin/mini-app-reviews/overview', parseOverview, undefined, signal); }
export async function getReview(id: string, signal?: AbortSignal) {
  parseId(id); const result = await request('get', `/api/admin/mini-app-reviews/${id.toLowerCase()}`, parseReviewDetail, undefined, signal);
  if (result.review.review.id.toLowerCase() !== id.toLowerCase()) throw new Error('Yêu cầu trả về không khớp.'); return result;
}
export async function reviewCommand(id: string, action: ReviewAction, body: ReviewCommand) {
  parseId(id); validateCommand(action, body);
  const result = await request('post', `/api/admin/mini-app-reviews/${id.toLowerCase()}/${action}`, parseReview, body);
  const expected = { start: 'InReview', assign: 'InReview', approve: 'Approved', reject: 'Rejected', 'request-changes': 'ChangesRequested' }[action];
  if (result.id.toLowerCase() !== id.toLowerCase() || result.status !== expected) throw new MiniAppAdminError(0); return result;
}
export async function listApps(query: QueueQuery, signal?: AbortSignal) { return request('get', '/api/admin/mini-apps', parseAppPage, parseQuery(query, true), signal); }
export async function getApp(id: string, signal?: AbortSignal) {
  parseAppId(id); const result = await request('get', `/api/admin/mini-apps/${id}`, parseAppDetail, undefined, signal);
  if (result.app.appId !== id) throw new Error('Ứng dụng trả về không khớp.'); return result;
}
export async function moderateApp(id: string, action: 'suspend' | 'restore', body: ModerationCommand) {
  parseAppId(id); if (action !== 'suspend' && action !== 'restore') throw new Error('Thao tác không hợp lệ.');
  validateModeration(body); const result = await request('post', `/api/admin/mini-apps/${id}/${action}`, parseModerationResult, body);
  if (result.operational.status !== (action === 'suspend' ? 'Suspended' : 'Active')) throw new MiniAppAdminError(0); return result;
}

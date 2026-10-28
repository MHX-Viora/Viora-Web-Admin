import axios from 'axios';
import type { PageResult } from '../types/admin';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() ?? '',
  withCredentials: true,
});

export function getErrorMessage(error: unknown) {
  const fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  if (axios.isAxiosError(error)) {
    const data = parseErrorData(error.response?.data);
    const body = data && typeof data === 'object' ? data as Record<string, unknown> : {};
    const nested = body.error && typeof body.error === 'object' ? body.error as Record<string, unknown> : {};
    const validation = body.errors && typeof body.errors === 'object'
      ? Object.values(body.errors).flat().filter(value => typeof value === 'string' && value.trim()).join(' ') : undefined;
    const statuses: Record<number, string> = {
      401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      403: 'Bạn không có quyền thực hiện thao tác này.',
      404: 'Không tìm thấy API yêu cầu. Vui lòng kiểm tra phiên bản backend.',
      413: 'Tệp tải lên vượt quá giới hạn dung lượng.',
    };
    const message = [nested.message, body.message, validation, body.detail, body.title,
      statuses[error.response?.status ?? 0], error.message, fallback].find(nonEmptyMessage) as string;
    const traceId = nonEmptyMessage(body.traceId) ? `TraceId: ${body.traceId}` : '';
    return [message.trim(), traceId].filter(Boolean).join(' ');
  }

  if (error instanceof Error) {
    return error.message.trim() || fallback;
  }

  return fallback;
}

function nonEmptyMessage(value: unknown): value is string { return typeof value === 'string' && !!value.trim(); }

function parseErrorData(data: unknown) {
  if (typeof data !== 'string') return data;

  try {
    return JSON.parse(data) as unknown;
  } catch {
    return { message: data };
  }
}

export function unwrapApiData<T>(value: unknown): T {
  if (!value || typeof value !== 'object') return value as T;

  const record = value as Record<string, unknown>;
  return (record.data ?? value) as T;
}

export function normalizePageResult<T>(value: unknown): PageResult<T> {
  const pageValue = unwrapPageValue(value);

  if (Array.isArray(pageValue)) {
    return { items: pageValue as T[], total: pageValue.length, page: 1, pageSize: pageValue.length };
  }

  if (pageValue && typeof pageValue === 'object') {
    const record = pageValue as Record<string, unknown>;
    const items = pickArray<T>(record, ['items', 'content', 'results', 'data']);
    const total = pickNumber(record, ['total', 'totalItems', 'totalElements', 'count'], items.length);
    const page = pickNumber(record, ['page', 'currentPage'], 1);
    const pageSize = pickNumber(record, ['pageSize', 'limit', 'size', 'perPage'], items.length);

    return { items, total, page, pageSize };
  }

  return { items: [], total: 0, page: 1, pageSize: 0 };
}

function unwrapPageValue(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  return unwrapApiData(value);
}

function pickArray<T>(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  return [];
}

function pickNumber(record: Record<string, unknown>, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

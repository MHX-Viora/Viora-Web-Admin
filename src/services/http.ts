import axios from 'axios';
import type { PageResult } from '../types/admin';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = parseErrorData(error.response?.data);
    const message = typeof data === 'object' && data && 'message' in data ? String(data.message) : undefined;
    const traceId = typeof data === 'object' && data && 'traceId' in data ? String(data.traceId) : undefined;
    return [message ?? error.message, traceId ? `TraceId: ${traceId}` : undefined].filter(Boolean).join(' ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra';
}

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

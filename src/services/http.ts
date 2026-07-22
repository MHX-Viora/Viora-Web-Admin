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
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    return message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã có lỗi xảy ra';
}

export function normalizePageResult<T>(value: unknown): PageResult<T> {
  if (Array.isArray(value)) {
    return { items: value as T[], total: value.length, page: 1, pageSize: value.length };
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const items = pickArray<T>(record, ['items', 'data', 'content', 'results']);
    const total = pickNumber(record, ['total', 'totalItems', 'totalElements', 'count'], items.length);
    const page = pickNumber(record, ['page', 'currentPage'], 1);
    const pageSize = pickNumber(record, ['pageSize', 'limit', 'size', 'perPage'], items.length);

    return { items, total, page, pageSize };
  }

  return { items: [], total: 0, page: 1, pageSize: 0 };
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

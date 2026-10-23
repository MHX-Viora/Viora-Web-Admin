import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getApp, getOverview, getReview, listApps, listReviews } from '../services/admin-mini-app.service';
import { reviewStatuses } from '../types/mini-app-review';
import type { QueueQuery } from '../types/mini-app-review';

export const miniAppQueryKey = ['admin-mini-apps'] as const;
function useFilters(apps = false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const number = (name: string, fallback: number, max: number) => {
    const value = Number(searchParams.get(name)); return Number.isSafeInteger(value) && value >= 1 && value <= max ? value : fallback;
  };
  const rawStatus = searchParams.get('status');
  const query: QueueQuery = { page: number('page', 1, 100000), pageSize: number('pageSize', 20, 100), search: (searchParams.get('search') ?? '').slice(0, 128) };
  const view = searchParams.get('view'); if (apps && (view === 'published' || view === 'suspended')) query.view = view;
  if (!apps) {
    if (reviewStatuses.includes(rawStatus as typeof reviewStatuses[number])) query.status = rawStatus as typeof reviewStatuses[number];
    query.sort = searchParams.get('sort') === 'newest' ? 'newest' : 'oldest';
    const assignee = searchParams.get('assignee'); if (assignee) query.assignee = assignee;
  }
  function update(next: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => value === '' ? params.delete(key) : params.set(key, String(value)));
    if (!Object.hasOwn(next, 'page')) params.set('page', '1');
    setSearchParams(params, { replace: true });
  }
  return { query, update };
}
export function useMiniAppReviews() {
  const filters = useFilters();
  const result = useQuery({ queryKey: [...miniAppQueryKey, 'reviews', filters.query], queryFn: ({ signal }) => listReviews(filters.query, signal), retry: false });
  return { ...filters, result };
}
export function useMiniApps() {
  const filters = useFilters(true);
  const result = useQuery({ queryKey: [...miniAppQueryKey, 'apps', filters.query], queryFn: ({ signal }) => listApps(filters.query, signal), retry: false });
  return { ...filters, result };
}
export function useMiniAppOverview() { return useQuery({ queryKey: [...miniAppQueryKey, 'overview'], queryFn: ({ signal }) => getOverview(signal), retry: false }); }
export function useMiniAppReview(id: string) { return useQuery({ queryKey: [...miniAppQueryKey, 'review', id], queryFn: ({ signal }) => getReview(id, signal), retry: false, enabled: !!id }); }
export function useMiniApp(id: string) { return useQuery({ queryKey: [...miniAppQueryKey, 'app', id], queryFn: ({ signal }) => getApp(id, signal), retry: false, enabled: !!id }); }

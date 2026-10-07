import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getAdminPosts } from '../services/admin-post.service';
import type { PostManagementScope } from '../types/admin-post';

export function usePosts(scope: PostManagementScope = 'posts') {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keywordDraft, setKeywordDraft] = useState(searchParams.get('keyword') ?? '');

  const page = readNumber(searchParams.get('page'), 1);
  const pageSize = readNumber(searchParams.get('pageSize'), 20);
  const keyword = searchParams.get('keyword') ?? '';
  const userId = searchParams.get('userId') ?? '';
  const reported = searchParams.get('reported') ?? '';
  const status = searchParams.get('status') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortDirection = searchParams.get('sortDirection') ?? 'desc';

  const params = useMemo(
    () => ({ page, pageSize, keyword: keyword || undefined, userId: userId || undefined, reported: reported || undefined, status: status || undefined, sortBy, sortDirection }),
    [page, pageSize, keyword, userId, reported, status, sortBy, sortDirection],
  );

  const query = useQuery({
    queryKey: [scope, params],
    queryFn: () => getAdminPosts(params, scope),
  });

  function update(next: Record<string, string | number | undefined>) {
    const merged = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') merged.delete(key);
      else merged.set(key, String(value));
    });
    setSearchParams(merged, { replace: true });
  }

  return { query, state: { page, pageSize, keyword, keywordDraft, userId, reported, status, sortBy, sortDirection }, setKeywordDraft, update };
}

function readNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

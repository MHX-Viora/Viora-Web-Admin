import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getUsers } from '../services/admin-user.service';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function useUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keywordDraft, setKeywordDraft] = useState(searchParams.get('keyword') ?? '');

  const page = readNumber(searchParams.get('page'), DEFAULT_PAGE);
  const pageSize = readNumber(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
  const keyword = searchParams.get('keyword') ?? '';
  const status = searchParams.get('status') ?? '';
  const identityStatus = searchParams.get('identityStatus') ?? '';
  const isVerified = searchParams.get('isVerified') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortDirection = searchParams.get('sortDirection') ?? 'desc';

  const params = useMemo(
    () => ({ page, pageSize, search: keyword || undefined, status: status || undefined, identityStatus: identityStatus || undefined, isVerified: isVerified || undefined, sort: `${sortBy}:${sortDirection}` }),
    [page, pageSize, keyword, status, identityStatus, isVerified, sortBy, sortDirection],
  );

  const query = useQuery({ queryKey: ['users', params], queryFn: () => getUsers(params) });

  function update(next: Record<string, string | number | undefined>) {
    const merged = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') merged.delete(key);
      else merged.set(key, String(value));
    });
    setSearchParams(merged, { replace: true });
  }

  return {
    query,
    state: { page, pageSize, keyword, keywordDraft, status, identityStatus, isVerified, sortBy, sortDirection },
    setKeywordDraft,
    update,
  };
}

function readNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

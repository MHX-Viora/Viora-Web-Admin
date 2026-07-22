import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getAdminReports } from '../services/admin-report.service';

export function useReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readNumber(searchParams.get('page'), 1);
  const pageSize = readNumber(searchParams.get('pageSize'), 20);
  const status = searchParams.get('status') ?? '';
  const targetType = searchParams.get('targetType') ?? '';
  const reason = searchParams.get('reason') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortDirection = searchParams.get('sortDirection') ?? 'desc';

  const params = useMemo(
    () => ({ page, pageSize, status: status || undefined, targetType: targetType || undefined, reason: reason || undefined, sortBy, sortDirection }),
    [page, pageSize, status, targetType, reason, sortBy, sortDirection],
  );
  const query = useQuery({ queryKey: ['admin-reports', params], queryFn: () => getAdminReports(params) });

  function update(next: Record<string, string | number | undefined>) {
    const merged = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '') merged.delete(key);
      else merged.set(key, String(value));
    });
    setSearchParams(merged, { replace: true });
  }

  return { query, state: { page, pageSize, status, targetType, reason, sortBy, sortDirection }, update };
}

function readNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

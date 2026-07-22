import { useMemo, useState } from 'react';
import type { ListParams } from '../types/admin';

export function useListState(defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');

  const params = useMemo<ListParams>(
    () => ({ page, pageSize, search: search || undefined, status: status || undefined, sort: sort || undefined }),
    [page, pageSize, search, status, sort],
  );

  return { params, page, pageSize, search, status, sort, setPage, setPageSize, setSearch, setStatus, setSort };
}

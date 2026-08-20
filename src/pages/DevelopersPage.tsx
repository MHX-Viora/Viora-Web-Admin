import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatusBadge, type Column } from '../components/common';
import { getDevelopers, transitionDeveloper } from '../services/admin-mini-app.service';
import { getErrorMessage } from '../services/http';
import type { Developer, DeveloperStatus } from '../types/mini-app';

export function DevelopersPage() {
  const client = useQueryClient(); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [status, setStatus] = useState<DeveloperStatus | ''>(''); const [pending, setPending] = useState<{ item: Developer; action: 'approve' | 'suspend' | 'reject' }>();
  const query = useQuery({ queryKey: ['developers', page, search, status], queryFn: () => getDevelopers({ page, pageSize: 20, search: search || undefined, status: status || undefined }) });
  const mutation = useMutation({ mutationFn: () => transitionDeveloper(pending!.item.id, pending!.action), onSuccess: async () => { toast.success('Đã cập nhật Developer'); setPending(undefined); await client.invalidateQueries({ queryKey: ['developers'] }); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const columns: Column<Developer>[] = [
    { key: 'name', title: 'Developer', render: (item) => <div><strong>{item.name}</strong><small className="table-subtitle">{item.companyName || item.email}</small></div> },
    { key: 'website', title: 'Website', render: (item) => item.website || '—' }, { key: 'count', title: 'Mini Apps', render: (item) => item.miniAppCount }, { key: 'status', title: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'actions', title: 'Thao tác', render: (item) => <div className="inline-actions">{item.status !== 'Active' ? <button className="btn" onClick={(event) => { event.stopPropagation(); setPending({ item, action: 'approve' }); }} type="button">Duyệt</button> : <button className="btn danger" onClick={(event) => { event.stopPropagation(); setPending({ item, action: 'suspend' }); }} type="button">Tạm ngừng</button>}</div> },
  ];
  return <section><PageHeader eyebrow="Đối tác" title="Developers" description="Quản lý đơn vị sở hữu Mini App và trạng thái truy cập nền tảng." /><div className="toolbar mini-toolbar"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Tên, công ty hoặc email" /><select value={status} onChange={(event) => setStatus(event.target.value as DeveloperStatus | '')}><option value="">Tất cả trạng thái</option>{['Pending', 'Active', 'Suspended', 'Rejected'].map((value) => <option key={value}>{value}</option>)}</select></div>{query.isLoading ? <Loading /> : null}{query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}{query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={page} pageSize={20} total={query.data.total} onPageChange={setPage} onPageSizeChange={() => undefined} /></> : null}{pending ? <ConfirmDialog title={`${pending.action === 'approve' ? 'Duyệt' : 'Tạm ngừng'} Developer`} description={`${pending.item.name} và quyền launch Mini App sẽ được cập nhật ngay.`} loading={mutation.isPending} onCancel={() => setPending(undefined)} onConfirm={() => mutation.mutate()} /> : null}</section>;
}

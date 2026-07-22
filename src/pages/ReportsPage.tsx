import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatusBadge, type Column } from '../components/common';
import { useListState } from '../hooks/useListState';
import { getErrorMessage } from '../services/http';
import { getReports, reviewReport } from '../services/admin-report.service';
import type { Report } from '../types/admin';
import { formatDate } from '../utils/format';

export function ReportsPage() {
  const list = useListState();
  const [selected, setSelected] = useState<Report | null>(null);
  const [action, setAction] = useState('hide_post');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['reports', list.params], queryFn: () => getReports(list.params) });
  const mutation = useMutation({
    mutationFn: ({ status }: { status: 'approved' | 'rejected' }) => reviewReport(selected?.id ?? '', { status, action: status === 'approved' ? action : undefined }),
    onSuccess: () => {
      toast.success('Da xu ly bao cao');
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const columns: Column<Report>[] = [
    { key: 'reporter', title: 'Nguoi bao cao', render: (item) => item.reporterName },
    { key: 'target', title: 'Doi tuong', render: (item) => `${item.targetType}: ${item.targetLabel}` },
    { key: 'reason', title: 'Ly do', render: (item) => item.reason },
    { key: 'date', title: 'Ngay', render: (item) => formatDate(item.createdAt) },
    { key: 'status', title: 'Trang thai', render: (item) => <StatusBadge status={item.status} /> },
  ];
  return (
    <section>
      <PageHeader title="Bao cao" description="Xem chi tiet va quyet dinh huong xu ly bao cao." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} onRowClick={setSelected} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {selected ? (
        <aside className="drawer">
          <button className="drawer-close" onClick={() => setSelected(null)} type="button">Dong</button>
          <h2>{selected.targetLabel}</h2>
          <p>{selected.reason}</p>
          <div className="preview-box">{selected.content?.content ?? selected.user?.email ?? 'Khong co preview'}</div>
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="hide_post">An bai</option><option value="delete_post">Xoa bai</option><option value="lock_user">Khoa user</option><option value="delete_comment">Xoa binh luan</option><option value="none">Khong xu ly</option>
          </select>
          <div className="action-grid"><button className="btn primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ status: 'approved' })} type="button">Duyet</button><button className="btn" disabled={mutation.isPending} onClick={() => mutation.mutate({ status: 'rejected' })} type="button">Tu choi</button></div>
        </aside>
      ) : null}
    </section>
  );
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatusBadge, type Column } from '../components/common';
import { useListState } from '../hooks/useListState';
import { getErrorMessage } from '../services/http';
import { getReports, reviewReport } from '../services/admin-report.service';
import type { Report } from '../types/admin';
import { formatDate } from '../utils/format';

const targetTypeLabels: Record<string, string> = {
  post: 'Bài viết',
  video: 'Video',
  comment: 'Bình luận',
  user: 'Người dùng',
};

export function ReportsPage() {
  const list = useListState();
  const [selected, setSelected] = useState<Report | null>(null);
  const [action, setAction] = useState('hide_post');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['reports', list.params], queryFn: () => getReports(list.params) });
  const mutation = useMutation({
    mutationFn: ({ status }: { status: 'approved' | 'rejected' }) => reviewReport(selected?.id ?? '', { status, action: status === 'approved' ? action : undefined }),
    onSuccess: () => {
      toast.success('Đã xử lý báo cáo');
      setSelected(null);
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const columns: Column<Report>[] = [
    { key: 'reporter', title: 'Người báo cáo', render: (item) => item.reporterName },
    { key: 'target', title: 'Đối tượng', render: (item) => `${targetTypeLabels[item.targetType] ?? item.targetType}: ${item.targetLabel}` },
    { key: 'reason', title: 'Lý do', render: (item) => item.reason },
    { key: 'date', title: 'Ngày', render: (item) => formatDate(item.createdAt) },
    { key: 'status', title: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
  ];
  return (
    <section>
      <PageHeader title="Báo cáo" description="Xem chi tiết và quyết định hướng xử lý báo cáo." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} onRowClick={setSelected} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {selected ? (
        <aside className="drawer">
          <button className="drawer-close" onClick={() => setSelected(null)} type="button">Đóng</button>
          <h2>{selected.targetLabel}</h2>
          <p>{selected.reason}</p>
          <div className="preview-box">{selected.content?.content ?? selected.user?.email ?? 'Không có bản xem trước'}</div>
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="hide_post">Ẩn bài</option><option value="delete_post">Xóa bài</option><option value="lock_user">Khóa người dùng</option><option value="delete_comment">Xóa bình luận</option><option value="none">Không xử lý</option>
          </select>
          <div className="action-grid"><button className="btn primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ status: 'approved' })} type="button">Duyệt</button><button className="btn" disabled={mutation.isPending} onClick={() => mutation.mutate({ status: 'rejected' })} type="button">Từ chối</button></div>
        </aside>
      ) : null}
    </section>
  );
}

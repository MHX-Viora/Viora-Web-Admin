import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatusBadge, getStatusLabel, type Column } from '../components/common';
import { useListState } from '../hooks/useListState';
import { getErrorMessage } from '../services/http';
import { getIdentities, reviewIdentity } from '../services/admin-identity.service';
import type { Identity } from '../types/admin';
import { formatDate } from '../utils/format';

export function IdentitiesPage() {
  const list = useListState();
  const [selected, setSelected] = useState<Identity | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['identities', list.params], queryFn: () => getIdentities(list.params) });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => reviewIdentity(id, { status, reason: status === 'rejected' ? reason : undefined }),
    onSuccess: () => {
      toast.success('Đã cập nhật xác thực');
      setSelected(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['identities'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const columns: Column<Identity>[] = [
    { key: 'image', title: 'Ảnh CCCD', render: (item) => item.frontImageUrl ? <img className="thumb" src={item.frontImageUrl} alt="CCCD mặt trước" /> : '-' },
    { key: 'name', title: 'Tên', render: (item) => item.userName },
    { key: 'number', title: 'CCCD', render: (item) => item.identityNumber },
    { key: 'date', title: 'Ngày gửi', render: (item) => formatDate(item.submittedAt) },
    { key: 'status', title: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
  ];
  return (
    <section>
      <PageHeader title="Xác thực danh tính" description="Duyệt hồ sơ CCCD đang chờ xử lý." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} onRowClick={setSelected} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {selected ? (
        <aside className="drawer">
          <button className="drawer-close" onClick={() => setSelected(null)} type="button">Đóng</button>
          <h2>{selected.userName}</h2>
          <div className="document-grid">
            <img src={selected.frontImageUrl} alt="CCCD mặt trước" />
            <img src={selected.backImageUrl} alt="CCCD mặt sau" />
          </div>
          <div className="detail-grid"><span>CCCD</span><strong>{selected.identityNumber}</strong><span>Ngày gửi</span><strong>{formatDate(selected.submittedAt)}</strong><span>Trạng thái</span><strong>{getStatusLabel(selected.status)}</strong></div>
          <textarea placeholder="Lý do từ chối" value={reason} onChange={(event) => setReason(event.target.value)} />
          <div className="action-grid">
            <button className="btn primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, status: 'approved' })} type="button">Duyệt</button>
            <button className="btn danger" disabled={mutation.isPending || !reason.trim()} onClick={() => mutation.mutate({ id: selected.id, status: 'rejected' })} type="button">Từ chối</button>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

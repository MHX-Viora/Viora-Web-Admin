import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, Lock, Unlock, XCircle } from 'lucide-react';
import { DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatusBadge, UserAvatar, type Column } from '../components/common';
import { getErrorMessage } from '../services/http';
import { getUsers, updateUserStatus } from '../services/admin-user.service';
import type { User } from '../types/admin';
import { formatDate, formatNumber } from '../utils/format';
import { useListState } from '../hooks/useListState';

export function UsersPage() {
  const list = useListState();
  const [selected, setSelected] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['users', list.params], queryFn: () => getUsers(list.params) });
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'lock' | 'unlock' | 'verify' | 'unverify' }) => updateUserStatus(id, action),
    onSuccess: (user) => {
      toast.success('Cap nhat nguoi dung thanh cong');
      setSelected(user);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: Column<User>[] = [
    { key: 'avatar', title: 'Avatar', render: (user) => <UserAvatar src={user.avatarUrl} name={user.name} /> },
    { key: 'name', title: 'Ten', render: (user) => user.name },
    { key: 'email', title: 'Email', render: (user) => user.email },
    { key: 'phone', title: 'So dien thoai', render: (user) => user.phone ?? '-' },
    { key: 'status', title: 'Trang thai', render: (user) => <StatusBadge status={user.status} /> },
    { key: 'verified', title: 'Tick xanh', render: (user) => user.verified ? 'Co' : 'Khong' },
    { key: 'posts', title: 'So bai viet', render: (user) => formatNumber(user.postCount) },
    { key: 'created', title: 'Ngay tao', render: (user) => formatDate(user.createdAt) },
    { key: 'actions', title: 'Thao tac', render: (user) => <button className="btn" type="button" onClick={(event) => { event.stopPropagation(); setSelected(user); }}>Chi tiet</button> },
  ];

  return (
    <section>
      <PageHeader title="Nguoi dung" description="Tim kiem, loc va quan tri tai khoan Viora." />
      <div className="toolbar">
        <SearchBox value={list.search} onChange={(value) => { list.setPage(1); list.setSearch(value); }} />
        <select value={list.status} onChange={(event) => { list.setPage(1); list.setStatus(event.target.value); }}>
          <option value="">Tat ca trang thai</option>
          <option value="active">Active</option>
          <option value="locked">Locked</option>
        </select>
        <select value={list.sort} onChange={(event) => list.setSort(event.target.value)}>
          <option value="">Sap xep mac dinh</option>
          <option value="createdAt:desc">Moi nhat</option>
          <option value="postCount:desc">Nhieu bai viet</option>
        </select>
      </div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <DataTable columns={columns} items={query.data.items} onRowClick={setSelected} />
          <Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} />
        </>
      ) : null}
      {selected ? (
        <aside className="drawer">
          <button className="drawer-close" onClick={() => setSelected(null)} type="button">Dong</button>
          <div className="cover" style={{ backgroundImage: selected.coverUrl ? `url(${selected.coverUrl})` : undefined }} />
          <UserAvatar src={selected.avatarUrl} name={selected.name} size="lg" />
          <h2>{selected.name}</h2>
          <div className="detail-grid">
            <span>Email</span><strong>{selected.email}</strong>
            <span>Phone</span><strong>{selected.phone ?? '-'}</strong>
            <span>Ngay tham gia</span><strong>{formatDate(selected.createdAt)}</strong>
            <span>Lan dang nhap cuoi</span><strong>{formatDate(selected.lastLoginAt)}</strong>
            <span>Tick xanh</span><strong>{selected.verified ? 'Co' : 'Khong'}</strong>
            <span>CCCD</span><strong>{selected.identityNumber ?? '-'}</strong>
            <span>Bai viet</span><strong>{formatNumber(selected.postCount)}</strong>
            <span>Video</span><strong>{formatNumber(selected.videoCount)}</strong>
            <span>Follower</span><strong>{formatNumber(selected.followerCount)}</strong>
            <span>Following</span><strong>{formatNumber(selected.followingCount)}</strong>
            <span>Ban be</span><strong>{formatNumber(selected.friendCount)}</strong>
          </div>
          <div className="action-grid">
            <button className="btn danger" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'lock' })} type="button"><Lock size={16} />Khoa tai khoan</button>
            <button className="btn" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'unlock' })} type="button"><Unlock size={16} />Mo khoa</button>
            <button className="btn primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'verify' })} type="button"><CheckCircle size={16} />Cap Tick xanh</button>
            <button className="btn" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'unverify' })} type="button"><XCircle size={16} />Thu hoi Tick xanh</button>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

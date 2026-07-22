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
      toast.success('Cập nhật người dùng thành công');
      setSelected(user);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const columns: Column<User>[] = [
    { key: 'avatar', title: 'Avatar', render: (user) => <UserAvatar src={user.avatarUrl} name={user.name} /> },
    { key: 'name', title: 'Tên', render: (user) => user.name },
    { key: 'email', title: 'Email', render: (user) => user.email },
    { key: 'phone', title: 'Số điện thoại', render: (user) => user.phone ?? '-' },
    { key: 'status', title: 'Trạng thái', render: (user) => <StatusBadge status={user.status} /> },
    { key: 'verified', title: 'Tick xanh', render: (user) => user.verified ? 'Có' : 'Không' },
    { key: 'posts', title: 'Số bài viết', render: (user) => formatNumber(user.postCount) },
    { key: 'created', title: 'Ngày tạo', render: (user) => formatDate(user.createdAt) },
    { key: 'actions', title: 'Thao tác', render: (user) => <button className="btn" type="button" onClick={(event) => { event.stopPropagation(); setSelected(user); }}>Chi tiết</button> },
  ];

  return (
    <section>
      <PageHeader title="Người dùng" description="Tìm kiếm, lọc và quản trị tài khoản Viora." />
      <div className="toolbar">
        <SearchBox value={list.search} onChange={(value) => { list.setPage(1); list.setSearch(value); }} />
        <select value={list.status} onChange={(event) => { list.setPage(1); list.setStatus(event.target.value); }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Đã khóa</option>
        </select>
        <select value={list.sort} onChange={(event) => list.setSort(event.target.value)}>
          <option value="">Sắp xếp mặc định</option>
          <option value="createdAt:desc">Mới nhất</option>
          <option value="postCount:desc">Nhiều bài viết</option>
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
          <button className="drawer-close" onClick={() => setSelected(null)} type="button">Đóng</button>
          <div className="cover" style={{ backgroundImage: selected.coverUrl ? `url(${selected.coverUrl})` : undefined }} />
          <UserAvatar src={selected.avatarUrl} name={selected.name} size="lg" />
          <h2>{selected.name}</h2>
          <div className="detail-grid">
            <span>Email</span><strong>{selected.email}</strong>
            <span>Số điện thoại</span><strong>{selected.phone ?? '-'}</strong>
            <span>Ngày tham gia</span><strong>{formatDate(selected.createdAt)}</strong>
            <span>Lần đăng nhập cuối</span><strong>{formatDate(selected.lastLoginAt)}</strong>
            <span>Tick xanh</span><strong>{selected.verified ? 'Có' : 'Không'}</strong>
            <span>CCCD</span><strong>{selected.identityNumber ?? '-'}</strong>
            <span>Bài viết</span><strong>{formatNumber(selected.postCount)}</strong>
            <span>Video</span><strong>{formatNumber(selected.videoCount)}</strong>
            <span>Người theo dõi</span><strong>{formatNumber(selected.followerCount)}</strong>
            <span>Đang theo dõi</span><strong>{formatNumber(selected.followingCount)}</strong>
            <span>Bạn bè</span><strong>{formatNumber(selected.friendCount)}</strong>
          </div>
          <div className="action-grid">
            <button className="btn danger" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'lock' })} type="button"><Lock size={16} />Khóa tài khoản</button>
            <button className="btn" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'unlock' })} type="button"><Unlock size={16} />Mở khóa</button>
            <button className="btn primary" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'verify' })} type="button"><CheckCircle size={16} />Cấp tick xanh</button>
            <button className="btn" disabled={mutation.isPending} onClick={() => mutation.mutate({ id: selected.id, action: 'unverify' })} type="button"><XCircle size={16} />Thu hồi tick xanh</button>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

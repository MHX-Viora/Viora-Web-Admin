import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, type Column } from '../components/common';
import { useListState } from '../hooks/useListState';
import { deleteHashtag, getAdminLogs, getChatRoom, getChatRooms, getHashtags, renameHashtag, sendSystemNotification } from '../services/admin-meta.service';
import { getErrorMessage } from '../services/http';
import type { AdminLog, ChatRoom, Hashtag, NotificationPayload } from '../types/admin';
import { formatDate, formatNumber } from '../utils/format';

const chatTypeLabels: Record<string, string> = {
  direct: 'Trực tiếp',
  group: 'Nhóm',
};

export function HashtagsPage() {
  const list = useListState();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['hashtags', list.params], queryFn: () => getHashtags(list.params) });
  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameHashtag(id, name),
    onSuccess: () => {
      toast.success('Đã đổi tên hashtag');
      void queryClient.invalidateQueries({ queryKey: ['hashtags'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteHashtag(id),
    onSuccess: () => {
      toast.success('Đã xóa hashtag');
      setDeleteId(null);
      void queryClient.invalidateQueries({ queryKey: ['hashtags'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const columns: Column<Hashtag>[] = [
    { key: 'name', title: 'Tên', render: (item) => item.name },
    { key: 'posts', title: 'Số bài viết', render: (item) => formatNumber(item.postCount) },
    { key: 'created', title: 'Ngày tạo', render: (item) => formatDate(item.createdAt) },
    {
      key: 'actions',
      title: 'Thao tác',
      render: (item) => (
        <div className="row-actions">
          <button className="btn" onClick={() => { const name = window.prompt('Tên mới', item.name); if (name?.trim()) rename.mutate({ id: item.id, name: name.trim() }); }} type="button">Đổi tên</button>
          <button className="btn danger" onClick={() => setDeleteId(item.id)} type="button">Xóa</button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <PageHeader title="Hashtag" description="Quản lý hashtag và số bài viết liên quan." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {deleteId ? <ConfirmDialog title="Xóa hashtag" description="Thao tác này cần xác nhận trước khi tiếp tục." loading={remove.isPending} onCancel={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} /> : null}
    </section>
  );
}

export function ChatRoomsPage() {
  const list = useListState();
  const [selected, setSelected] = useState<ChatRoom | null>(null);
  const query = useQuery({ queryKey: ['chat-rooms', list.params], queryFn: () => getChatRooms(list.params) });
  const detailQuery = useQuery({ queryKey: ['chat-room', selected?.id], queryFn: () => getChatRoom(selected?.id ?? ''), enabled: Boolean(selected?.id) });
  const detail = detailQuery.data ?? selected;
  const columns: Column<ChatRoom>[] = [
    { key: 'name', title: 'Tên', render: (item) => item.name },
    { key: 'type', title: 'Loại', render: (item) => chatTypeLabels[item.type] ?? item.type },
    { key: 'members', title: 'Thành viên', render: (item) => formatNumber(item.memberCount) },
    { key: 'last', title: 'Tin nhắn cuối', render: (item) => item.lastMessage ? formatDate(item.lastMessage) : '-' },
    { key: 'created', title: 'Ngày tạo', render: (item) => formatDate(item.createdAt) },
  ];

  return (
    <section>
      <PageHeader title="Phòng chat" description="Xem thông tin phòng, thành viên và tin nhắn gần nhất." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} onRowClick={setSelected} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {detail ? (
        <aside className="drawer">
          <button className="drawer-close" onClick={() => setSelected(null)} type="button">Đóng</button>
          <h2>{detail.name}</h2>
          {detailQuery.isLoading ? <Loading rows={3} /> : null}
          {detailQuery.isError ? <ErrorView message={getErrorMessage(detailQuery.error)} onRetry={() => void detailQuery.refetch()} /> : null}
          <div className="detail-grid">
            <span>Loại</span><strong>{chatTypeLabels[detail.type] ?? detail.type}</strong>
            <span>Thành viên</span><strong>{formatNumber(detail.memberCount)}</strong>
            <span>Ngày tạo</span><strong>{formatDate(detail.createdAt)}</strong>
          </div>
          <h3>Thành viên</h3>
          <div className="message-list">{detail.members?.length ? detail.members.map((member) => <p key={member.id}><strong>{member.name}</strong></p>) : 'Chưa có thành viên'}</div>
          <h3>50 tin nhắn gần nhất</h3>
          <div className="message-list">{detail.messages?.length ? detail.messages.slice(0, 50).map((msg) => <p key={msg.id}><strong>{msg.senderName}</strong>: {msg.content}</p>) : 'Chưa có tin nhắn'}</div>
        </aside>
      ) : null}
    </section>
  );
}

export function NotificationsPage() {
  const [payload, setPayload] = useState<NotificationPayload>({ title: '', content: '', imageUrl: '', sendTo: 'all' });
  const mutation = useMutation({ mutationFn: sendSystemNotification, onSuccess: () => toast.success('Đã gửi thông báo'), onError: (error) => toast.error(getErrorMessage(error)) });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!payload.title.trim() || !payload.content.trim()) return;
    if (window.confirm('Gửi thông báo hệ thống?')) mutation.mutate({ ...payload, title: payload.title.trim(), content: payload.content.trim(), imageUrl: payload.imageUrl?.trim() || undefined });
  }

  return (
    <section>
      <PageHeader title="Thông báo hệ thống" description="Soạn nội dung, xem trước và gửi theo nhóm người dùng." />
      <form className="form-grid" onSubmit={submit}>
        <label>Tiêu đề<input value={payload.title} onChange={(event) => setPayload({ ...payload, title: event.target.value })} required /></label>
        <label>Nội dung<textarea value={payload.content} onChange={(event) => setPayload({ ...payload, content: event.target.value })} required /></label>
        <label>Ảnh<input value={payload.imageUrl} onChange={(event) => setPayload({ ...payload, imageUrl: event.target.value })} /></label>
        <label>Gửi đến<select value={payload.sendTo} onChange={(event) => setPayload({ ...payload, sendTo: event.target.value as NotificationPayload['sendTo'] })}><option value="all">Tất cả</option><option value="verified">Đã xác thực</option><option value="unverified">Chưa xác thực</option></select></label>
        <div className="preview-box"><strong>{payload.title || 'Tiêu đề xem trước'}</strong><p>{payload.content || 'Nội dung xem trước'}</p>{payload.imageUrl ? <img src={payload.imageUrl} alt="Bản xem trước" /> : null}</div>
        <button className="btn primary" disabled={mutation.isPending} type="submit">Gửi thông báo</button>
      </form>
    </section>
  );
}

export function AdminLogsPage() {
  const list = useListState();
  const query = useQuery({ queryKey: ['admin-logs', list.params], queryFn: () => getAdminLogs(list.params) });
  const columns: Column<AdminLog>[] = [
    { key: 'admin', title: 'Admin', render: (item) => item.adminName || '-' },
    { key: 'action', title: 'Hành động', render: (item) => item.action },
    { key: 'target', title: 'Đối tượng', render: (item) => item.target },
    { key: 'description', title: 'Mô tả', render: (item) => item.description },
    { key: 'created', title: 'Thời gian tạo', render: (item) => formatDate(item.createdAt) },
  ];

  return (
    <section>
      <PageHeader title="Nhật ký quản trị" description="Theo dõi thao tác quản trị trong hệ thống." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
    </section>
  );
}

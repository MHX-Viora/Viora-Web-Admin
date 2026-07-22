import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, type Column } from '../components/common';
import { useListState } from '../hooks/useListState';
import { deleteHashtag, getAdminLogs, getChatRooms, getHashtags, renameHashtag, sendSystemNotification } from '../services/admin-meta.service';
import { getErrorMessage } from '../services/http';
import type { AdminLog, ChatRoom, Hashtag, NotificationPayload } from '../types/admin';
import { formatDate, formatNumber } from '../utils/format';

export function HashtagsPage() {
  const list = useListState();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['hashtags', list.params], queryFn: () => getHashtags(list.params) });
  const rename = useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => renameHashtag(id, name), onSuccess: () => { toast.success('Da doi ten hashtag'); void queryClient.invalidateQueries({ queryKey: ['hashtags'] }); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const remove = useMutation({ mutationFn: (id: string) => deleteHashtag(id), onSuccess: () => { toast.success('Da xoa hashtag'); setDeleteId(null); void queryClient.invalidateQueries({ queryKey: ['hashtags'] }); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const columns: Column<Hashtag>[] = [
    { key: 'name', title: 'Ten', render: (item) => item.name },
    { key: 'posts', title: 'So bai viet', render: (item) => formatNumber(item.postCount) },
    { key: 'created', title: 'Ngay tao', render: (item) => formatDate(item.createdAt) },
    { key: 'actions', title: 'Thao tac', render: (item) => <div className="row-actions"><button className="btn" onClick={() => { const name = window.prompt('Ten moi', item.name); if (name) rename.mutate({ id: item.id, name }); }} type="button">Doi ten</button><button className="btn danger" onClick={() => setDeleteId(item.id)} type="button">Xoa</button></div> },
  ];
  return <section><PageHeader title="Hashtag" description="Quan ly hashtag va so bai viet lien quan." /><div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>{query.isLoading ? <Loading /> : null}{query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}{query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}{deleteId ? <ConfirmDialog title="Xoa hashtag" description="Thao tac nay can xac nhan truoc khi tiep tuc." loading={remove.isPending} onCancel={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} /> : null}</section>;
}

export function ChatRoomsPage() {
  const list = useListState();
  const [selected, setSelected] = useState<ChatRoom | null>(null);
  const query = useQuery({ queryKey: ['chat-rooms', list.params], queryFn: () => getChatRooms(list.params) });
  const columns: Column<ChatRoom>[] = [
    { key: 'name', title: 'Ten', render: (item) => item.name },
    { key: 'type', title: 'Loai', render: (item) => item.type },
    { key: 'members', title: 'So thanh vien', render: (item) => formatNumber(item.memberCount) },
    { key: 'last', title: 'Tin nhan cuoi', render: (item) => item.lastMessage ?? '-' },
    { key: 'created', title: 'Ngay tao', render: (item) => formatDate(item.createdAt) },
  ];
  return <section><PageHeader title="Phong chat" description="Xem thong tin phong, thanh vien va 50 tin nhan gan nhat." /><div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>{query.isLoading ? <Loading /> : null}{query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}{query.data ? <><DataTable columns={columns} items={query.data.items} onRowClick={setSelected} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}{selected ? <aside className="drawer"><button className="drawer-close" onClick={() => setSelected(null)} type="button">Dong</button><h2>{selected.name}</h2><div className="detail-grid"><span>Loai</span><strong>{selected.type}</strong><span>Thanh vien</span><strong>{formatNumber(selected.memberCount)}</strong><span>Ngay tao</span><strong>{formatDate(selected.createdAt)}</strong></div><h3>50 tin nhan gan nhat</h3><div className="message-list">{selected.messages?.slice(0, 50).map((msg) => <p key={msg.id}><strong>{msg.senderName}</strong>: {msg.content}</p>) ?? 'Chua co tin nhan'}</div></aside> : null}</section>;
}

export function NotificationsPage() {
  const [payload, setPayload] = useState<NotificationPayload>({ title: '', content: '', imageUrl: '', sendTo: 'all' });
  const mutation = useMutation({ mutationFn: sendSystemNotification, onSuccess: () => toast.success('Da gui thong bao'), onError: (error) => toast.error(getErrorMessage(error)) });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (window.confirm('Gui thong bao he thong?')) mutation.mutate(payload);
  }
  return <section><PageHeader title="Thong bao he thong" description="Soan noi dung, xem preview va gui theo nhom nguoi dung." /><form className="form-grid" onSubmit={submit}><label>Title<input value={payload.title} onChange={(event) => setPayload({ ...payload, title: event.target.value })} required /></label><label>Content<textarea value={payload.content} onChange={(event) => setPayload({ ...payload, content: event.target.value })} required /></label><label>Image<input value={payload.imageUrl} onChange={(event) => setPayload({ ...payload, imageUrl: event.target.value })} /></label><label>Send To<select value={payload.sendTo} onChange={(event) => setPayload({ ...payload, sendTo: event.target.value as NotificationPayload['sendTo'] })}><option value="all">All</option><option value="verified">Verified</option><option value="unverified">Unverified</option></select></label><div className="preview-box"><strong>{payload.title || 'Preview title'}</strong><p>{payload.content || 'Preview content'}</p>{payload.imageUrl ? <img src={payload.imageUrl} alt="Preview" /> : null}</div><button className="btn primary" disabled={mutation.isPending} type="submit">Gui thong bao</button></form></section>;
}

export function AdminLogsPage() {
  const list = useListState();
  const query = useQuery({ queryKey: ['admin-logs', list.params], queryFn: () => getAdminLogs(list.params) });
  const columns: Column<AdminLog>[] = [
    { key: 'admin', title: 'Admin', render: (item) => item.adminName },
    { key: 'action', title: 'Action', render: (item) => item.action },
    { key: 'target', title: 'Target', render: (item) => item.target },
    { key: 'description', title: 'Description', render: (item) => item.description },
    { key: 'created', title: 'CreatedAt', render: (item) => formatDate(item.createdAt) },
  ];
  return <section><PageHeader title="Nhat ky Admin" description="Theo doi thao tac quan tri trong he thong." /><div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /></div>{query.isLoading ? <Loading /> : null}{query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}{query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}</section>;
}

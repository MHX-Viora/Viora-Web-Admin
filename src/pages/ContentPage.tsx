import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatusBadge, type Column } from '../components/common';
import { useListState } from '../hooks/useListState';
import { getErrorMessage } from '../services/http';
import { getPosts, getVideos, moderateContent } from '../services/admin-content.service';
import type { ContentItem } from '../types/admin';
import { formatDate, formatNumber } from '../utils/format';

export function ContentPage({ type }: { type: 'posts' | 'videos' }) {
  const list = useListState();
  const [pending, setPending] = useState<{ id: string; action: 'hide' | 'restore' | 'delete' } | null>(null);
  const queryClient = useQueryClient();
  const title = type === 'posts' ? 'Bai viet' : 'Video ngan';
  const query = useQuery({ queryKey: [type, list.params], queryFn: () => type === 'posts' ? getPosts(list.params) : getVideos(list.params) });
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'hide' | 'restore' | 'delete' }) => moderateContent(type, id, action),
    onSuccess: () => {
      toast.success('Da cap nhat noi dung');
      setPending(null);
      void queryClient.invalidateQueries({ queryKey: [type] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const columns: Column<ContentItem>[] = [
    { key: 'image', title: type === 'posts' ? 'Anh' : 'Thumbnail', render: (item) => (item.imageUrl ?? item.thumbnailUrl) ? <img className="thumb" src={item.imageUrl ?? item.thumbnailUrl} alt="" /> : '-' },
    { key: 'author', title: 'Nguoi dang', render: (item) => item.authorName },
    { key: 'content', title: 'Noi dung', render: (item) => <span className="line-clamp">{item.content}</span> },
    { key: 'reactions', title: 'Reaction', render: (item) => formatNumber(item.reactions) },
    { key: 'comments', title: 'Comment', render: (item) => formatNumber(item.comments) },
    { key: 'shares', title: 'Share', render: (item) => formatNumber(item.shares) },
    { key: 'reports', title: 'Report', render: (item) => formatNumber(item.reports) },
    { key: 'created', title: 'Ngay dang', render: (item) => formatDate(item.createdAt) },
    { key: 'status', title: 'Trang thai', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'actions', title: 'Thao tac', render: (item) => <div className="row-actions"><button className="btn" onClick={() => setPending({ id: item.id, action: 'hide' })} type="button">Hide</button><button className="btn" onClick={() => setPending({ id: item.id, action: 'restore' })} type="button">Restore</button><button className="btn danger" onClick={() => setPending({ id: item.id, action: 'delete' })} type="button">Delete</button></div> },
  ];
  return (
    <section>
      <PageHeader title={title} description="Loc, tim kiem va kiem duyet noi dung." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /><select value={list.status} onChange={(event) => list.setStatus(event.target.value)}><option value="">Tat ca</option><option value="active">Active</option><option value="hidden">Hidden</option><option value="deleted">Deleted</option></select></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {pending ? <ConfirmDialog title="Xac nhan thao tac" description={`Ban muon ${pending.action} noi dung nay?`} confirmText="Dong y" loading={mutation.isPending} onCancel={() => setPending(null)} onConfirm={() => mutation.mutate(pending)} /> : null}
    </section>
  );
}

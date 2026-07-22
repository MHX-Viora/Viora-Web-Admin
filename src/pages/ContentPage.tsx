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
  const title = type === 'posts' ? 'Bài viết' : 'Video ngắn';
  const actionLabels = { hide: 'ẩn', restore: 'khôi phục', delete: 'xóa' };
  const query = useQuery({ queryKey: [type, list.params], queryFn: () => type === 'posts' ? getPosts(list.params) : getVideos(list.params) });
  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'hide' | 'restore' | 'delete' }) => moderateContent(type, id, action),
    onSuccess: () => {
      toast.success('Đã cập nhật nội dung');
      setPending(null);
      void queryClient.invalidateQueries({ queryKey: [type] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const columns: Column<ContentItem>[] = [
    { key: 'image', title: type === 'posts' ? 'Ảnh' : 'Ảnh thu nhỏ', render: (item) => (item.imageUrl ?? item.thumbnailUrl) ? <img className="thumb" src={item.imageUrl ?? item.thumbnailUrl} alt="" /> : '-' },
    { key: 'author', title: 'Người đăng', render: (item) => item.authorName },
    { key: 'content', title: 'Nội dung', render: (item) => <span className="line-clamp">{item.content}</span> },
    { key: 'reactions', title: 'Tương tác', render: (item) => formatNumber(item.reactions) },
    { key: 'comments', title: 'Bình luận', render: (item) => formatNumber(item.comments) },
    { key: 'shares', title: 'Chia sẻ', render: (item) => formatNumber(item.shares) },
    { key: 'reports', title: 'Báo cáo', render: (item) => formatNumber(item.reports) },
    { key: 'created', title: 'Ngày đăng', render: (item) => formatDate(item.createdAt) },
    { key: 'status', title: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
    { key: 'actions', title: 'Thao tác', render: (item) => <div className="row-actions"><button className="btn" onClick={() => setPending({ id: item.id, action: 'hide' })} type="button">Ẩn</button><button className="btn" onClick={() => setPending({ id: item.id, action: 'restore' })} type="button">Khôi phục</button><button className="btn danger" onClick={() => setPending({ id: item.id, action: 'delete' })} type="button">Xóa</button></div> },
  ];
  return (
    <section>
      <PageHeader title={title} description="Lọc, tìm kiếm và kiểm duyệt nội dung." />
      <div className="toolbar"><SearchBox value={list.search} onChange={list.setSearch} /><select value={list.status} onChange={(event) => list.setStatus(event.target.value)}><option value="">Tất cả</option><option value="active">Đang hoạt động</option><option value="hidden">Đã ẩn</option><option value="deleted">Đã xóa</option></select></div>
      {query.isLoading ? <Loading /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <><DataTable columns={columns} items={query.data.items} /><Pagination page={list.page} pageSize={list.pageSize} total={query.data.total} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} /></> : null}
      {pending ? <ConfirmDialog title="Xác nhận thao tác" description={`Bạn muốn ${actionLabels[pending.action]} nội dung này?`} confirmText="Đồng ý" loading={mutation.isPending} onCancel={() => setPending(null)} onConfirm={() => mutation.mutate(pending)} /> : null}
    </section>
  );
}

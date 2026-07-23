import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ConfirmDialog, ErrorView, PageHeader } from '../components/common';
import { PostAuthorCard } from '../components/PostDetail/PostAuthorCard';
import { PostContentCard } from '../components/PostDetail/PostContentCard';
import { PostHashtagCard } from '../components/PostDetail/PostHashtagCard';
import { PostInformationCard } from '../components/PostDetail/PostInformationCard';
import { PostMediaGallery } from '../components/PostDetail/PostMediaGallery';
import { PostPreviewModal } from '../components/PostDetail/ImagePreviewModal';
import { PostStatisticsCard } from '../components/PostDetail/PostStatisticsCard';
import { PostDetailSkeleton } from '../components/PostDetail/LoadingSkeleton';
import { usePostDetail } from '../hooks/usePostDetail';
import { getErrorMessage } from '../services/http';
import { moderateAdminPost } from '../services/admin-post.service';

type PendingAction = 'hide' | 'restore' | 'delete';

export function PostDetailPage() {
  const { id } = useParams();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const queryClient = useQueryClient();
  const query = usePostDetail(id);
  const mutation = useMutation({
    mutationFn: (action: PendingAction) => moderateAdminPost(id ?? '', action),
    onSuccess: () => {
      toast.success('Đã cập nhật bài viết');
      setPendingAction(null);
      void query.refetch();
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (query.isLoading) return <PostDetailSkeleton />;

  if (query.isError || !query.data) {
    return (
      <section>
        <PageHeader title="Bài viết không tồn tại" actions={<BackButton />} />
        <ErrorView message={query.error ? getErrorMessage(query.error) : 'Bài viết không tồn tại.'} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const post = query.data;

  return (
    <section className="post-detail-page">
      <div className="breadcrumb-row">
        <Link to="/">Bảng điều khiển</Link>
        <span>/</span>
        <Link to="/posts">Bài viết</Link>
        <span>/</span>
        <strong>Chi tiết</strong>
      </div>
      <PageHeader
        title="Chi tiết bài viết"
        description={post.displayName}
        actions={
          <div className="row-actions">
            <BackButton />
            <button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Làm mới</button>
            <button className="btn" onClick={() => setPendingAction('hide')} type="button">Ẩn</button>
            <button className="btn" onClick={() => setPendingAction('restore')} type="button">Khôi phục</button>
            <button className="btn danger" onClick={() => setPendingAction('delete')} type="button">Xóa</button>
          </div>
        }
      />
      <div className="post-detail-layout">
        <div className="post-detail-main">
          <PostAuthorCard post={post} />
          <PostContentCard post={post} />
          <PostMediaGallery post={post} onPreview={setPreviewImage} />
          <PostHashtagCard post={post} />
        </div>
        <div className="post-detail-side">
          <PostStatisticsCard post={post} />
          <PostInformationCard post={post} />
        </div>
      </div>
      <PostPreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      {pendingAction ? (
        <ConfirmDialog
          title="Xác nhận thao tác"
          description={`Bạn muốn ${getActionLabel(pendingAction)} bài viết này?`}
          confirmText="Đồng ý"
          loading={mutation.isPending}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => mutation.mutate(pendingAction)}
        />
      ) : null}
    </section>
  );
}

function BackButton() {
  return <Link className="btn" to="/posts"><ArrowLeft size={16} />Quay lại</Link>;
}

function getActionLabel(action: PendingAction) {
  return action === 'hide' ? 'ẩn' : action === 'restore' ? 'khôi phục' : 'xóa';
}

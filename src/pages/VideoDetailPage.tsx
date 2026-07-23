import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ConfirmDialog, ErrorView, PageHeader } from '../components/common';
import { VideoAuthorCard } from '../components/VideoDetail/VideoAuthorCard';
import { VideoContentCard } from '../components/VideoDetail/VideoContentCard';
import { VideoDetailSkeleton } from '../components/VideoDetail/LoadingSkeleton';
import { VideoHashtagCard } from '../components/VideoDetail/VideoHashtagCard';
import { VideoInformationCard } from '../components/VideoDetail/VideoInformationCard';
import { VideoPlayerCard } from '../components/VideoDetail/VideoPlayerCard';
import { VideoStatisticsCard } from '../components/VideoDetail/VideoStatisticsCard';
import { useVideoDetail } from '../hooks/useVideoDetail';
import { getErrorMessage } from '../services/http';
import { moderateAdminVideo } from '../services/admin-video.service';

type PendingAction = 'hide' | 'restore' | 'delete';

export function VideoDetailPage() {
  const { id } = useParams();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const queryClient = useQueryClient();
  const query = useVideoDetail(id);
  const mutation = useMutation({
    mutationFn: (action: PendingAction) => moderateAdminVideo(id ?? '', action),
    onSuccess: () => {
      toast.success('Đã cập nhật video');
      setPendingAction(null);
      void query.refetch();
      void queryClient.invalidateQueries({ queryKey: ['videos'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (query.isLoading) return <VideoDetailSkeleton />;

  if (query.isError || !query.data) {
    return (
      <section>
        <PageHeader title="Không tìm thấy video" actions={<BackButton />} />
        <ErrorView message={query.error ? getErrorMessage(query.error) : 'Không tìm thấy video.'} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const video = query.data;

  return (
    <section className="post-detail-page">
      <div className="breadcrumb-row">
        <Link to="/">Bảng điều khiển</Link>
        <span>/</span>
        <Link to="/videos">Video ngắn</Link>
        <span>/</span>
        <strong>Chi tiết</strong>
      </div>
      <PageHeader
        title="Chi tiết video ngắn"
        description={video.displayName}
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
          <VideoAuthorCard video={video} />
          <VideoPlayerCard video={video} />
          <VideoContentCard video={video} />
          <VideoHashtagCard video={video} />
        </div>
        <div className="post-detail-side">
          <VideoStatisticsCard video={video} />
          <VideoInformationCard video={video} />
        </div>
      </div>
      {pendingAction ? (
        <ConfirmDialog
          title="Xác nhận thao tác"
          description={`Bạn muốn ${getActionLabel(pendingAction)} video này?`}
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
  return <Link className="btn" to="/videos"><ArrowLeft size={16} />Quay lại</Link>;
}

function getActionLabel(action: PendingAction) {
  return action === 'hide' ? 'ẩn' : action === 'restore' ? 'khôi phục' : 'xóa';
}

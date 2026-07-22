import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ErrorView, PageHeader } from '../components/common';
import { VideoAuthorCard } from '../components/VideoDetail/VideoAuthorCard';
import { VideoContentCard } from '../components/VideoDetail/VideoContentCard';
import { VideoDetailSkeleton } from '../components/VideoDetail/LoadingSkeleton';
import { VideoHashtagCard } from '../components/VideoDetail/VideoHashtagCard';
import { VideoInformationCard } from '../components/VideoDetail/VideoInformationCard';
import { VideoPlayerCard } from '../components/VideoDetail/VideoPlayerCard';
import { VideoStatisticsCard } from '../components/VideoDetail/VideoStatisticsCard';
import { useVideoDetail } from '../hooks/useVideoDetail';
import { getErrorMessage } from '../services/http';

export function VideoDetailPage() {
  const { id } = useParams();
  const query = useVideoDetail(id);

  if (query.isLoading) return <VideoDetailSkeleton />;

  if (query.isError || !query.data) {
    return (
      <section>
        <PageHeader title="Không tìm thấy video." actions={<BackButton />} />
        <ErrorView message={query.error ? getErrorMessage(query.error) : 'Không tìm thấy video.'} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const video = query.data;

  return (
    <section className="post-detail-page">
      <div className="breadcrumb-row">
        <Link to="/">Dashboard</Link>
        <span>/</span>
        <Link to="/videos">Video ngắn</Link>
        <span>/</span>
        <strong>Chi tiết</strong>
      </div>
      <PageHeader
        title="Chi tiết Video ngắn"
        description={video.displayName}
        actions={<div className="row-actions"><BackButton /><button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Làm mới</button></div>}
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
    </section>
  );
}

function BackButton() {
  return <Link className="btn" to="/videos"><ArrowLeft size={16} />Quay lại</Link>;
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ErrorView, PageHeader } from '../components/common';
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

export function PostDetailPage() {
  const { id } = useParams();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const query = usePostDetail(id);

  if (query.isLoading) return <PostDetailSkeleton />;

  if (query.isError || !query.data) {
    return (
      <section>
        <PageHeader title="Bài viết không tồn tại." actions={<BackButton />} />
        <ErrorView message={query.error ? getErrorMessage(query.error) : 'Bài viết không tồn tại.'} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const post = query.data;

  return (
    <section className="post-detail-page">
      <div className="breadcrumb-row">
        <Link to="/">Dashboard</Link>
        <span>/</span>
        <Link to="/posts">Bài viết</Link>
        <span>/</span>
        <strong>Chi tiết</strong>
      </div>
      <PageHeader
        title="Chi tiết bài viết"
        description={post.displayName}
        actions={<div className="row-actions"><BackButton /><button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Làm mới</button></div>}
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
    </section>
  );
}

function BackButton() {
  return <Link className="btn" to="/posts"><ArrowLeft size={16} />Quay lại</Link>;
}

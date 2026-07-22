import { RefreshCw } from 'lucide-react';
import { ErrorView, PageHeader } from '../components/common';
import { VideoEmptyState } from '../components/VideoManagement/EmptyState';
import { VideoTableSkeleton } from '../components/VideoManagement/LoadingSkeleton';
import { VideoPagination } from '../components/VideoManagement/Pagination';
import { VideoSortBar } from '../components/VideoManagement/SortBar';
import { VideoTable } from '../components/VideoManagement/VideoTable';
import { VideoToolbar } from '../components/VideoManagement/VideoToolbar';
import { useVideos } from '../hooks/useVideos';
import { getErrorMessage } from '../services/http';

export function VideosPage() {
  const { query, state, setKeywordDraft, update } = useVideos();
  const total = query.data?.total ?? 0;
  const videos = query.data?.items ?? [];

  return (
    <section className="users-page">
      <PageHeader
        title="Quản lý Video ngắn"
        description={`Tổng cộng ${total} video`}
        actions={<button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Refresh</button>}
      />
      <VideoToolbar
        keywordDraft={state.keywordDraft}
        status={state.status}
        reported={state.reported}
        userId={state.userId}
        onDraftChange={setKeywordDraft}
        onSearch={(keyword) => update({ keyword, page: 1 })}
        onFilter={(key, value) => update({ [key]: value, page: 1 })}
      />
      <VideoSortBar sortBy={state.sortBy} sortDirection={state.sortDirection} onSort={(sortBy, sortDirection) => update({ sortBy, sortDirection, page: 1 })} />

      {query.isLoading ? <VideoTableSkeleton /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && videos.length === 0 ? <VideoEmptyState /> : null}
      {query.data && videos.length > 0 ? (
        <>
          <VideoTable videos={videos} />
          <VideoPagination
            page={state.page}
            pageSize={state.pageSize}
            total={total}
            onPage={(page) => update({ page })}
            onPageSize={(pageSize) => update({ pageSize, page: 1 })}
          />
        </>
      ) : null}
    </section>
  );
}

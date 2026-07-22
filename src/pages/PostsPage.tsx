import { RefreshCw } from 'lucide-react';
import { ErrorView, PageHeader } from '../components/common';
import { PostEmptyState } from '../components/PostManagement/EmptyState';
import { PostTableSkeleton } from '../components/PostManagement/LoadingSkeleton';
import { PostPagination } from '../components/PostManagement/Pagination';
import { PostSortBar } from '../components/PostManagement/SortBar';
import { PostTable } from '../components/PostManagement/PostTable';
import { PostToolbar } from '../components/PostManagement/PostToolbar';
import { usePosts } from '../hooks/usePosts';
import { getErrorMessage } from '../services/http';

export function PostsPage() {
  const { query, state, setKeywordDraft, update } = usePosts();
  const total = query.data?.total ?? 0;

  return (
    <section className="users-page">
      <PageHeader
        title="Quản lý bài viết"
        description={`Tổng cộng ${total} bài viết`}
        actions={<button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Refresh</button>}
      />
      <PostToolbar
        keywordDraft={state.keywordDraft}
        postType={state.postType}
        status={state.status}
        reported={state.reported}
        userId={state.userId}
        onDraftChange={setKeywordDraft}
        onSearch={(keyword) => update({ keyword, page: 1 })}
        onFilter={(key, value) => update({ [key]: value, page: 1 })}
      />
      <PostSortBar sortBy={state.sortBy} sortDirection={state.sortDirection} onSort={(sortBy, sortDirection) => update({ sortBy, sortDirection, page: 1 })} />

      {query.isLoading ? <PostTableSkeleton /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? <PostEmptyState /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <PostTable posts={query.data.items} />
          <PostPagination
            page={state.page}
            pageSize={state.pageSize}
            total={query.data.total}
            onPage={(page) => update({ page })}
            onPageSize={(pageSize) => update({ pageSize, page: 1 })}
          />
        </>
      ) : null}
    </section>
  );
}

import { RefreshCw } from 'lucide-react';
import { ErrorView, PageHeader } from '../components/common';
import { UserEmptyState } from '../components/UserManagement/EmptyState';
import { UserTableSkeleton } from '../components/UserManagement/LoadingSkeleton';
import { UserPagination } from '../components/UserManagement/Pagination';
import { SortBar } from '../components/UserManagement/SortBar';
import { UserTable } from '../components/UserManagement/UserTable';
import { UserToolbar } from '../components/UserManagement/UserToolbar';
import { useUsers } from '../hooks/useUsers';
import { getErrorMessage } from '../services/http';

export function UsersPage() {
  const { query, state, setKeywordDraft, update } = useUsers();
  const total = query.data?.total ?? 0;

  return (
    <section className="users-page">
      <PageHeader
        title="Quản lý người dùng"
        description={`Tổng cộng ${total} người dùng`}
        actions={<button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Refresh</button>}
      />
      <UserToolbar
        keywordDraft={state.keywordDraft}
        status={state.status}
        identityStatus={state.identityStatus}
        isVerified={state.isVerified}
        onDraftChange={setKeywordDraft}
        onSearch={(keyword) => update({ keyword, page: 1 })}
        onFilter={(key, value) => update({ [key]: value, page: 1 })}
      />
      <SortBar sortBy={state.sortBy} sortDirection={state.sortDirection} onSort={(sortBy, sortDirection) => update({ sortBy, sortDirection, page: 1 })} />

      {query.isLoading ? <UserTableSkeleton /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? <UserEmptyState /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <UserTable users={query.data.items} />
          <UserPagination
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

import { RefreshCw } from 'lucide-react';
import { ErrorView, PageHeader } from '../components/common';
import { ReportEmptyState } from '../components/ReportManagement/EmptyState';
import { ReportTableSkeleton } from '../components/ReportManagement/LoadingSkeleton';
import { ReportPagination } from '../components/ReportManagement/Pagination';
import { ReportSortBar } from '../components/ReportManagement/SortBar';
import { ReportTable } from '../components/ReportManagement/ReportTable';
import { ReportToolbar } from '../components/ReportManagement/ReportToolbar';
import { useReports } from '../hooks/useReports';
import { getErrorMessage } from '../services/http';

export function ReportsPage() {
  const { query, state, update } = useReports();
  const total = query.data?.total ?? 0;
  const reports = query.data?.items ?? [];

  return (
    <section className="users-page">
      <PageHeader
        title="Quản lý Báo cáo"
        description={`Tổng cộng ${total} báo cáo`}
        actions={<button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Refresh</button>}
      />
      <ReportToolbar
        status={state.status}
        targetType={state.targetType}
        reason={state.reason}
        onFilter={(key, value) => update({ [key]: value, page: 1 })}
      />
      <ReportSortBar sortBy={state.sortBy} sortDirection={state.sortDirection} onSort={(sortBy, sortDirection) => update({ sortBy, sortDirection, page: 1 })} />

      {query.isLoading ? <ReportTableSkeleton /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data && reports.length === 0 ? <ReportEmptyState /> : null}
      {query.data && reports.length > 0 ? (
        <>
          <ReportTable reports={reports} />
          <ReportPagination
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

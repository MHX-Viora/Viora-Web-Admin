export function ReportTableSkeleton() {
  return (
    <div className="user-table-card" aria-busy="true" aria-label="Đang tải báo cáo">
      {Array.from({ length: 8 }).map((_, index) => <div className="user-row-skeleton" key={index} />)}
    </div>
  );
}

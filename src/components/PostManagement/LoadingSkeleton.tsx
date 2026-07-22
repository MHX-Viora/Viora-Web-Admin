export function PostTableSkeleton() {
  return (
    <div className="user-table-card">
      {Array.from({ length: 8 }).map((_, index) => <div className="user-row-skeleton" key={index} />)}
    </div>
  );
}

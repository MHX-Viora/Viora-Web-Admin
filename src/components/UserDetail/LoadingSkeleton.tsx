export function LoadingSkeleton() {
  return (
    <section className="user-detail">
      <div className="detail-skeleton hero" />
      <div className="detail-skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => <div className="detail-skeleton" key={index} />)}
      </div>
      <div className="detail-skeleton tall" />
      <div className="detail-skeleton tall" />
    </section>
  );
}

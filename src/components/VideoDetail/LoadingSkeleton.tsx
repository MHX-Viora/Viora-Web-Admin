export function VideoDetailSkeleton() {
  return (
    <section className="post-detail-page">
      <div className="detail-skeleton hero" />
      <div className="post-detail-layout">
        <div className="post-detail-main">
          <div className="detail-skeleton tall" />
          <div className="detail-skeleton" />
        </div>
        <div className="post-detail-side">
          <div className="detail-skeleton-grid">
            <div className="detail-skeleton" />
            <div className="detail-skeleton" />
            <div className="detail-skeleton" />
          </div>
          <div className="detail-skeleton tall" />
        </div>
      </div>
    </section>
  );
}

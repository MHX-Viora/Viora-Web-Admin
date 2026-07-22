import type { AdminVideoDetail } from '../../types/admin-video';

export function VideoHashtagCard({ video }: { video: AdminVideoDetail }) {
  if (video.hashtags.length === 0) return null;

  return (
    <section className="user-card">
      <h2>Hashtag</h2>
      <div className="hashtag-list">{video.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </section>
  );
}

import type { AdminPostDetail } from '../../types/admin-post';

export function PostHashtagCard({ post }: { post: AdminPostDetail }) {
  if (post.hashtags.length === 0) return null;
  return (
    <section className="user-card">
      <h2>Hashtag</h2>
      <div className="hashtag-list">{post.hashtags.map((tag) => <span key={tag}>#{tag.replace(/^#/, '')}</span>)}</div>
    </section>
  );
}

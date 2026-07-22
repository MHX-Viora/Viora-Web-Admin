import type { AdminPostDetail } from '../../types/admin-post';

export function PostContentCard({ post }: { post: AdminPostDetail }) {
  return (
    <section className="user-card">
      <h2>Nội dung bài viết</h2>
      {post.content ? <p className="post-full-content">{post.content}</p> : <p>Bài viết không có nội dung.</p>}
    </section>
  );
}

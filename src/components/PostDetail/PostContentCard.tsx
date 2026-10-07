import type { AdminPostDetail } from '../../types/admin-post';

export function PostContentCard({ post }: { post: AdminPostDetail }) {
  return (
    <section className="user-card">
      <h2>{post.postType === 2 ? 'Nội dung bài báo' : 'Nội dung bài viết'}</h2>
      {post.content ? <p className="post-full-content">{post.content}</p> : <p>Bài viết không có nội dung.</p>}
      {post.postType === 2 && <article className="admin-article-content">{[...(post.articleBlocks ?? [])].sort((a, b) => a.orderIndex - b.orderIndex).map(block => {
        if (block.type === 5) return <hr key={block.id} />;
        if (block.type === 1) return <h3 key={block.id}>{block.content}</h3>;
        if (block.type === 4) return <blockquote key={block.id}>{block.content}</blockquote>;
        if (block.type === 6) return <pre key={block.id}>{block.content}</pre>;
        if (block.type === 2 && block.mediaUrl) return <figure key={block.id}><img src={block.mediaUrl} alt={block.caption || 'Ảnh trong bài báo'} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
        if (block.type === 3 && block.mediaUrl) return <figure key={block.id}><video controls preload="metadata" src={block.mediaUrl} poster={block.thumbnailUrl || undefined} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
        if (block.type === 7) return <p key={block.id}>{block.content || block.mediaUrl || 'Nội dung nhúng'}</p>;
        return <p key={block.id}>{block.content}</p>;
      })}</article>}
    </section>
  );
}

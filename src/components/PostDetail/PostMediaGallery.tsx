import type { AdminPostDetail, AdminPostMedia } from '../../types/admin-post';

export function PostMediaGallery({ post, onPreview }: { post: AdminPostDetail; onPreview: (src: string) => void }) {
  if (post.media.length === 0) return null;

  return (
    <section className="user-card">
      <h2>Media</h2>
      <div className={`post-media-grid count-${Math.min(post.media.length, 4)}`}>
        {post.media.map((item) => <MediaItem item={item} key={item.id || item.mediaUrl} onPreview={onPreview} />)}
      </div>
    </section>
  );
}

function MediaItem({ item, onPreview }: { item: AdminPostMedia; onPreview: (src: string) => void }) {
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(item.mediaUrl);
  if (isVideo) {
    return <video className="post-media-item" controls poster={item.thumbnailUrl} src={item.mediaUrl} />;
  }

  return (
    <button className="post-media-item" onClick={() => onPreview(item.mediaUrl)} type="button">
      <img src={item.thumbnailUrl || item.mediaUrl} alt="Media bài viết" />
    </button>
  );
}

import type { AdminVideoDetail } from '../../types/admin-video';

export function VideoContentCard({ video }: { video: AdminVideoDetail }) {
  return (
    <section className="user-card">
      <h2>Thông tin Video</h2>
      <p className="post-full-content">{video.content || 'Video không có mô tả.'}</p>
    </section>
  );
}

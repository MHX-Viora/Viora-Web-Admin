import type { AdminVideoDetail } from '../../types/admin-video';

export function VideoPlayerCard({ video }: { video: AdminVideoDetail }) {
  const media = video.media[0];

  return (
    <section className="user-card">
      <h2>Video Player</h2>
      {media?.mediaUrl ? (
        <div className="video-player-frame">
          <video controls playsInline preload="metadata" poster={media.thumbnailUrl} src={media.mediaUrl} />
        </div>
      ) : (
        <div className="empty-inline">Video không có media.</div>
      )}
    </section>
  );
}

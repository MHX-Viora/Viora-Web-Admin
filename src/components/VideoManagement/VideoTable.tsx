import type { AdminVideo } from '../../types/admin-video';
import { VideoCardRow, VideoRow } from './VideoRow';

export function VideoTable({ videos }: { videos: AdminVideo[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table post-table">
          <thead>
            <tr>
              <th>Người đăng</th>
              <th>Loại</th>
              <th>Mô tả video</th>
              <th>Trạng thái</th>
              <th>Cảm xúc</th>
              <th>Bình luận</th>
              <th>Chia sẻ</th>
              <th>Báo cáo</th>
              <th>Ngày đăng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>{videos.map((video) => <VideoRow key={video.id} video={video} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{videos.map((video) => <VideoCardRow key={video.id} video={video} />)}</div>
    </>
  );
}

import type { AdminVideo } from '../../types/admin-video';
import { VideoCardRow, VideoRow } from './VideoRow';

export function VideoTable({ videos }: { videos: AdminVideo[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table post-table">
          <thead>
            <tr>
              <th className="column-author">Người đăng</th>
              <th className="column-type table-column-secondary">Loại</th>
              <th className="column-content">Mô tả video</th>
              <th className="column-status">Trạng thái</th>
              <th className="column-engagement table-column-secondary">Cảm xúc</th>
              <th className="column-engagement table-column-secondary">Bình luận</th>
              <th className="column-engagement table-column-secondary">Chia sẻ</th>
              <th className="column-report">Báo cáo</th>
              <th className="column-date">Ngày đăng</th>
              <th className="column-action"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>{videos.map((video) => <VideoRow key={video.id} video={video} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{videos.map((video) => <VideoCardRow key={video.id} video={video} />)}</div>
    </>
  );
}

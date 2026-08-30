import type { AdminPost } from '../../types/admin-post';
import { PostCardRow, PostRow } from './PostRow';

export function PostTable({ posts }: { posts: AdminPost[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table post-table">
          <thead>
            <tr>
              <th className="column-author">Người đăng</th>
              <th className="column-type table-column-secondary">Loại</th>
              <th className="column-content">Nội dung</th>
              <th className="column-status">Trạng thái</th>
              <th className="column-engagement table-column-secondary">Cảm xúc</th>
              <th className="column-engagement table-column-secondary">Bình luận</th>
              <th className="column-engagement table-column-secondary">Chia sẻ</th>
              <th className="column-report">Báo cáo</th>
              <th className="column-date">Ngày đăng</th>
              <th className="column-action"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>{posts.map((post) => <PostRow key={post.id} post={post} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{posts.map((post) => <PostCardRow key={post.id} post={post} />)}</div>
    </>
  );
}

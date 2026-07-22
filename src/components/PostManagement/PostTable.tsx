import type { AdminPost } from '../../types/admin-post';
import { PostCardRow, PostRow } from './PostRow';

export function PostTable({ posts }: { posts: AdminPost[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table post-table">
          <thead>
            <tr>
              <th>Người đăng</th>
              <th>Loại</th>
              <th>Nội dung</th>
              <th>Trạng thái</th>
              <th>Cảm xúc</th>
              <th>Bình luận</th>
              <th>Chia sẻ</th>
              <th>Báo cáo</th>
              <th>Ngày đăng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>{posts.map((post) => <PostRow key={post.id} post={post} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{posts.map((post) => <PostCardRow key={post.id} post={post} />)}</div>
    </>
  );
}

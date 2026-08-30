import type { User } from '../../types/admin';
import { UserCardRow, UserRow } from './UserRow';

export function UserTable({ users }: { users: User[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table">
          <thead>
            <tr>
              <th className="column-avatar">Ảnh</th>
              <th className="column-user">Người dùng</th>
              <th className="column-email">Email</th>
              <th className="column-phone table-column-secondary">Điện thoại</th>
              <th className="column-status">Trạng thái</th>
              <th className="column-identity">Định danh</th>
              <th className="column-account table-column-secondary">Loại tài khoản</th>
              <th className="column-verified table-column-secondary">Tick xanh</th>
              <th className="column-metric table-column-secondary">Bài viết</th>
              <th className="column-metric table-column-secondary">Bạn bè</th>
              <th className="column-date">Ngày tạo</th>
              <th className="column-action"><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>{users.map((user) => <UserRow key={user.id} user={user} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{users.map((user) => <UserCardRow key={user.id} user={user} />)}</div>
    </>
  );
}

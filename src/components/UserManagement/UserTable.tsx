import type { User } from '../../types/admin';
import { UserCardRow, UserRow } from './UserRow';

export function UserTable({ users }: { users: User[] }) {
  return (
    <>
      <div className="user-table-card">
        <table className="user-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Người dùng</th>
              <th className="optional-tablet">Email</th>
              <th>Số điện thoại</th>
              <th>Trạng thái</th>
              <th>Xác thực</th>
              <th>Tick xanh</th>
              <th>Bài viết</th>
              <th>Bạn bè</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>{users.map((user) => <UserRow key={user.id} user={user} />)}</tbody>
        </table>
      </div>
      <div className="mobile-user-list">{users.map((user) => <UserCardRow key={user.id} user={user} />)}</div>
    </>
  );
}

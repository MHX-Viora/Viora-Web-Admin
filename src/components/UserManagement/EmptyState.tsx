import { Inbox } from 'lucide-react';

export function UserEmptyState() {
  return (
    <div className="user-empty">
      <Inbox size={42} />
      <strong>Không tìm thấy người dùng.</strong>
    </div>
  );
}

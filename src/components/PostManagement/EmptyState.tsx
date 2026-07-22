import { Inbox } from 'lucide-react';

export function PostEmptyState() {
  return (
    <div className="user-empty">
      <Inbox size={42} />
      <strong>Không có bài viết.</strong>
    </div>
  );
}

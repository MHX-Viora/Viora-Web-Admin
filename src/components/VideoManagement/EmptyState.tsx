import { Inbox } from 'lucide-react';

export function VideoEmptyState() {
  return (
    <div className="user-empty">
      <Inbox size={42} />
      <strong>Không có video.</strong>
    </div>
  );
}

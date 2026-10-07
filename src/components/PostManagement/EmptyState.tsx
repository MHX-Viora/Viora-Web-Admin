import { Inbox } from 'lucide-react';

export function PostEmptyState({ label = 'bài viết' }: { label?: string }) {
  return (
    <div className="user-empty">
      <Inbox size={42} />
      <strong>Không có {label}.</strong>
    </div>
  );
}

import { Inbox } from 'lucide-react';

export function ReportEmptyState() {
  return (
    <div className="user-empty" role="status">
      <Inbox size={42} />
      <strong>Không có báo cáo.</strong>
    </div>
  );
}

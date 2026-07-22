const targetLabels: Record<number, string> = { 0: 'Người dùng', 1: 'Bài viết', 2: 'Bình luận', 3: 'Tin nhắn' };
const reasonLabels: Record<number, string> = {
  0: 'Spam',
  1: 'Nội dung phản cảm',
  2: 'Quấy rối',
  3: 'Lừa đảo',
  4: 'Vi phạm bản quyền',
  5: 'Thông tin sai sự thật',
  6: 'Khác',
};
const statusLabels: Record<number, string> = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' };

export function TargetTypeBadge({ value }: { value: number }) {
  return <span className={`report-badge target-${value}`}>{targetLabels[value] ?? value}</span>;
}

export function ReasonBadge({ value }: { value: number }) {
  return <span className={`report-badge reason-${value}`}>{reasonLabels[value] ?? value}</span>;
}

export function ReportStatusBadge({ value }: { value: number }) {
  return <span className={`report-badge report-status-${value}`}>{statusLabels[value] ?? value}</span>;
}

export { targetLabels, reasonLabels, statusLabels };

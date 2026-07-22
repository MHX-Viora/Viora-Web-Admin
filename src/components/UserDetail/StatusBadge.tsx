import { CheckCircle } from 'lucide-react';
import { accountStatusLabels } from '../../types/admin-user';

export function StatusBadge({ status }: { status?: string | number }) {
  const value = Number(status);
  return <span className={`detail-badge account-${value}`}>{accountStatusLabels[value] ?? status ?? '-'}</span>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? <span className="verified-badge"><CheckCircle size={14} />Đã xác thực</span> : <span className="detail-badge">Chưa xác thực</span>;
}

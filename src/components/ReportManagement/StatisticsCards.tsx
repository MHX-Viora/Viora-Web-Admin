import { CheckCircle2, ClipboardList, Clock3, XCircle } from 'lucide-react';
import type { AdminReport } from '../../types/admin-report';
import { formatNumber } from '../../utils/format';

export function ReportStatisticsCards({ reports, total }: { reports: AdminReport[]; total: number }) {
  const pending = reports.filter((item) => item.status === 0).length;
  const approved = reports.filter((item) => item.status === 1).length;
  const rejected = reports.filter((item) => item.status === 2).length;

  return (
    <div className="report-stat-grid">
      <Stat icon={<ClipboardList size={22} />} label="Tổng báo cáo" value={total} />
      <Stat icon={<Clock3 size={22} />} label="Đang chờ xử lý" value={pending} tone="pending" />
      <Stat icon={<CheckCircle2 size={22} />} label="Đã xử lý" value={approved} tone="approved" />
      <Stat icon={<XCircle size={22} />} label="Đã từ chối" value={rejected} tone="rejected" />
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return (
    <div className={`report-stat-card ${tone ?? ''}`}>
      <span>{icon}</span>
      <strong>{formatNumber(value)}</strong>
      <small>{label}</small>
    </div>
  );
}

import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { AdminReport } from '../../types/admin-report';
import { formatDate } from '../../utils/format';
import { ReasonBadge, ReportStatusBadge, TargetTypeBadge } from './ReportBadges';

export function ReportRow({ report }: { report: AdminReport }) {
  const navigate = useNavigate();
  const openDetail = () => navigate(`/admin/reports/${report.id}`);

  return (
    <tr onClick={openDetail}>
      <td className="column-author"><Reporter report={report} /></td>
      <td className="column-target"><Target report={report} /></td>
      <td className="column-reason"><ReasonBadge value={report.reason} /></td>
      <td className="column-content table-column-secondary"><span className="post-content-clamp" title={report.description}>{report.description || '-'}</span></td>
      <td className="column-status"><ReportStatusBadge value={report.status} /></td>
      <td className="column-date"><DateCell value={report.createdAt} /></td>
      <td className="column-action"><button aria-label="Xem chi tiết báo cáo" className="table-action-button" onClick={(event) => { event.stopPropagation(); openDetail(); }} title="Xem chi tiết" type="button"><Eye size={16} /></button></td>
    </tr>
  );
}

export function ReportCardRow({ report }: { report: AdminReport }) {
  const navigate = useNavigate();
  return (
    <article className="mobile-user-card" onClick={() => navigate(`/admin/reports/${report.id}`)}>
      <UserAvatar name={report.reporterDisplayName || 'User'} />
      <div>
        <strong>{report.reporterDisplayName || '-'}</strong>
        <span>{report.reporterUserId}</span>
        <div className="badge-row"><TargetTypeBadge value={report.targetType} /><ReasonBadge value={report.reason} /><ReportStatusBadge value={report.status} /></div>
      </div>
      <button aria-label="Xem chi tiết báo cáo" className="btn" type="button"><Eye size={16} /></button>
    </article>
  );
}

function Reporter({ report }: { report: AdminReport }) {
  return (
    <div className="post-author-cell">
      <UserAvatar name={report.reporterDisplayName || 'User'} />
      <div><strong>{report.reporterDisplayName || '-'}</strong><span>{report.reporterUserId}</span></div>
    </div>
  );
}

function Target({ report }: { report: AdminReport }) {
  return (
    <div className="report-target-cell">
      <TargetTypeBadge value={report.targetType} />
      <span>{report.targetId}</span>
    </div>
  );
}

function DateCell({ value }: { value: string }) {
  return <div className="date-cell"><strong>{formatDate(value)}</strong></div>;
}

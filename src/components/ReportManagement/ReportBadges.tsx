import { reasonLabels, reportStatusLabels, targetLabels } from './report-labels';

export function TargetTypeBadge({ value }: { value: number }) {
  return <span className={`report-badge target-${value}`}>{targetLabels[value] ?? value}</span>;
}

export function ReasonBadge({ value }: { value: number }) {
  return <span className={`report-badge reason-${value}`}>{reasonLabels[value] ?? value}</span>;
}

export function ReportStatusBadge({ value }: { value: number }) {
  return <span className={`report-badge report-status-${value}`}>{reportStatusLabels[value] ?? value}</span>;
}

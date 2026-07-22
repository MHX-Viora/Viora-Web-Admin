import { identityStatusLabels } from '../../types/admin-user';

export function IdentityBadge({ status }: { status?: string | number }) {
  const value = Number(status);
  return <span className={`detail-badge identity-${value}`}>{identityStatusLabels[value] ?? status ?? '-'}</span>;
}

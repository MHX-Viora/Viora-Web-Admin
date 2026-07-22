import { roleLabels } from '../../types/admin-user';

export function RoleBadge({ role }: { role?: number }) {
  return <span className={`detail-badge role-${role ?? 0}`}>{roleLabels[role ?? 0] ?? role ?? '-'}</span>;
}

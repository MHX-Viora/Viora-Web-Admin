import type { AdminUserDetail } from '../../types/admin-user';
import { formatDate } from '../../utils/format';
import { IdentityBadge } from './IdentityBadge';
import { RoleBadge } from './RoleBadge';
import { StatusBadge, VerifiedBadge } from './StatusBadge';

export function AccountInfoCard({ user }: { user: AdminUserDetail }) {
  const identityStatus = Number(user.identity?.status ?? user.identityStatus);

  return (
    <section className="user-card">
      <h2>Thông tin tài khoản</h2>
      <div className="info-grid account-info-grid">
        <span>User ID<strong className="mono-value">{user.id}</strong></span>
        <span>Account ID<strong className="mono-value">{user.accountId ?? '-'}</strong></span>
        <span>Role<strong><RoleBadge role={user.role} /></strong></span>
        <span>Status<strong><StatusBadge status={user.status} /></strong></span>
        <span>Identity Status<strong><IdentityBadge status={identityStatus} /></strong></span>
        <span>Verified<strong><VerifiedBadge verified={user.verified} /></strong></span>
        <span>Created At<strong>{formatDate(user.createdAt)}</strong></span>
        <span>Last Login<strong>{formatDate(user.lastLoginAt)}</strong></span>
      </div>
    </section>
  );
}

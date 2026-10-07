import { TechnicalDetails } from '../TechnicalDetails';
import type { AdminUserDetail } from '../../types/admin-user';
import { formatDate } from '../../utils/format';
import { IdentityBadge } from './IdentityBadge';
import { RoleBadge } from './RoleBadge';
import { StatusBadge, VerifiedBadge } from './StatusBadge';

export function AccountInfoCard({ user }: { user: AdminUserDetail }) {
  const identityStatus = Number(user.identity?.status ?? user.identityStatus);

  return (
    <section className="user-card account-info-card">
      <h2>Thông tin tài khoản</h2>
      <div className="info-grid account-info-grid">
        <span>Vai trò<strong><RoleBadge role={user.role} /></strong></span>
        <span>Trạng thái<strong><StatusBadge status={user.status} /></strong></span>
        <span>Định danh<strong><IdentityBadge status={identityStatus} /></strong></span>
        <span>Xác thực<strong><VerifiedBadge verified={user.verified} /></strong></span>
        <span>Ngày tạo<strong>{formatDate(user.createdAt)}</strong></span>
        <span>Lần đăng nhập cuối<strong>{formatDate(user.lastLoginAt)}</strong></span>
      </div>
      <TechnicalDetails values={{ 'Mã người dùng': user.id, 'Mã tài khoản': user.accountId }} />
    </section>
  );
}

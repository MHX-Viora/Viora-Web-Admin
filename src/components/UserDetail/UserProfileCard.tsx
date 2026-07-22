import { BadgeCheck, BadgeX, Mail, Phone, ShieldOff, Trash2, Unlock } from 'lucide-react';
import { UserAvatar } from '../common';
import type { AdminUserDetail } from '../../types/admin-user';
import { formatDate } from '../../utils/format';
import { IdentityBadge } from './IdentityBadge';
import { RoleBadge } from './RoleBadge';
import { StatusBadge, VerifiedBadge } from './StatusBadge';

export function UserProfileCard({
  user,
  actionLoading,
  onBan,
  onUnban,
  onDelete,
  onVerify,
  onUnverify,
}: {
  user: AdminUserDetail;
  actionLoading?: boolean;
  onBan: () => void;
  onUnban: () => void;
  onDelete: () => void;
  onVerify: () => void;
  onUnverify: () => void;
}) {
  const identityStatus = Number(user.identity?.status ?? user.identityStatus);
  const isBanned = Number(user.status) === 0;

  return (
    <section className="user-card profile-card">
      <div className="profile-cover" style={{ backgroundImage: user.coverUrl ? `url(${user.coverUrl})` : undefined }} />
      <div className="profile-card-body">
        <UserAvatar src={user.avatarUrl} name={user.name} size="lg" />
        <div className="profile-summary">
          <div>
            <h2>{user.name}</h2>
            <div className="badge-row">
              <VerifiedBadge verified={user.verified} />
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
              <IdentityBadge status={identityStatus} />
            </div>
          </div>
          <div className="profile-contact">
            <span><Mail size={15} />{user.email}</span>
            <span><Phone size={15} />{user.phone ?? '-'}</span>
          </div>
        </div>
        <div className="profile-actions">
          {user.verified ? (
            <button className="btn" disabled={actionLoading} onClick={onUnverify} type="button"><BadgeX size={16} />Hủy xác thực</button>
          ) : (
            <button className="btn primary" disabled={actionLoading} onClick={onVerify} type="button"><BadgeCheck size={16} />Xác thực</button>
          )}
          {isBanned ? (
            <button className="btn primary" disabled={actionLoading} onClick={onUnban} type="button"><Unlock size={16} />Gỡ ban</button>
          ) : (
            <button className="btn danger" disabled={actionLoading} onClick={onBan} type="button"><ShieldOff size={16} />Ban người dùng</button>
          )}
          <button className="btn danger" disabled={actionLoading} onClick={onDelete} type="button"><Trash2 size={16} />Xóa người dùng</button>
        </div>
      </div>
      <div className="profile-meta-grid">
        <span>Ngày tạo<strong>{formatDate(user.createdAt)}</strong></span>
        <span>Lần đăng nhập cuối<strong>{formatDate(user.lastLoginAt)}</strong></span>
      </div>
    </section>
  );
}

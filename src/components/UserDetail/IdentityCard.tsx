import { BadgeCheck } from 'lucide-react';
import type { AdminUserDetail } from '../../types/admin-user';
import { formatDate } from '../../utils/format';
import { IdentityBadge } from './IdentityBadge';

export function IdentityCard({ user, onPreview }: { user: AdminUserDetail; onPreview: (src: string) => void }) {
  const identity = user.identity;
  const identityStatus = Number(identity?.status ?? user.identityStatus);

  return (
    <section className="user-card">
      <h2>Thông tin xác thực CCCD</h2>
      {!identity ? (
        <div className="empty-inline">
          <BadgeCheck size={34} />
          <strong>Chưa gửi xác thực.</strong>
        </div>
      ) : (
        <>
          <div className="info-grid">
            <span>Họ tên<strong>{identity.fullName ?? identity.displayName ?? '-'}</strong></span>
            <span>Ngày sinh<strong>{identity.birthday ? formatDate(identity.birthday) : '-'}</strong></span>
            <span>Số CCCD<strong>{identity.identityNumber ?? '-'}</strong></span>
            <span>Trạng thái<strong><IdentityBadge status={identityStatus} /></strong></span>
            {identity.rejectReason ? <span className="wide">Lý do từ chối<strong>{identity.rejectReason}</strong></span> : null}
            <span>Ngày gửi<strong>{formatDate(identity.submittedAt ?? identity.createdAt)}</strong></span>
            <span>Ngày duyệt<strong>{formatDate(identity.reviewedAt)}</strong></span>
          </div>
          <div className="identity-images">
            <PreviewImage label="Mặt trước CCCD" src={identity.frontImageUrl} onPreview={onPreview} />
            <PreviewImage label="Mặt sau CCCD" src={identity.backImageUrl} onPreview={onPreview} />
          </div>
        </>
      )}
    </section>
  );
}

function PreviewImage({ label, src, onPreview }: { label: string; src?: string; onPreview: (src: string) => void }) {
  return (
    <button className="identity-image" disabled={!src} onClick={() => src && onPreview(src)} type="button">
      {src ? <img src={src} alt={label} /> : <span>Không có ảnh</span>}
      <strong>{label}</strong>
    </button>
  );
}

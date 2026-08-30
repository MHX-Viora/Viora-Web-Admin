import { Eye, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { User } from '../../types/admin';
import { formatNumber } from '../../utils/format';
import { UserIdentityBadge, UserStatusBadge } from './StatusBadge';
import { AccountStyleBadge } from './AccountStyleBadge';

export function UserRow({ user }: { user: User }) {
  const navigate = useNavigate();
  const openDetail = () => navigate(`/admin/users/${user.id}`);

  return (
    <tr onClick={openDetail}>
      <td className="column-avatar"><UserAvatar src={user.avatarUrl} name={user.name} /></td>
      <td className="column-user"><div className="user-name-cell"><strong>{user.name}</strong><span>{user.id}</span></div></td>
      <td className="column-email">{user.email}</td>
      <td className="column-phone table-column-secondary">{user.phone ?? '-'}</td>
      <td className="column-status"><UserStatusBadge status={user.status} /></td>
      <td className="column-identity"><UserIdentityBadge status={user.identityStatus} /></td>
      <td className="column-account table-column-secondary"><AccountStyleBadge value={user.accountStyle} /></td>
      <td className="column-verified table-column-secondary">{user.verified ? <CheckCircle className="verified-icon" size={16} /> : <XCircle className="unverified-icon" size={16} />}</td>
      <td className="column-metric table-column-secondary">{formatNumber(user.postCount)}</td>
      <td className="column-metric table-column-secondary">{formatNumber(user.friendCount)}</td>
      <td className="column-date"><DateCell value={user.createdAt} /></td>
      <td className="column-action"><button aria-label={`Xem chi tiết ${user.name}`} className="table-action-button" onClick={(event) => { event.stopPropagation(); openDetail(); }} title="Xem chi tiết" type="button"><Eye size={15} /></button></td>
    </tr>
  );
}

export function UserCardRow({ user }: { user: User }) {
  const navigate = useNavigate();
  return (
    <article className="mobile-user-card" onClick={() => navigate(`/admin/users/${user.id}`)}>
      <UserAvatar src={user.avatarUrl} name={user.name} />
      <div>
        <strong>{user.name}</strong>
        <span>{user.email}</span>
        <div className="badge-row"><UserStatusBadge status={user.status} /><AccountStyleBadge value={user.accountStyle} /><UserIdentityBadge status={user.identityStatus} /></div>
      </div>
      <button aria-label={`Xem chi tiết ${user.name}`} className="btn" type="button"><Eye size={16} /></button>
    </article>
  );
}

function DateCell({ value }: { value: string }) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <>-</>;
  return <div className="date-cell"><strong>{date.toLocaleDateString('vi-VN')}</strong><span>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>;
}

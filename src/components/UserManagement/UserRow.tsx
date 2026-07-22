import { Eye, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../common';
import type { User } from '../../types/admin';
import { formatNumber } from '../../utils/format';
import { UserIdentityBadge, UserStatusBadge } from './StatusBadge';

export function UserRow({ user }: { user: User }) {
  const navigate = useNavigate();
  const openDetail = () => navigate(`/admin/users/${user.id}`);

  return (
    <tr onClick={openDetail}>
      <td><UserAvatar src={user.avatarUrl} name={user.name} /></td>
      <td><div className="user-name-cell"><strong>{user.name}</strong><span>{user.id}</span></div></td>
      <td className="optional-tablet">{user.email}</td>
      <td>{user.phone ?? '-'}</td>
      <td><UserStatusBadge status={user.status} /></td>
      <td><UserIdentityBadge status={user.identityStatus} /></td>
      <td>{user.verified ? <CheckCircle className="verified-icon" size={18} /> : <XCircle className="unverified-icon" size={18} />}</td>
      <td>{formatNumber(user.postCount)}</td>
      <td>{formatNumber(user.friendCount)}</td>
      <td><DateCell value={user.createdAt} /></td>
      <td><button className="btn" onClick={(event) => { event.stopPropagation(); openDetail(); }} type="button"><Eye size={16} />Xem</button></td>
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
        <div className="badge-row"><UserStatusBadge status={user.status} /><UserIdentityBadge status={user.identityStatus} /></div>
      </div>
      <button className="btn" type="button"><Eye size={16} /></button>
    </article>
  );
}

function DateCell({ value }: { value: string }) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <>-</>;
  return <div className="date-cell"><strong>{date.toLocaleDateString('vi-VN')}</strong><span>{date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>;
}

import { accountStyleLabels } from '../../types/admin-user';

export function AccountStyleBadge({ value }: { value: number }) {
  return <span className={`account-style-badge account-style-${value}`}>{accountStyleLabels[value] ?? 'Không xác định'}</span>;
}

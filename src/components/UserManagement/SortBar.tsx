import { CalendarDays, FileText, Type, UserRoundCheck } from 'lucide-react';

const sorts = [
  ['createdAt', 'Ngày tạo', CalendarDays],
  ['postCount', 'Bài viết', FileText],
  ['friendCount', 'Bạn bè', UserRoundCheck],
  ['displayName', 'Tên', Type],
] as const;

export function SortBar({ sortBy, sortDirection, onSort }: { sortBy: string; sortDirection: string; onSort: (sortBy: string, sortDirection: string) => void }) {
  return (
    <div className="sort-bar">
      <div className="sort-buttons">
        {sorts.map(([key, label, Icon]) => (
          <button className={sortBy === key ? 'active' : ''} key={key} onClick={() => onSort(key, sortDirection)} type="button">
            <Icon size={15} />{label}
          </button>
        ))}
      </div>
      <button className="sort-direction" onClick={() => onSort(sortBy, sortDirection === 'asc' ? 'desc' : 'asc')} type="button">
        {sortDirection === 'asc' ? '↑ ASC' : '↓ DESC'}
      </button>
    </div>
  );
}

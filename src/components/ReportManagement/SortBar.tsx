import { CalendarDays, Flag, Folder, TriangleAlert, User } from 'lucide-react';

const sorts = [
  ['createdAt', 'Ngày tạo', CalendarDays],
  ['status', 'Trạng thái', TriangleAlert],
  ['targetType', 'Loại đối tượng', Folder],
  ['reason', 'Lý do', Flag],
  ['reporterDisplayName', 'Người báo cáo', User],
] as const;

export function ReportSortBar({ sortBy, sortDirection, onSort }: { sortBy: string; sortDirection: string; onSort: (sortBy: string, sortDirection: string) => void }) {
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

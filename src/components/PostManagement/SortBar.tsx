import { CalendarDays, Flag, Heart, MessageCircle, Repeat2, User } from 'lucide-react';

const sorts = [
  ['createdAt', 'Ngày đăng', CalendarDays],
  ['reactionCount', 'Cảm xúc', Heart],
  ['commentCount', 'Bình luận', MessageCircle],
  ['shareCount', 'Chia sẻ', Repeat2],
  ['reportCount', 'Báo cáo', Flag],
  ['displayName', 'Người đăng', User],
] as const;

export function PostSortBar({ sortBy, sortDirection, onSort }: { sortBy: string; sortDirection: string; onSort: (sortBy: string, sortDirection: string) => void }) {
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

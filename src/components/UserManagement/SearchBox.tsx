import { useEffect } from 'react';
import { Search } from 'lucide-react';

export function UserSearchBox({ value, onDraftChange, onSearch }: { value: string; onDraftChange: (value: string) => void; onSearch: (value: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), 500);
    return () => window.clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <label className="user-search">
      <Search size={16} />
      <input value={value} onChange={(event) => onDraftChange(event.target.value)} placeholder="Tìm theo tên, email hoặc số điện thoại..." />
    </label>
  );
}

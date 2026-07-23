import { UserSearchBox } from './SearchBox';

type Props = {
  keywordDraft: string;
  status: string;
  identityStatus: string;
  isVerified: string;
  onDraftChange: (value: string) => void;
  onSearch: (value: string) => void;
  onFilter: (key: string, value: string) => void;
};

export function UserToolbar({ keywordDraft, status, identityStatus, isVerified, onDraftChange, onSearch, onFilter }: Props) {
  return (
    <div className="user-toolbar">
      <UserSearchBox value={keywordDraft} onDraftChange={onDraftChange} onSearch={onSearch} />
      <FilterSelect label="Trạng thái" value={status} onChange={(value) => onFilter('status', value)} options={[['', 'Tất cả'], ['1', 'Đang hoạt động'], ['0', 'Đã khóa'], ['2', 'Đã xóa']]} />
      <FilterSelect label="Định danh" value={identityStatus} onChange={(value) => onFilter('identityStatus', value)} options={[['', 'Tất cả'], ['1', 'Chờ duyệt'], ['2', 'Đã duyệt'], ['3', 'Từ chối']]} />
      <FilterSelect label="Xác thực" value={isVerified} onChange={(value) => onFilter('isVerified', value)} options={[['', 'Tất cả'], ['true', 'Đã xác thực'], ['false', 'Chưa xác thực']]} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

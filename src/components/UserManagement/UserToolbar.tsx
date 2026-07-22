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
      <FilterSelect label="Status" value={status} onChange={(value) => onFilter('status', value)} options={[['', 'Tất cả'], ['1', 'Active'], ['0', 'Banned'], ['2', 'Deleted']]} />
      <FilterSelect label="Identity" value={identityStatus} onChange={(value) => onFilter('identityStatus', value)} options={[['', 'Tất cả'], ['1', 'Pending'], ['2', 'Approved'], ['3', 'Rejected']]} />
      <FilterSelect label="Verified" value={isVerified} onChange={(value) => onFilter('isVerified', value)} options={[['', 'Tất cả'], ['true', 'Đã xác thực'], ['false', 'Chưa xác thực']]} />
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

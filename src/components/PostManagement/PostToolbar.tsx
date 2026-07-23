import { PostSearchBox } from './SearchBox';

type Props = {
  keywordDraft: string;
  postType: string;
  status: string;
  reported: string;
  userId: string;
  onDraftChange: (value: string) => void;
  onSearch: (value: string) => void;
  onFilter: (key: string, value: string) => void;
};

export function PostToolbar({ keywordDraft, postType, status, reported, userId, onDraftChange, onSearch, onFilter }: Props) {
  return (
    <div className="post-toolbar">
      <PostSearchBox value={keywordDraft} onDraftChange={onDraftChange} onSearch={onSearch} />
      <FilterSelect label="Loại" value={postType} onChange={(value) => onFilter('postType', value)} options={[['', 'Tất cả'], ['0', 'Bài viết'], ['1', 'Video ngắn']]} />
      <FilterSelect label="Trạng thái" value={status} onChange={(value) => onFilter('status', value)} options={[['', 'Tất cả'], ['0', 'Bản nháp'], ['1', 'Đã đăng'], ['2', 'Đã ẩn'], ['3', 'Đã xóa']]} />
      <FilterSelect label="Báo cáo" value={reported} onChange={(value) => onFilter('reported', value)} options={[['', 'Tất cả'], ['true', 'Có báo cáo'], ['false', 'Không có báo cáo']]} />
      <label className="filter-select post-user-filter">
        <span>Người đăng</span>
        <input value={userId} onChange={(event) => onFilter('userId', event.target.value)} placeholder="ID người dùng" />
      </label>
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

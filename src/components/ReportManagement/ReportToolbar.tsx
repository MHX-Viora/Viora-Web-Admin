import { reasonLabels, statusLabels, targetLabels } from './ReportBadges';

type Props = {
  status: string;
  targetType: string;
  reason: string;
  onFilter: (key: string, value: string) => void;
};

export function ReportToolbar({ status, targetType, reason, onFilter }: Props) {
  return (
    <div className="report-toolbar">
      <FilterSelect label="Trạng thái" value={status} onChange={(value) => onFilter('status', value)} options={toOptions(statusLabels)} />
      <FilterSelect label="Đối tượng bị báo cáo" value={targetType} onChange={(value) => onFilter('targetType', value)} options={toOptions(targetLabels)} />
      <FilterSelect label="Lý do báo cáo" value={reason} onChange={(value) => onFilter('reason', value)} options={toOptions(reasonLabels)} />
    </div>
  );
}

function toOptions(labels: Record<number, string>) {
  return [['', 'Tất cả'], ...Object.entries(labels)] as Array<[string, string]>;
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

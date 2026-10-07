import { copyFinancialValue } from '../utils/clipboard';

export function TechnicalDetails({ values }: { values: Record<string, string | null | undefined> }) {
  return <details className="technical-details"><summary>Thông tin kỹ thuật</summary><dl>{Object.entries(values).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><code>{value || 'Chưa ghi nhận'}</code>{value && <button className="btn" type="button" aria-label={`Sao chép ${label}`} onClick={() => void copyFinancialValue(value)}>Sao chép</button>}</dd></div>)}</dl></details>;
}

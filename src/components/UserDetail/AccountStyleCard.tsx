import { accountStyleLabels } from '../../types/admin-user';

export function AccountStyleCard({
  disabled,
  onChange,
  onSave,
  value,
}: {
  disabled: boolean;
  onChange: (value: number) => void;
  onSave: () => void;
  value: number;
}) {
  return (
    <section className="user-card account-style-card">
      <h2>Loại tài khoản</h2>
      <p>Loại tài khoản quyết định quyền sử dụng các tính năng mở rộng.</p>
      <label className="field-label">
        Loại tài khoản hiện tại
        <select disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} value={value}>
          {Object.entries(accountStyleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <button className="btn primary" disabled={disabled} onClick={onSave} type="button">
        {disabled ? 'Đang lưu…' : 'Lưu loại tài khoản'}
      </button>
    </section>
  );
}

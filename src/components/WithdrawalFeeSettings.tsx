import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog, ErrorView } from './common';
import { getWithdrawalFeeSettings, updateWithdrawalFeeSettings } from '../services/admin-finance.service';
import { getErrorMessage } from '../services/http';
import { formatDate } from '../utils/format';
import { formatVnd } from '../utils/money';
import { formatFeePercent, parseFeePercent } from '../utils/withdrawal-fee';

export function WithdrawalFeeSettings() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['withdrawal-fee-settings'], queryFn: getWithdrawalFeeSettings, staleTime: 0 });
  const [draft, setDraft] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ percent: number; version: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  if (query.isLoading) return <div className="withdrawal-fee-settings" role="status">Đang tải cấu hình phí rút tiền…</div>;
  if (query.isError || !query.data) return <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const current = query.data;
  const value = draft ?? String(current.feePercent);
  const percent = parseFeePercent(value);
  const changed = percent !== null && percent !== current.feePercent;
  const save = async () => {
    if (!confirmation || lock.current) return;
    lock.current = true; setSaving(true); setError(null);
    try {
      const updated = await updateWithdrawalFeeSettings(confirmation.percent, confirmation.version);
      client.setQueryData(['withdrawal-fee-settings'], updated);
      setDraft(null); setConfirmation(null);
      toast.success('Đã cập nhật phí rút tiền');
      await client.invalidateQueries({ queryKey: ['withdrawal-fee-settings'] });
    } catch (reason) {
      setError(getErrorMessage(reason)); setConfirmation(null);
      await query.refetch();
    } finally { lock.current = false; setSaving(false); }
  };
  return <section className="withdrawal-fee-settings" aria-labelledby="withdrawal-fee-title" aria-busy={saving}>
    <div><h2 id="withdrawal-fee-title">Phí rút tiền</h2><p>Đang áp dụng <strong>{formatFeePercent(current.feePercent)}</strong> cho yêu cầu mới. Yêu cầu đã tạo giữ nguyên phí.</p><small>{current.updatedBy ? `Cập nhật: ${formatDate(current.updatedAt)}` : 'Mặc định của hệ thống'}</small></div>
    <div className="withdrawal-fee-editor"><label htmlFor="withdrawal-fee-percent">Tỷ lệ phí (%)</label><div className="withdrawal-fee-input"><input id="withdrawal-fee-percent" inputMode="decimal" maxLength={5} value={value} disabled={saving} aria-invalid={percent === null} aria-describedby="withdrawal-fee-help" onChange={event => { setDraft(event.target.value); setError(null); }} /><button className="btn primary" type="button" disabled={!changed || saving || query.isFetching} onClick={() => percent !== null && setConfirmation({ percent, version: current.version })}>Lưu tỷ lệ phí</button></div><small id="withdrawal-fee-help">Từ 0% đến 99,99%, tối đa 2 chữ số thập phân. Phí làm tròn đến 1 ₫.</small>{percent === null ? <p role="alert">Nhập tỷ lệ hợp lệ, ví dụ 10 hoặc 12,5.</p> : <p>Rút {formatVnd(100000)} → phí {formatVnd(Math.round(percent * 1000))}, nhận {formatVnd(100000 - Math.round(percent * 1000))}.</p>}{error && <p role="alert">{error}</p>}</div>
    {confirmation && <ConfirmDialog title="Xác nhận thay đổi phí rút" description={`Áp dụng ${formatFeePercent(confirmation.percent)} cho yêu cầu rút mới. Yêu cầu đã tạo giữ nguyên phí.`} confirmText="Lưu phí mới" loading={saving} onCancel={() => !saving && setConfirmation(null)} onConfirm={() => void save()} />}
  </section>;
}

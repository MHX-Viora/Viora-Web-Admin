import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ErrorView, PageHeader } from '../components/common';
import { ModalFrame } from '../components/ModalFrame';
import { TechnicalDetails } from '../components/TechnicalDetails';
import { WithdrawalFeeSettings } from '../components/WithdrawalFeeSettings';
import { adjustAdminWallet, getAdminPayments, getAdminWalletTransactions, getAdminWallets, getAdminWithdrawals } from '../services/admin-finance.service';
import { getErrorMessage } from '../services/http';
import type { AdminPayment, AdminWallet, AdminWalletTransaction, AdminWithdrawal, FinancePage as FinanceResult } from '../types/finance';
import { formatVnd, formatAnktCoin, isSafeVnd } from '../utils/money';
import { formatDate } from '../utils/format';
import { transactionLabels, ledgerLabels, paymentLabels, withdrawalLabels, withdrawalTone } from '../utils/finance';

type Tab = 'wallets' | 'transactions' | 'payments' | 'withdrawals';
type Row = AdminWallet | AdminWalletTransaction | AdminPayment | AdminWithdrawal;
const tabs: { value: Tab; label: string }[] = [{ value: 'wallets', label: 'Ví' }, { value: 'transactions', label: 'Giao dịch' }, { value: 'payments', label: 'Nạp tiền' }, { value: 'withdrawals', label: 'Yêu cầu rút tiền' }];

export function FinancePage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const tab = tabs.find(t => t.value === params.get('tab'))?.value ?? 'wallets';
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<AdminWallet | null>(null);
  const [walletDetail, setWalletDetail] = useState<AdminWallet | null>(null);
  const [detail, setDetail] = useState<AdminWalletTransaction | AdminPayment | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);
  const request = useRef({ fingerprint: '', key: '' });
  const query = useQuery<FinanceResult<Row>>({
    queryKey: ['finance', tab, page, keyword, status],
    queryFn: () => tab === 'wallets' ? getAdminWallets(page, keyword) : tab === 'transactions' ? getAdminWalletTransactions(page, keyword) : tab === 'payments' ? getAdminPayments(page, keyword) : getAdminWithdrawals(page, keyword, status),
  });
  const rows = query.data?.data ?? [];
  const parsedAmount = /^-?\d+$/.test(amount.trim()) ? Number(amount) : NaN;
  const validAdjustment = isSafeVnd(parsedAmount) && parsedAmount !== 0 && Boolean(reason.trim()) && (!selected || selected.availableBalance + parsedAmount >= 0);
  const adjust = async () => {
    if (!selected || !validAdjustment || lock.current) return;
    lock.current = true; setSubmitting(true);
    const fingerprint = JSON.stringify([selected.userId, parsedAmount, reason.trim()]);
    if (request.current.fingerprint !== fingerprint) request.current = { fingerprint, key: 'admin-adjust:' + crypto.randomUUID() };
    try {
      await adjustAdminWallet(selected.userId, parsedAmount, reason.trim(), request.current.key);
      toast.success('Đã điều chỉnh số dư'); setSelected(null); setAmount(''); setReason('');
      await client.invalidateQueries({ queryKey: ['finance'] });
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { lock.current = false; setSubmitting(false); }
  };
  return <section className="finance-page">
    <PageHeader title="Tài chính" description="Quản lý số dư, đối soát giao dịch và xử lý yêu cầu rút tiền." />
    {tab === 'withdrawals' && <WithdrawalFeeSettings />}
    <div className="finance-toolbar"><div className="finance-tabs" role="tablist" aria-label="Nhóm tài chính">{tabs.map(t => <button type="button" role="tab" aria-selected={tab === t.value} className={tab === t.value ? 'active' : ''} key={t.value} onClick={() => { setParams({ tab: t.value }); setPage(1); setKeyword(''); setStatus(''); }}>{t.label}</button>)}</div><input aria-label="Tìm tài chính" placeholder="Tìm người dùng hoặc mã giao dịch" value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} />{tab === 'withdrawals' && <select aria-label="Lọc trạng thái rút tiền" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option>{withdrawalLabels.map((label, i) => <option value={i} key={label}>{label}</option>)}</select>}</div>
    {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <div className="table-wrap finance-table"><table><thead>{tab === 'wallets' ? <tr><th>Người dùng</th><th>Khả dụng</th><th>Tạm giữ</th><th>Trạng thái</th><th>Thao tác</th></tr> : tab === 'withdrawals' ? <tr><th>Yêu cầu</th><th>Người yêu cầu</th><th>Cần chuyển</th><th>Tài khoản nhận</th><th>Trạng thái</th><th>Chi tiết</th></tr> : <tr><th>{tab === 'payments' ? 'Lệnh nạp tiền' : 'Giao dịch'}</th><th>Người dùng</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th><th>Chi tiết</th></tr>}</thead><tbody>
      {query.isLoading ? <tr><td colSpan={6}>Đang tải dữ liệu…</td></tr> : !rows.length ? <tr><td colSpan={6}>Không có dữ liệu phù hợp.</td></tr> : tab === 'wallets' ? (rows as AdminWallet[]).map(w => <tr key={w.id}><td><Link to={'/users/' + w.userId}><strong>{w.displayName || 'Người dùng'}</strong></Link></td><td className="finance-money">{formatVnd(w.availableBalance)}</td><td>{formatVnd(w.heldBalance)}</td><td><span className={'status-badge ' + (w.status === 0 ? 'active' : 'rejected')}>{['Hoạt động', 'Tạm khóa', 'Đã đóng'][w.status] ?? 'Chưa xác định'}</span></td><td><div className="row-actions"><button className="btn" type="button" onClick={() => setWalletDetail(w)}>Xem chi tiết</button><button className="btn" type="button" disabled={w.status !== 0} onClick={() => { setSelected(w); setAmount(''); setReason(''); }}>Điều chỉnh</button></div></td></tr>) : tab === 'withdrawals' ? (rows as AdminWithdrawal[]).map(w => <tr key={w.id}><td><strong>{w.transactionCode}</strong><small>{formatDate(w.createdAt)}</small></td><td>{w.displayName || 'Người dùng'}</td><td className="finance-money">{formatVnd(w.netAmount)}<small>Khấu trừ {formatVnd(w.amount)} · Phí {formatVnd(w.fee)}</small></td><td>{w.bankName}<small>{w.bankAccountMasked} · {w.bankAccountHolderName}</small></td><td><span className={'status-badge ' + withdrawalTone(w.status)}>{withdrawalLabels[w.status] ?? 'Chưa xác định'}</span></td><td><Link className="btn" to={'/finance/withdrawals/' + w.id}>Xem chi tiết</Link></td></tr>) : tab === 'transactions' ? (rows as AdminWalletTransaction[]).map(t => <tr key={t.id}><td><strong>{transactionLabels[t.type] ?? 'Giao dịch'}</strong><small>{t.description || 'Chưa có mô tả'}</small></td><td>{t.displayName}</td><td className={(t.coinAmount ?? t.amount) >= 0 ? 'finance-in' : 'finance-out'}>{t.coinAmount != null ? formatAnktCoin(t.coinAmount) : formatVnd(t.amount)}</td><td>{ledgerLabels[t.status] ?? 'Chưa xác định'}</td><td>{formatDate(t.createdAt)}</td><td><button className="btn" type="button" onClick={() => setDetail(t)}>Xem chi tiết</button></td></tr>) : (rows as AdminPayment[]).map(p => <tr key={p.id}><td><strong>{p.providerOrderCode}</strong><small>{p.provider}</small></td><td>{p.displayName}</td><td className="finance-money">{formatVnd(p.amount)}</td><td><span className={'status-badge ' + (p.status === 1 ? 'active' : p.status === 0 ? 'pending' : 'rejected')}>{paymentLabels[p.status] ?? 'Chưa xác định'}</span></td><td>{formatDate(p.createdAt)}</td><td><button className="btn" type="button" onClick={() => setDetail(p)}>Xem chi tiết</button></td></tr>)}
    </tbody></table></div>}
    <div className="pagination"><button className="btn" type="button" disabled={page <= 1 || query.isFetching} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page} / {Math.max(query.data?.totalPages ?? 1, 1)}</span><button className="btn" type="button" disabled={page >= (query.data?.totalPages ?? 1) || query.isFetching} onClick={() => setPage(p => p + 1)}>Sau</button></div>
    {selected && <ModalFrame titleId="adjust-title" className="modal finance-adjustment" busy={submitting} onClose={() => setSelected(null)}><h2 id="adjust-title">Xác nhận điều chỉnh số dư</h2><p>{selected.displayName}</p><p>Khả dụng hiện tại: {formatVnd(selected.availableBalance)}</p><label>Số tiền (+ cộng / − trừ)<input autoFocus disabled={submitting} inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} /></label><label>Lý do bắt buộc<textarea disabled={submitting} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label><p>Số dư sau điều chỉnh: {validAdjustment ? formatVnd(selected.availableBalance + parsedAmount) : '—'}</p><div className="row-actions"><button className="btn" disabled={submitting} type="button" onClick={() => setSelected(null)}>Hủy</button><button className="btn primary" disabled={!validAdjustment || submitting} type="button" onClick={() => void adjust()}>{submitting ? 'Đang xử lý…' : 'Xác nhận điều chỉnh'}</button></div></ModalFrame>}
    {walletDetail && <ModalFrame titleId="wallet-detail-title" className="modal financial-record-detail" onClose={() => setWalletDetail(null)}><h2 id="wallet-detail-title">Chi tiết ví</h2><Link to={'/users/' + walletDetail.userId}>{walletDetail.displayName || 'Người dùng'}</Link><p className="financial-record-amount">{formatVnd(walletDetail.availableBalance)}</p><dl className="financial-facts"><div><dt>Khả dụng</dt><dd>{formatVnd(walletDetail.availableBalance)}</dd></div><div><dt>Đang giữ</dt><dd>{formatVnd(walletDetail.heldBalance)}</dd></div><div><dt>ANKT coin · quản lý riêng</dt><dd>{formatAnktCoin(walletDetail.anktCoinBalance)}</dd></div><div><dt>Trạng thái</dt><dd>{['Hoạt động', 'Tạm khóa', 'Đã đóng'][walletDetail.status] ?? 'Chưa xác định'}</dd></div><div><dt>Cập nhật</dt><dd>{formatDate(walletDetail.updatedAt)}</dd></div></dl><TechnicalDetails values={{ 'Mã ví': walletDetail.id, 'Mã người dùng': walletDetail.userId }} /><button autoFocus type="button" className="btn" onClick={() => setWalletDetail(null)}>Đóng</button></ModalFrame>}
    {detail && <ModalFrame titleId="record-title" className="modal financial-record-detail" onClose={() => setDetail(null)}><h2 id="record-title">{'type' in detail ? transactionLabels[detail.type] ?? 'Chi tiết giao dịch' : 'Chi tiết nạp tiền'}</h2><p className="financial-record-amount">{'coinAmount' in detail && detail.coinAmount != null ? formatAnktCoin(detail.coinAmount) : formatVnd(detail.amount)}</p><p>{detail.displayName}</p><dl className="financial-facts"><div><dt>Trạng thái</dt><dd>{('type' in detail ? ledgerLabels : paymentLabels)[detail.status] ?? 'Chưa xác định'}</dd></div><div><dt>Thời gian</dt><dd>{formatDate(detail.createdAt)}</dd></div>{'description' in detail && <div><dt>Nội dung</dt><dd>{detail.description || 'Chưa có mô tả'}</dd></div>}{'balanceBefore' in detail && <><div><dt>Khả dụng trước / sau</dt><dd>{formatVnd(detail.balanceBefore)} / {formatVnd(detail.balanceAfter)}</dd></div><div><dt>Tạm giữ trước / sau</dt><dd>{formatVnd(detail.heldBefore)} / {formatVnd(detail.heldAfter)}</dd></div></>}{'adjustmentReason' in detail && detail.adjustmentReason && <div><dt>Lý do điều chỉnh</dt><dd>{detail.adjustmentReason}</dd></div>}{'paidAt' in detail && <div><dt>Thời điểm thanh toán</dt><dd>{detail.paidAt ? formatDate(detail.paidAt) : 'Chưa ghi nhận'}</dd></div>}</dl>{'referenceType' in detail && detail.referenceType === 'Withdrawal' && <Link className="btn" onClick={() => setDetail(null)} to={'/finance/withdrawals/' + detail.referenceId}>Mở yêu cầu rút tiền</Link>}<TechnicalDetails values={{ 'Mã giao dịch': detail.id, 'Mã người dùng': detail.userId, ...('referenceId' in detail ? { 'Mã tham chiếu': detail.referenceId, 'Mã ví': detail.walletId, 'Người điều chỉnh': detail.adminId } : { 'Mã nhà cung cấp': detail.providerTransactionId }) }} /><button autoFocus className="btn" type="button" onClick={() => setDetail(null)}>Đóng</button></ModalFrame>}
  </section>;
}

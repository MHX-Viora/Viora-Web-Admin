import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adjustAdminWallet, getAdminPayments, getAdminWalletTransactions, getAdminWallets } from '../services/admin-finance.service';
import { getErrorMessage } from '../services/http';
import type { AdminPayment, AdminWallet, AdminWalletTransaction, FinancePage as FinancePageResult } from '../types/finance';

type Tab = 'wallets' | 'transactions' | 'payments';
type FinanceRow = AdminWallet | AdminWalletTransaction | AdminPayment;
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
const paymentStatus = ['Đang chờ', 'Đã thanh toán', 'Thất bại', 'Đã hủy', 'Hết hạn'];
const transactionType = ['Nạp tiền', 'Nhận tiền', 'Chuyển tiền', 'Thanh toán', 'Tạm giữ', 'Hoàn tạm giữ', 'Hoàn tiền', 'Rút tiền', 'Điều chỉnh', 'Khấu trừ tạm giữ'];

export function FinancePage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>('wallets');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<AdminWallet | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const query = useQuery<FinancePageResult<FinanceRow>>({
    queryKey: ['finance', tab, page, keyword],
    queryFn: async () => tab === 'wallets' ? getAdminWallets(page, keyword) : tab === 'transactions' ? getAdminWalletTransactions(page, keyword) : getAdminPayments(page, keyword),
  });
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const selectTab = (value: Tab) => { setTab(value); setPage(1); };
  const adjust = async () => {
    if (!selected || !Number(amount) || !reason.trim()) return;
    try {
      await adjustAdminWallet(selected.userId, Number(amount), reason.trim());
      toast.success('Đã tạo giao dịch điều chỉnh'); setSelected(null); setAmount(''); setReason('');
      await client.invalidateQueries({ queryKey: ['finance'] });
    } catch (error) { toast.error(getErrorMessage(error)); }
  };

  return <section className="finance-page">
    <div className="page-header"><div><h1>Tài chính</h1><p>Tra cứu ví, giao dịch và payment. Mọi điều chỉnh đều tạo ledger để audit.</p></div></div>
    <div className="finance-toolbar">
      <div className="finance-tabs" role="tablist">{(['wallets', 'transactions', 'payments'] as const).map((value) => <button aria-selected={tab === value} className={tab === value ? 'active' : ''} key={value} onClick={() => selectTab(value)} role="tab" type="button">{value === 'wallets' ? 'Ví' : value === 'transactions' ? 'Giao dịch' : 'Payments'}</button>)}</div>
      <input aria-label="Tìm tài chính" onChange={(event) => { setKeyword(event.target.value); setPage(1); }} placeholder="Mã giao dịch, user, reference…" value={keyword} />
    </div>
    <div className="table-wrap finance-table"><table><thead>{tab === 'wallets' ? <tr><th>Người dùng</th><th>Khả dụng</th><th>Tạm giữ</th><th>Trạng thái</th><th /></tr> : tab === 'transactions' ? <tr><th>Giao dịch</th><th>Người dùng</th><th>Loại</th><th>Số tiền</th><th>Reference</th><th>Thời gian</th></tr> : <tr><th>Payment</th><th>Người dùng</th><th>Số tiền</th><th>Provider</th><th>Trạng thái</th><th>Thời gian</th></tr>}</thead><tbody>
      {query.isLoading ? <tr><td colSpan={6}>Đang tải dữ liệu tài chính…</td></tr> : rows.length === 0 ? <tr><td colSpan={6}>Không có dữ liệu phù hợp.</td></tr> : tab === 'wallets' ? (rows as AdminWallet[]).map((item) => <tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.userId}</small></td><td className="finance-money">{money(item.availableBalance)}</td><td>{money(item.heldBalance)}</td><td><span className="status-badge active">{item.status === 0 ? 'Hoạt động' : 'Tạm khóa'}</span></td><td><button className="btn" onClick={() => setSelected(item)} type="button">Điều chỉnh</button></td></tr>) : tab === 'transactions' ? (rows as AdminWalletTransaction[]).map((item) => <tr key={item.id}><td><strong>{item.id}</strong><small>{item.description || '—'}</small></td><td>{item.displayName}</td><td>{transactionType[item.type] ?? item.type}</td><td className={item.amount >= 0 ? 'finance-in' : 'finance-out'}>{money(item.amount)}</td><td>{item.referenceType}<small>{item.referenceId}</small></td><td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td></tr>) : (rows as AdminPayment[]).map((item) => <tr key={item.id}><td><strong>{item.providerOrderCode}</strong><small>{item.providerTransactionId || item.id}</small></td><td>{item.displayName}</td><td className="finance-money">{money(item.amount)}</td><td>{item.provider}</td><td><span className={`status-badge ${item.status === 1 ? 'active' : item.status === 0 ? 'pending' : 'rejected'}`}>{paymentStatus[item.status] ?? item.status}</span></td><td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td></tr>)}
    </tbody></table></div>
    <div className="pagination"><button className="btn" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Trước</button><span>Trang {page} / {Math.max(query.data?.totalPages ?? 1, 1)}</span><button className="btn" disabled={page >= (query.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} type="button">Sau</button></div>
    {selected && <div className="modal-backdrop" role="presentation"><div aria-modal="true" className="modal finance-adjustment" role="dialog"><h2>Điều chỉnh số dư</h2><p>{selected.displayName} · {money(selected.availableBalance)}</p><label>Số tiền (+ cộng / - trừ)<input inputMode="numeric" onChange={(event) => setAmount(event.target.value)} value={amount} /></label><label>Lý do bắt buộc<textarea maxLength={500} onChange={(event) => setReason(event.target.value)} value={reason} /></label><div className="row-actions"><button className="btn" onClick={() => setSelected(null)} type="button">Hủy</button><button className="btn primary" disabled={!Number(amount) || !reason.trim()} onClick={() => void adjust()} type="button">Xác nhận điều chỉnh</button></div></div></div>}
  </section>;
}

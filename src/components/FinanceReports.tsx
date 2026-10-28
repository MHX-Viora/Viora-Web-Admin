import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { ErrorView, Loading } from './common';
import { exportFinanceRevenue, getFinanceOverview, getFinanceReconciliation, getFinanceRevenue } from '../services/admin-finance.service';
import { getErrorMessage } from '../services/http';
import type { FinanceDailyRevenue, RevenueSource } from '../types/finance';
import { defaultFinancePeriod, groupRevenue, reconciliationLabels, revenueLabels, validFinancePeriod } from '../utils/finance-reporting';
import { formatVnd } from '../utils/money';

export type FinanceReportTab = 'overview' | 'revenue' | 'reconciliation';
const financeDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));

function Pagination({ page, totalPages, totalItems, busy, onChange }: { page: number; totalPages: number; totalItems: number; busy: boolean; onChange: (page: number) => void }) {
  return <div className="pagination"><button className="btn" type="button" disabled={page <= 1 || busy} onClick={() => onChange(page - 1)}>Trước</button><span>Trang {page} / {Math.max(1, totalPages)} · {totalItems} bản ghi</span><button className="btn" type="button" disabled={page >= totalPages || busy} onClick={() => onChange(page + 1)}>Sau</button></div>;
}

function RevenueTrend({ daily, monthly }: { daily: FinanceDailyRevenue[]; monthly: boolean }) {
  const rows = groupRevenue(daily, monthly);
  const max = Math.max(1, ...rows.map(x => Math.abs(x.totalRevenue)));
  return <section className="finance-report-panel"><h2>Doanh thu theo {monthly ? 'tháng' : 'ngày'}</h2>
    {!rows.some(x => x.totalRevenue !== 0) ? <p className="finance-note">Chưa ghi nhận doanh thu trong khoảng thời gian này.</p> : <div className="finance-chart-scroll"><svg className="finance-chart" role="img" aria-label={`Biểu đồ doanh thu theo ${monthly ? 'tháng' : 'ngày'}. Số liệu chi tiết trong bảng bên dưới.`} viewBox={`0 0 ${Math.max(rows.length * 42, 420)} 180`} style={{ minWidth: Math.max(rows.length * 42, 420) }}>
      <line x1="0" x2={Math.max(rows.length * 42, 420)} y1="135" y2="135" stroke="currentColor" opacity=".2" />
      {rows.map((row, index) => <g key={row.date}><title>{row.date}: {formatVnd(row.totalRevenue)}</title><rect x={index * 42 + 8} y={row.totalRevenue >= 0 ? 135 - row.totalRevenue / max * 110 : 135} width="26" height={Math.abs(row.totalRevenue) / max * (row.totalRevenue >= 0 ? 110 : 20)} rx="3" fill={row.totalRevenue < 0 ? 'var(--danger)' : 'var(--primary)'} /><text x={index * 42 + 21} y="174" textAnchor="middle" fill="currentColor" fontSize="10">{monthly ? row.date.slice(5) + '/' + row.date.slice(2, 4) : row.date.slice(8) + '/' + row.date.slice(5, 7)}</text></g>)}
    </svg></div>}
    <details className="finance-trend-data"><summary>Xem số liệu biểu đồ</summary><div className="table-wrap"><table><thead><tr><th>{monthly ? 'Tháng' : 'Ngày'}</th><th>Quảng cáo</th><th>Phí rút</th><th>Tổng doanh thu</th></tr></thead><tbody>{rows.map(x => <tr key={x.date}><td>{x.date}</td><td>{formatVnd(x.advertisingRevenue)}</td><td>{formatVnd(x.withdrawalFeeRevenue)}</td><td>{formatVnd(x.totalRevenue)}</td></tr>)}</tbody></table></div></details>
  </section>;
}

export function FinanceReports({ tab }: { tab: FinanceReportTab }) {
  const [params, setParams] = useSearchParams();
  const defaults = defaultFinancePeriod();
  const from = params.get('from') ?? defaults.from;
  const to = params.get('to') ?? defaults.to;
  const source: RevenueSource = params.get('source') === 'advertising' ? 'advertising' : params.get('source') === 'withdrawal_fee' ? 'withdrawal_fee' : '';
  const page = Math.max(1, Math.min(1000000, Math.trunc(Number(params.get('page')) || 1)));
  const monthly = params.get('group') === 'month' || (!params.has('group') && (Date.parse(to) - Date.parse(from)) / 86400000 > 31);
  const valid = validFinancePeriod(from, to);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const exportLock = useRef(false);
  const change = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) { if (value) next.set(key, value); else next.delete(key); }
    setParams(next);
    setExportError('');
  };
  const overview = useQuery({ queryKey: ['finance', 'overview', from, to], queryFn: () => getFinanceOverview(from, to), enabled: tab !== 'reconciliation' && valid });
  const revenue = useQuery({ queryKey: ['finance', 'revenue', from, to, source, page], queryFn: () => getFinanceRevenue(from, to, source, page), enabled: tab === 'revenue' && valid });
  const reconciliation = useQuery({ queryKey: ['finance', 'reconciliation', page], queryFn: () => getFinanceReconciliation(page), enabled: tab === 'reconciliation', staleTime: 0 });
  const refresh = () => { if (tab === 'reconciliation') void reconciliation.refetch(); else { void overview.refetch(); if (tab === 'revenue') void revenue.refetch(); } };
  const download = async () => {
    if (exportLock.current) return;
    exportLock.current = true; setExporting(true); setExportError('');
    try { await exportFinanceRevenue(from, to, source); }
    catch (error) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: unknown } }).response;
        if (response?.data instanceof Blob) {
          try { response.data = JSON.parse(await response.data.text()); } catch { /* Preserve transport error if response is not JSON. */ }
        }
      }
      setExportError(getErrorMessage(error));
    } finally { exportLock.current = false; setExporting(false); }
  };
  const busy = overview.isFetching || revenue.isFetching || reconciliation.isFetching;
  if (tab === 'reconciliation') return <div className="finance-reports">
    <div className="finance-section-heading"><div><h2>Đối soát nội bộ</h2><p>Kiểm tra số dư ví, bút toán nạp/rút và chi quảng cáo tại thời điểm hiện tại.</p></div><button type="button" className="btn" disabled={busy} onClick={refresh}><RefreshCw size={16} /> Kiểm tra lại</button></div>
    <p className="finance-note">Đối soát này chưa xác minh sao kê ngân hàng hoặc trạng thái mới nhất từ payOS. Mở giao dịch liên quan để kiểm tra; hệ thống không tự điều chỉnh tiền.</p>
    {reconciliation.isLoading ? <Loading /> : reconciliation.isError ? <ErrorView message={getErrorMessage(reconciliation.error)} onRetry={refresh} /> : <>
      <p className={'finance-reconciliation-status ' + (reconciliation.data?.totalItems ? 'has-issues' : '')} role="status">{reconciliation.data?.totalItems ? `${reconciliation.data.totalItems} điểm cần kiểm tra` : 'Chưa phát hiện chênh lệch qua các kiểm tra nội bộ.'}</p>
      {!!reconciliation.data?.data.length && <div className="table-wrap finance-table"><table><thead><tr><th>Vấn đề</th><th>Người dùng</th><th>Kỳ vọng</th><th>Ghi nhận</th><th>Kiểm tra</th></tr></thead><tbody>{reconciliation.data.data.map(x => <tr key={x.code + x.id}><td><strong>{reconciliationLabels[x.code] ?? 'Cần kiểm tra giao dịch'}</strong><small>Kiểm tra lúc {financeDate(x.detectedAt)}</small></td><td>{x.displayName}</td><td>{formatVnd(x.expectedAmount)}</td><td>{formatVnd(x.actualAmount)}</td><td><Link className="btn" to={x.referenceType === 'Withdrawal' ? `/finance/withdrawals/${x.referenceId}` : `/finance?tab=${x.referenceType === 'Wallet' ? 'wallets' : x.referenceType === 'Payment' ? 'payments' : 'transactions'}&keyword=${encodeURIComponent(x.referenceId)}`}>Mở dữ liệu liên quan</Link><details><summary>Mã tham chiếu</summary><code>{x.referenceId}</code></details></td></tr>)}</tbody></table></div>}
      <Pagination page={page} totalPages={reconciliation.data?.totalPages ?? 0} totalItems={reconciliation.data?.totalItems ?? 0} busy={busy} onChange={p => change({ page: String(p) })} />
    </>}
  </div>;

  const data = overview.data;
  const selectedTotal = data ? source === 'advertising' ? data.advertisingRevenue : source === 'withdrawal_fee' ? data.withdrawalFeeRevenue : data.totalRevenue : 0;
  const trend = (data?.daily ?? []).map(x => ({ ...x, advertisingRevenue: source === 'withdrawal_fee' ? 0 : x.advertisingRevenue, withdrawalFeeRevenue: source === 'advertising' ? 0 : x.withdrawalFeeRevenue, totalRevenue: source === 'advertising' ? x.advertisingRevenue : source === 'withdrawal_fee' ? x.withdrawalFeeRevenue : x.totalRevenue }));
  return <div className="finance-reports">
    <div className="finance-report-filters"><label>Từ ngày<input type="date" value={from} onChange={e => change({ from: e.target.value, page: '1' })} /></label><label>Đến ngày<input type="date" value={to} onChange={e => change({ to: e.target.value, page: '1' })} /></label><button className="btn" type="button" onClick={() => change({ ...defaults, page: '1' })}>Tháng này</button>
      {tab === 'revenue' && <label>Nguồn thu<select value={source} onChange={e => change({ source: e.target.value, page: '1' })}><option value="">Tất cả nguồn thu</option><option value="advertising">Quảng cáo</option><option value="withdrawal_fee">Phí rút tiền</option></select></label>}
      <label>Thống kê theo<select value={monthly ? 'month' : 'day'} onChange={e => change({ group: e.target.value })}><option value="day">Ngày</option><option value="month">Tháng</option></select></label>
      <button className="btn" type="button" disabled={!valid || busy} onClick={refresh}><RefreshCw size={16} /> Làm mới</button>
      {tab === 'revenue' && <button className="btn primary" type="button" disabled={!valid || exporting || revenue.isError || revenue.isLoading} onClick={() => void download()}><Download size={16} /> {exporting ? 'Đang xuất…' : 'Xuất CSV'}</button>}
    </div>
    {!valid && <p className="error-panel" role="alert">Chọn đủ ngày bắt đầu và kết thúc, theo thứ tự, tối đa 366 ngày.</p>}
    {exportError && <p className="error-panel" role="alert">{exportError}</p>}
    <p className="finance-note">Ngày báo cáo theo giờ Việt Nam (UTC+7). Doanh thu gồm phí rút hoàn tất và chi quảng cáo đã sử dụng, sau hoàn tiền quảng cáo.</p>
    {valid && (overview.isLoading ? <Loading /> : overview.isError ? <ErrorView message={getErrorMessage(overview.error)} onRetry={refresh} /> : data && <>
      <div className="finance-section-heading"><div><h2>{tab === 'overview' ? 'Kết quả trong kỳ' : 'Doanh thu theo bộ lọc'}</h2><p>{from} — {to}</p></div><span className="finance-note">Cập nhật {financeDate(data.generatedAt)}</span></div>
      <div className="finance-metrics"><article className="finance-metric finance-metric-primary"><span>{tab === 'overview' ? 'Tổng doanh thu' : source ? revenueLabels[source] : 'Tổng doanh thu'}</span><strong>{formatVnd(tab === 'overview' ? data.totalRevenue : selectedTotal)}</strong><small>Đã ghi nhận trong kỳ</small></article>
        {tab === 'overview' && <><article className="finance-metric"><span>Doanh thu quảng cáo</span><strong>{formatVnd(data.advertisingRevenue)}</strong><small>Chi thực tế, sau hoàn tiền</small></article><article className="finance-metric"><span>Phí rút tiền</span><strong>{formatVnd(data.withdrawalFeeRevenue)}</strong><small>Yêu cầu đã hoàn tất</small></article></>}
      </div>
      {tab === 'overview' && <><div className="finance-flow-summary"><div><span>Tiền nạp thành công trong kỳ</span><strong>{formatVnd(data.depositedAmount)}</strong></div><div><span>Tiền rút thực trả trong kỳ</span><strong>{formatVnd(data.withdrawnNetAmount)}</strong></div></div><p className="finance-note">Tiền nạp và số dư ví được theo dõi riêng với doanh thu.</p>
        <section className="finance-report-panel"><div className="finance-section-heading"><div><h2>Số dư và yêu cầu hiện tại</h2><p>Toàn hệ thống tại thời điểm cập nhật, không giới hạn theo kỳ báo cáo.</p></div><Link className="btn" to="/finance?tab=withdrawals">Quản lý yêu cầu rút</Link></div><div className="finance-current-balances"><div><span>Ví khả dụng</span><strong>{formatVnd(data.availableBalance)}</strong></div><div><span>Ví đang giữ</span><strong>{formatVnd(data.heldBalance)}</strong></div><div><span>Tiền giữ cho yêu cầu rút</span><strong>{formatVnd(data.outstandingWithdrawalAmount)}</strong></div></div><div className="finance-queue"><Link to="/finance?tab=withdrawals&status=0"><strong>{data.pendingWithdrawals}</strong> yêu cầu chờ duyệt →</Link><Link to="/finance?tab=withdrawals&status=1"><strong>{data.processingWithdrawals}</strong> yêu cầu đang chuyển tiền →</Link></div></section></>}
      <RevenueTrend daily={tab === 'overview' ? data.daily : trend} monthly={monthly} />
    </>)}
    {tab === 'revenue' && valid && <section className="finance-report-panel"><h2>Chi tiết nguồn thu</h2><p className="finance-note">Mỗi dòng liên kết với giao dịch gốc. Số âm là khoản hoàn tiền đã giảm doanh thu. CSV xuất toàn bộ kết quả lọc, tối đa 10.000 dòng.</p>
      {revenue.isLoading ? <Loading /> : revenue.isError ? <ErrorView message={getErrorMessage(revenue.error)} onRetry={() => void revenue.refetch()} /> : <><div className="table-wrap finance-table"><table><thead><tr><th>Thời gian ghi nhận</th><th>Nguồn thu</th><th>Người dùng</th><th>Doanh thu</th><th>Giao dịch gốc</th></tr></thead><tbody>{!revenue.data?.data.length ? <tr><td colSpan={5}>Chưa có doanh thu phù hợp.</td></tr> : revenue.data.data.map(x => <tr key={x.source + x.id}><td>{financeDate(x.occurredAt)}</td><td><strong>{revenueLabels[x.source]}</strong><small>{x.description}</small></td><td><Link to={`/users/${x.userId}`}>{x.displayName || 'Người dùng'}</Link></td><td className={x.amount < 0 ? 'finance-out' : 'finance-in'}>{formatVnd(x.amount)}</td><td><Link className="btn" to={x.source === 'withdrawal_fee' ? `/finance/withdrawals/${x.referenceId}` : `/finance?tab=transactions&keyword=${encodeURIComponent(x.id)}`}>Xem giao dịch</Link><details><summary>Mã tham chiếu</summary><code>{x.referenceId}</code></details></td></tr>)}</tbody></table></div><Pagination page={page} totalPages={revenue.data?.totalPages ?? 0} totalItems={revenue.data?.totalItems ?? 0} busy={busy} onChange={p => change({ page: String(p) })} /></>}
    </section>}
  </div>;
}

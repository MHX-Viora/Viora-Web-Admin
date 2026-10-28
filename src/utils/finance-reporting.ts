import type { FinanceDailyRevenue } from '../types/finance';

export function defaultFinancePeriod(now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return { from: today.slice(0, 7) + '-01', to: today };
}

export function validFinancePeriod(from: string, to: string) {
  const parse = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
  if (!parse(from) || !parse(to)) return false;
  const days = (Date.parse(to) - Date.parse(from)) / 86400000;
  return days >= 0 && days < 366;
}

export function groupRevenue(daily: FinanceDailyRevenue[], monthly: boolean): FinanceDailyRevenue[] {
  const groups = new Map<string, FinanceDailyRevenue>();
  for (const day of daily) {
    const date = monthly ? day.date.slice(0, 7) : day.date;
    const row = groups.get(date) ?? { date, advertisingRevenue: 0, withdrawalFeeRevenue: 0, totalRevenue: 0 };
    row.advertisingRevenue += day.advertisingRevenue;
    row.withdrawalFeeRevenue += day.withdrawalFeeRevenue;
    row.totalRevenue += day.totalRevenue;
    groups.set(date, row);
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export const revenueLabels = { advertising: 'Quảng cáo', withdrawal_fee: 'Phí rút tiền' };
export const reconciliationLabels: Record<string, string> = {
  WALLET_BALANCE_MISMATCH: 'Số dư ví khác sổ giao dịch',
  WALLET_HELD_MISMATCH: 'Số tiền đang giữ khác sổ giao dịch',
  PAID_DEPOSIT_UNCREDITED: 'Nạp thành công chưa có bút toán cộng ví khớp',
  WITHDRAWAL_SETTLEMENT_MISMATCH: 'Rút hoàn tất chưa khớp quyết toán',
  WITHDRAWAL_RESERVATION_MISMATCH: 'Yêu cầu rút chưa khớp giữ tiền',
  ADVERTISEMENT_SPEND_MISMATCH: 'Chi quảng cáo chưa khớp số tiền đã trừ',
};

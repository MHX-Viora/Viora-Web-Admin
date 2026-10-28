import { apiClient } from './http';
import type { AdminPayment, AdminWallet, AdminWalletTransaction, FinancePage, AdminWithdrawal, AdminWithdrawalDetail, FinanceFilters, FinanceOverview, RevenueItem, RevenueSource, ReconciliationIssue } from '../types/finance';

export type WithdrawalFeeSettings = { feePercent: number; version: number; updatedAt: string; updatedBy: string | null };
export const getWithdrawalFeeSettings = async () => (await apiClient.get<WithdrawalFeeSettings>('/api/admin/finance/withdrawal-fee-settings')).data;
export const updateWithdrawalFeeSettings = async (feePercent: number, expectedVersion: number) =>
  (await apiClient.put<WithdrawalFeeSettings>('/api/admin/finance/withdrawal-fee-settings', { feePercent, expectedVersion })).data;

const list = async <T>(resource: string, page: number, keyword: string, filters?: FinanceFilters) =>
  (await apiClient.get<FinancePage<T>>(`/api/admin/finance/${resource}`, { params: { page, pageSize: 20, keyword: keyword || undefined, ...filters } })).data;

export const getAdminWallets = (page: number, keyword: string) => list<AdminWallet>('wallets', page, keyword);
export const getAdminWalletTransactions = (page: number, keyword: string, filters?: FinanceFilters) => list<AdminWalletTransaction>('transactions', page, keyword, filters);
export const getAdminPayments = (page: number, keyword: string, filters?: FinanceFilters) => list<AdminPayment>('payments', page, keyword, filters);
export const adjustAdminWallet = async (userId: string, amount: number, reason: string, idempotencyKey: string) =>
  (await apiClient.post(`/api/admin/finance/wallets/${userId}/adjustments`, {
    amount,
    reason,
    idempotencyKey,
  })).data;

export const getAdminWithdrawals = async (page: number, keyword: string, status: string, filters?: FinanceFilters) =>
  (await apiClient.get<FinancePage<AdminWithdrawal>>('/api/admin/finance/withdrawals', { params: { page, pageSize: 20, keyword: keyword || undefined, ...filters, status: status || undefined } })).data;
export const getAdminWithdrawalDetail = async (id: string) => (await apiClient.get<AdminWithdrawalDetail>(`/api/admin/finance/withdrawals/${encodeURIComponent(id)}`)).data;
export const changeAdminWithdrawalStatus = async (id: string, status: number, reason?: string) =>
  (await apiClient.patch<AdminWithdrawal>(`/api/admin/finance/withdrawals/${encodeURIComponent(id)}/status`, { status, reason })).data;

export const getFinanceOverview = async (from: string, to: string) =>
  (await apiClient.get<FinanceOverview>('/api/admin/finance/overview', { params: { from, to } })).data;
export const getFinanceRevenue = async (from: string, to: string, source: RevenueSource, page: number) =>
  (await apiClient.get<FinancePage<RevenueItem>>('/api/admin/finance/revenue', { params: { from, to, source: source || undefined, page, pageSize: 20 } })).data;
export const getFinanceReconciliation = async (page: number) =>
  (await apiClient.get<FinancePage<ReconciliationIssue>>('/api/admin/finance/reconciliation', { params: { page, pageSize: 20 } })).data;
export async function exportFinanceRevenue(from: string, to: string, source: RevenueSource) {
  const response = await apiClient.get<Blob>('/api/admin/finance/revenue/export', { params: { from, to, source: source || undefined }, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url; link.download = `doanh-thu-${from}-${to}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

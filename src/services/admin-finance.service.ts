import { apiClient } from './http';
import type { AdminPayment, AdminWallet, AdminWalletTransaction, FinancePage, AdminWithdrawal, AdminWithdrawalDetail } from '../types/finance';

export type WithdrawalFeeSettings = { feePercent: number; version: number; updatedAt: string; updatedBy: string | null };
export const getWithdrawalFeeSettings = async () => (await apiClient.get<WithdrawalFeeSettings>('/api/admin/finance/withdrawal-fee-settings')).data;
export const updateWithdrawalFeeSettings = async (feePercent: number, expectedVersion: number) =>
  (await apiClient.put<WithdrawalFeeSettings>('/api/admin/finance/withdrawal-fee-settings', { feePercent, expectedVersion })).data;

const list = async <T>(resource: string, page: number, keyword: string) =>
  (await apiClient.get<FinancePage<T>>(`/api/admin/finance/${resource}`, { params: { page, pageSize: 20, keyword: keyword || undefined } })).data;

export const getAdminWallets = (page: number, keyword: string) => list<AdminWallet>('wallets', page, keyword);
export const getAdminWalletTransactions = (page: number, keyword: string) => list<AdminWalletTransaction>('transactions', page, keyword);
export const getAdminPayments = (page: number, keyword: string) => list<AdminPayment>('payments', page, keyword);
export const adjustAdminWallet = async (userId: string, amount: number, reason: string, idempotencyKey: string) =>
  (await apiClient.post(`/api/admin/finance/wallets/${userId}/adjustments`, {
    amount,
    reason,
    idempotencyKey,
  })).data;

export const getAdminWithdrawals = async (page: number, keyword: string, status: string) =>
  (await apiClient.get<FinancePage<AdminWithdrawal>>('/api/admin/finance/withdrawals', { params: { page, pageSize: 20, keyword: keyword || undefined, status: status || undefined } })).data;
export const getAdminWithdrawalDetail = async (id: string) => (await apiClient.get<AdminWithdrawalDetail>(`/api/admin/finance/withdrawals/${encodeURIComponent(id)}`)).data;
export const changeAdminWithdrawalStatus = async (id: string, status: number, reason?: string) =>
  (await apiClient.patch<AdminWithdrawal>(`/api/admin/finance/withdrawals/${encodeURIComponent(id)}/status`, { status, reason })).data;

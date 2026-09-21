import { apiClient } from './http';
import type { AdminPayment, AdminWallet, AdminWalletTransaction, FinancePage } from '../types/finance';

const list = async <T>(resource: string, page: number, keyword: string) =>
  (await apiClient.get<FinancePage<T>>(`/api/admin/finance/${resource}`, { params: { page, pageSize: 20, keyword: keyword || undefined } })).data;

export const getAdminWallets = (page: number, keyword: string) => list<AdminWallet>('wallets', page, keyword);
export const getAdminWalletTransactions = (page: number, keyword: string) => list<AdminWalletTransaction>('transactions', page, keyword);
export const getAdminPayments = (page: number, keyword: string) => list<AdminPayment>('payments', page, keyword);
export const adjustAdminWallet = async (userId: string, amount: number, reason: string) =>
  (await apiClient.post(`/api/admin/finance/wallets/${userId}/adjustments`, {
    amount,
    reason,
    idempotencyKey: `admin-adjust:${Date.now()}:${crypto.randomUUID()}`,
  })).data;

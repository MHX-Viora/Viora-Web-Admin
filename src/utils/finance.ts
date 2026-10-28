export const withdrawalLabels = ['Chờ duyệt', 'Đang chuyển tiền', 'Hoàn tất', 'Thất bại', 'Đã từ chối', 'Đã hủy'];
export const transactionLabels = ['Nạp tiền', 'Nhận tiền', 'Chuyển tiền', 'Thanh toán', 'Tạm giữ', 'Hoàn tạm giữ', 'Hoàn tiền', 'Rút tiền', 'Điều chỉnh', 'Thanh toán từ tạm giữ', 'Tặng quà Live', 'Nhận quà Live'];
export const paymentLabels = ['Chờ thanh toán', 'Đã thanh toán', 'Thất bại', 'Đã hủy', 'Hết hạn'];
export const ledgerLabels = ['Đang xử lý', 'Hoàn thành', 'Thất bại', 'Đã đảo giao dịch'];
export const withdrawalTone = (status: number) => status === 2 ? 'active' : status < 2 ? 'pending' : 'rejected';
export function transactionTitle(transaction: { type: number; referenceType: string }) {
  if (transaction.referenceType === 'Advertisement' || transaction.referenceType === 'AdvertisementEvent') {
    return ({ 4: 'Giữ ngân sách quảng cáo', 5: 'Hoàn ngân sách quảng cáo', 6: 'Hoàn tiền quảng cáo', 9: 'Chi quảng cáo' } as Record<number, string>)[transaction.type] ?? 'Giao dịch quảng cáo';
  }
  if (transaction.referenceType === 'Withdrawal' && transaction.type === 9) return 'Quyết toán rút tiền';
  if (transaction.referenceType === 'Withdrawal' && transaction.type === 5) return 'Hoàn tiền rút';
  return transactionLabels[transaction.type] ?? 'Giao dịch';
}

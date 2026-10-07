export const withdrawalLabels = ['Chờ duyệt', 'Đang chuyển tiền', 'Hoàn tất', 'Thất bại', 'Đã từ chối', 'Đã hủy'];
export const transactionLabels = ['Nạp tiền', 'Nhận tiền', 'Chuyển tiền', 'Thanh toán', 'Tạm giữ', 'Hoàn tạm giữ', 'Hoàn tiền', 'Rút tiền', 'Điều chỉnh', 'Thanh toán từ tạm giữ', 'Tặng quà Live', 'Nhận quà Live'];
export const paymentLabels = ['Chờ thanh toán', 'Đã thanh toán', 'Thất bại', 'Đã hủy', 'Hết hạn'];
export const ledgerLabels = ['Đang xử lý', 'Hoàn thành', 'Thất bại', 'Đã đảo giao dịch'];
export const withdrawalTone = (status: number) => status === 2 ? 'active' : status < 2 ? 'pending' : 'rejected';

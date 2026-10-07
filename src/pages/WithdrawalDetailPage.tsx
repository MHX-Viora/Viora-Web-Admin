import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog, ErrorView, Loading, PageHeader } from '../components/common';
import { TechnicalDetails } from '../components/TechnicalDetails';
import { copyFinancialValue } from '../utils/clipboard';
import { changeAdminWithdrawalStatus, getAdminWithdrawalDetail } from '../services/admin-finance.service';
import { getErrorMessage } from '../services/http';
import { formatVnd } from '../utils/money';
import { formatFeePercent } from '../utils/withdrawal-fee';
import { formatDate } from '../utils/format';
import { withdrawalLabels, withdrawalTone } from '../utils/finance';

export function WithdrawalDetailPage() {
  const { id = '' } = useParams();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['withdrawal-detail', id], queryFn: () => getAdminWithdrawalDetail(id), enabled: Boolean(id), gcTime: 0 });
  const [action, setAction] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [failedQrUrl, setFailedQrUrl] = useState<string | null>(null);
  const locked = useRef(false);
  const mutation = useMutation({
    mutationFn: async () => { if (action === null) throw new Error('Chưa chọn thao tác'); return changeAdminWithdrawalStatus(id, action, reason.trim() || undefined); },
    onSuccess: async () => { setAction(null); setReason(''); toast.success('Đã cập nhật yêu cầu rút tiền'); await Promise.all([query.refetch(), client.invalidateQueries({ queryKey: ['finance'] })]); },
    onError: async (error) => { toast.error(getErrorMessage(error)); await query.refetch(); },
    onSettled: () => { locked.current = false; },
  });
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data) return <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const detail = query.data;
  const w = detail.withdrawal;
  const needsReason = action === 3 || action === 4;
  const confirm = () => { if (locked.current || (needsReason && !reason.trim())) return; locked.current = true; mutation.mutate(); };
  const copy = (label: string, value: string) => <div className="transfer-field"><span>{label}</span><strong>{value}</strong><button className="btn" type="button" onClick={() => void copyFinancialValue(value)}>Sao chép</button></div>;
  return <section className="withdrawal-detail-page"><PageHeader title="Chi tiết yêu cầu rút tiền" description={w.transactionCode} actions={<Link className="btn" to="/finance?tab=withdrawals">Quay lại danh sách</Link>} />
    <div className="withdrawal-hero"><span>Số tiền cần chuyển</span><h2>{formatVnd(w.netAmount)}</h2><span className={`status-badge ${withdrawalTone(w.status)}`}>{withdrawalLabels[w.status] ?? 'Chưa xác định'}</span><p>Khấu trừ từ ví {formatVnd(w.amount)} · Phí {w.feePercent != null && `(${formatFeePercent(w.feePercent)}) `}{formatVnd(w.fee)}</p></div>
    <div className="withdrawal-layout"><div className="withdrawal-main"><section className="user-card"><h2>Người yêu cầu</h2><Link to={`/users/${detail.userId}`}>{detail.displayName || 'Người dùng'}</Link><p>Gửi lúc {formatDate(w.createdAt)}</p></section>
      <section className="user-card"><h2>Thông tin chuyển khoản</h2><p>{w.bankName}</p>{copy('Chủ tài khoản', w.bankAccountHolderName)}{detail.accountNumber ? copy('Số tài khoản', detail.accountNumber) : <p role="alert">Không thể đọc số tài khoản. Cần kiểm tra thông tin trước khi chuyển tiền.</p>}{copy('Số tiền chuyển (VNĐ)', String(w.netAmount))}{copy('Nội dung chuyển khoản', w.transactionCode)}</section>
      <section className="user-card"><h2>Lịch sử xử lý</h2><ol className="financial-timeline">{detail.timeline.map((event, index) => <li key={`${event.at}:${index}`}><strong>{withdrawalLabels[event.status] ?? 'Cập nhật yêu cầu'}</strong><span>{formatDate(event.at)}</span><p>{event.actorName || (event.actorId === detail.userId ? 'Người dùng' : event.actorId ? 'Quản trị viên' : 'Chưa ghi nhận người xử lý')}{event.reason ? ` · ${event.reason}` : ''}</p></li>)}</ol>{w.failureReason && <p className="error-panel">Lý do: {w.failureReason}</p>}</section>
      <TechnicalDetails values={{ 'Mã yêu cầu': w.id, 'Mã người dùng': detail.userId, 'Mã ngân hàng': w.bankCode, 'Mã tài khoản': w.bankAccountId, ...Object.fromEntries(detail.timeline.filter(e => e.actorId).map((e, i) => [`Người xử lý ${i + 1}`, e.actorId])) }} />
    </div><aside className="withdrawal-sidebar"><section className="user-card"><h2>QR chuyển khoản</h2>{detail.qrImageUrl && failedQrUrl !== detail.qrImageUrl ? <img className="transfer-qr" src={detail.qrImageUrl} referrerPolicy="no-referrer" alt={`QR chuyển ${formatVnd(w.netAmount)} về ${w.bankName}`} onError={() => setFailedQrUrl(detail.qrImageUrl)} /> : <><p>{w.status >= 2 ? 'Yêu cầu đã kết thúc.' : w.status === 0 ? 'Duyệt và bắt đầu chuyển để mở QR. Người dùng không thể tự hủy sau bước này.' : 'Không tải được QR. Dùng thông tin chuyển khoản bên cạnh.'}</p>{detail.qrImageUrl && w.status < 2 && <button className="btn" type="button" onClick={() => setFailedQrUrl(null)}>Thử tải lại QR</button>}</>}<p>Kiểm tra tên người nhận, số tiền và nội dung trong ứng dụng ngân hàng trước khi xác nhận.</p></section>
      {w.status < 2 && <section className="user-card"><h2>Xử lý yêu cầu</h2><div className="withdrawal-actions">{w.status === 0 ? <button className="btn primary" disabled={mutation.isPending || !detail.accountNumber || !detail.canTransfer} onClick={() => setAction(1)} type="button">Duyệt và bắt đầu chuyển</button> : <><button className="btn primary" disabled={mutation.isPending || !detail.accountNumber || !detail.canTransfer} onClick={() => setAction(2)} type="button">Xác nhận đã chuyển tiền</button><button className="btn" disabled={mutation.isPending} onClick={() => setAction(3)} type="button">Chuyển tiền thất bại</button></>}<label>Lý do từ chối / thất bại<textarea maxLength={500} value={reason} disabled={mutation.isPending} onChange={e => setReason(e.target.value)} /></label><button className="btn danger" disabled={mutation.isPending || !reason.trim()} onClick={() => setAction(4)} type="button">Từ chối yêu cầu</button><p>Chỉ xác nhận hoàn tất khi giao dịch chuyển tiền đã thành công. Từ chối hoặc thất bại sẽ hoàn lại toàn bộ {formatVnd(w.amount)} vào ví.</p></div></section>}
    </aside></div>
    {action !== null && <ConfirmDialog title={action === 2 ? 'Xác nhận đã chuyển tiền' : 'Xác nhận xử lý yêu cầu'} description={action === 2 ? `Bạn đã chuyển thành công ${formatVnd(w.netAmount)} tới ${w.bankAccountHolderName}, số tài khoản ${detail.accountNumber}? Thao tác này hoàn tất yêu cầu.` : action === 1 ? 'Yêu cầu sẽ chuyển sang trạng thái đang chuyển tiền.' : `Hoàn lại ${formatVnd(w.amount)} vào ví. Lý do: ${reason.trim()}`} loading={mutation.isPending} onCancel={() => setAction(null)} onConfirm={confirm} />}
  </section>;
}

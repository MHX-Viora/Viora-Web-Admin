import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ErrorView, PageHeader, Pagination } from '../components/common';
import { approveAdminAdvertisement, getAdminAdvertisements, rejectAdminAdvertisement } from '../services/admin-advertisement.service';
import { getErrorMessage } from '../services/http';

const statuses = ['Bản nháp', 'Chờ duyệt', 'Đã duyệt', 'Đang chạy', 'Tạm dừng', 'Hoàn tất', 'Từ chối', 'Đã hủy'];
const placements = ['Feed', 'Reels', 'Tin tức'];
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export function AdvertisementsPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<number | undefined>(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const query = useQuery({ queryKey: ['advertisements', page, pageSize, status], queryFn: () => getAdminAdvertisements(page, pageSize, status) });
  const refresh = () => client.invalidateQueries({ queryKey: ['advertisements'] });
  const approve = useMutation({ mutationFn: approveAdminAdvertisement, onSuccess: async () => { toast.success('Đã duyệt quảng cáo'); await refresh(); }, onError: (error) => toast.error(getErrorMessage(error)) });
  const reject = useMutation({ mutationFn: ({ id, reviewReason }: { id: string; reviewReason: string }) => rejectAdminAdvertisement(id, reviewReason), onSuccess: async () => { toast.success('Đã từ chối và hoàn tiền giữ'); setRejectingId(null); setReason(''); await refresh(); }, onError: (error) => toast.error(getErrorMessage(error)) });

  return <section className="users-page">
    <PageHeader title="Kiểm duyệt quảng cáo" description={`Tổng cộng ${query.data?.totalItems ?? 0} chiến dịch`} actions={<button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Refresh</button>} />
    <div className="toolbar"><label>Trạng thái<select value={status ?? ''} onChange={(event) => { setStatus(event.target.value === '' ? undefined : Number(event.target.value)); setPage(1); }}><option value="">Tất cả</option>{statuses.map((label, value) => <option key={label} value={value}>{label}</option>)}</select></label></div>
    {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
    <div className="table-wrap"><table><thead><tr><th>Nội dung</th><th>Nhà quảng cáo</th><th>Vị trí</th><th>Ngân sách</th><th>Lịch chạy</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
      {query.isLoading ? <tr><td colSpan={7}>Đang tải quảng cáo…</td></tr> : !query.data?.items.length ? <tr><td colSpan={7}>Không có quảng cáo phù hợp.</td></tr> : query.data.items.map((item) => <tr key={item.id}><td><strong>{item.content.article?.title || item.content.content || 'Nội dung quảng cáo'}</strong><small>{item.postId}</small></td><td>{item.content.user.displayName}<small>{item.advertiserId}</small></td><td>{placements[item.placement] ?? item.placement}</td><td><strong>{money(item.totalBudget)}</strong><small>Đã chi {money(item.spentAmount)}</small></td><td>{new Date(item.startAt).toLocaleDateString('vi-VN')}<small>đến {new Date(item.endAt).toLocaleDateString('vi-VN')}</small></td><td><span className={`status-badge ${item.status === 3 ? 'active' : item.status === 1 ? 'pending' : item.status === 6 ? 'rejected' : ''}`}>{statuses[item.status] ?? item.status}</span></td><td>{item.status === 1 ? <div className="row-actions"><button className="btn primary" disabled={approve.isPending} onClick={() => approve.mutate(item.id)} type="button"><Check size={15} />Duyệt</button><button className="btn danger" onClick={() => setRejectingId(item.id)} type="button"><X size={15} />Từ chối</button></div> : '—'}</td></tr>)}
    </tbody></table></div>
    <Pagination page={page} pageSize={pageSize} total={query.data?.totalItems ?? 0} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
    {rejectingId ? <div className="modal-backdrop" role="presentation"><div aria-modal="true" className="modal ad-review-modal" role="dialog"><h2>Từ chối quảng cáo</h2><p>Ngân sách đang giữ nhưng chưa chi sẽ được hoàn ngay về Ví ANKT.</p><label>Lý do bắt buộc<textarea autoFocus maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Nêu rõ nội dung cần chỉnh sửa" rows={5} value={reason} /></label><div className="modal-actions"><button className="btn" onClick={() => { setRejectingId(null); setReason(''); }} type="button">Hủy</button><button className="btn danger" disabled={reason.trim().length < 3 || reject.isPending} onClick={() => reject.mutate({ id: rejectingId, reviewReason: reason.trim() })} type="button">Xác nhận từ chối</button></div></div></div> : null}
  </section>;
}

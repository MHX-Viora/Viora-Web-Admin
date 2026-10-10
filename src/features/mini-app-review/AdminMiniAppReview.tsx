import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog, PageHeader, StatusBadge } from '../../components/common';
import { TechnicalDetails } from '../../components/TechnicalDetails';
import { getMiniAppAuditLogs, getMiniAppCategories, getMiniAppPermissions, getMiniAppReviewContext, getMiniAppVersions, transitionMiniApp, updateMiniApp, verifyMiniAppDomain } from '../../services/admin-mini-app.service';
import { getErrorMessage } from '../../services/http';
import type { HybridApp } from '../../types/mini-app';
import { ConfigFields } from '../developer/ConfigFields';
import { newConfig, validateConfig } from '../developer/config';
import { AuditTimeline, QueryState, VersionHistory } from '../developer/Shared';
import { reviewReadiness } from './review';

const checks = ['Đã kiểm tra nội dung và chức năng website', 'Đã đối chiếu domain, origin và callback', 'Đã kiểm tra cách đăng nhập và các quyền yêu cầu'];
type Action = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'archive';
const labels: Record<Action, string> = { approve: 'Phê duyệt phiên bản', reject: 'Từ chối phiên bản', suspend: 'Tạm ngừng', reactivate: 'Khôi phục', archive: 'Lưu trữ' };

export function AdminMiniAppReview({ app }: { app: HybridApp }) {
  const client = useQueryClient();
  const [form, setForm] = useState(() => newConfig(app));
  const [action, setAction] = useState<Action>();
  const [decisionVersion, setDecisionVersion] = useState<number>();
  const [reason, setReason] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const context = useQuery({ queryKey: ['mini-app-review', app.id], queryFn: () => getMiniAppReviewContext(app.id) });
  const metadata = useQuery({ queryKey: ['mini-app-review-metadata'], queryFn: async () => { const [categories, permissions] = await Promise.all([getMiniAppCategories(), getMiniAppPermissions()]); return { categories, permissions }; } });
  const versions = useQuery({ queryKey: ['mini-app-versions', app.id], queryFn: () => getMiniAppVersions(app.id) });
  const audit = useQuery({ queryKey: ['mini-app-audit', app.id], queryFn: () => getMiniAppAuditLogs({ page: 1, pageSize: 30, miniAppId: app.id }) });
  const review = reviewReadiness(app, versions.data, context.data, metadata.data?.permissions, metadata.data?.categories);
  const canApprove = review.blockers.length === 0 && checked.length === checks.length;
  const editLocked = Boolean(app.pendingVersion) || !['Draft', 'Rejected', 'Active', 'PendingReview'].includes(app.status);
  const refresh = async () => { await Promise.all(['mini-app', 'mini-apps', 'mini-app-versions', 'mini-app-review', 'mini-app-audit', 'mini-app-dashboard'].map(key => client.invalidateQueries({ queryKey: key === 'mini-apps' || key === 'mini-app-dashboard' ? [key] : [key, app.id] }))); };
  const save = useMutation({ mutationFn: () => updateMiniApp(app.id, form), onSuccess: async () => { toast.success('Đã lưu bản nháp. Chưa xác minh hoặc phát hành ứng dụng.'); await refresh(); }, onError: e => toast.error(getErrorMessage(e)) });
  const verify = useMutation({ mutationFn: (domainId: string) => verifyMiniAppDomain(app.id, domainId), onSuccess: () => toast.success('Đã kiểm tra lại bằng file xác minh HTTPS.'), onError: e => toast.error(getErrorMessage(e)), onSettled: async () => { setChecked([]); setAction(undefined); await refresh(); } });
  const transition = useMutation({ mutationFn: () => transitionMiniApp(app.id, action!, reason.trim(), decisionVersion), onSuccess: async () => { toast.success(action === 'approve' ? 'Đã duyệt và phát hành phiên bản.' : 'Đã ghi nhận quyết định.'); setAction(undefined); setReason(''); await refresh(); }, onError: e => toast.error(getErrorMessage(e)) });
  const busy = save.isPending || verify.isPending || transition.isPending;
  const decide = (next: Action) => { setAction(next); setDecisionVersion(review.version?.version); setReason(''); };
  const website = review.configuration?.webUrl ?? app.webUrl;
  return <section>
    <PageHeader eyebrow="Kiểm duyệt Mini App" title={app.name} description="Xác minh thông tin và duyệt phiên bản đã gửi. Lưu bản nháp không phải là phê duyệt." actions={<><Link className="btn" to="/mini-apps/pending">Danh sách chờ duyệt</Link><StatusBadge status={app.status} /></>} />
    <div className="detail-card mini-stack">
      <h2>{review.version ? `Đang kiểm duyệt phiên bản ${review.version.version}` : 'Ứng dụng chưa có phiên bản gửi duyệt hợp lệ'}</h2>
      <p>Đã phát hành: {app.publishedVersion || 'Chưa có'}{app.pendingVersion ? ` · Phiên bản chờ duyệt: ${app.pendingVersion}` : ''}</p>
      {!app.pendingVersion ? <p className="mini-notice">Đây là cấu hình bản nháp hoặc ứng dụng đã phát hành. Developer cần xác minh tất cả domain rồi gửi phiên bản xét duyệt; admin không phê duyệt bằng nút lưu cấu hình.</p> : null}
      {app.status === 'PendingReview' && !app.pendingVersion ? <p role="alert">Dữ liệu chờ duyệt cũ chưa có bản chụp phiên bản. Mở Chỉnh sửa bản nháp và lưu lại để trả về bản nháp; sau đó Developer xác minh domain và gửi lại phiên bản. Không phê duyệt trực tiếp dữ liệu này.</p> : null}
      {review.blockers.length ? <ul className="mini-notice" aria-label="Điều kiện chưa đủ để phê duyệt">{review.blockers.map(message => <li key={message}>{message}</li>)}</ul> : <p className="mini-notice">Hồ sơ Developer, domain và danh mục quyền đã đủ điều kiện kỹ thuật. Hoàn tất kiểm tra nội dung bên dưới trước khi quyết định.</p>}
    </div>
    <div className="detail-grid">
      <div className="detail-card"><h2>Hồ sơ Developer sở hữu</h2><QueryState query={context}>{context.data ? <dl className="mini-definition"><dt>Developer</dt><dd>{context.data.developer.name}</dd><dt>Công ty</dt><dd>{context.data.developer.companyName || 'Chưa khai báo'}</dd><dt>Email</dt><dd>{context.data.developer.email}</dd><dt>Điện thoại</dt><dd>{context.data.developer.phone || 'Chưa khai báo'}</dd><dt>Trạng thái</dt><dd><StatusBadge status={context.data.developer.status} /></dd></dl> : null}</QueryState><Link to="/developers">Quản lý hồ sơ Developer</Link></div>
      <div className="detail-card"><h2>Kiểm tra website gửi duyệt</h2><p className="truncate-url">{website}</p>{/^https:\/\//i.test(website) ? <a className="btn" href={website} target="_blank" rel="noopener noreferrer">Mở website để kiểm tra</a> : <p role="alert">Website chưa có URL HTTPS hợp lệ.</p>}<p className="mini-muted">Đọc nội dung, thử chức năng và đăng nhập. Kết quả xác minh domain không thay thế kiểm tra chất lượng website.</p></div>
    </div>
    <div className="detail-card mini-stack"><h2>Domain và bằng chứng xác minh</h2><QueryState query={context}>
      {!review.hosts.length ? <p>Chưa có cấu hình gửi duyệt để đối chiếu domain. Developer hoàn tất bản nháp và gửi phiên bản trước.</p> : review.hosts.map(host => { const domain = context.data?.domains.find(item => item.host === host); return <div className="mini-version mini-stack" key={host}>
        <div className="mini-row"><strong>{host}</strong><span>{domain?.verifiedAt ? '✓ Đã xác minh' : 'Chưa xác minh'}</span></div>
        {domain?.verifiedAt ? <p>Xác minh gần nhất: {new Date(domain.verifiedAt).toLocaleString('vi-VN')}</p> : null}
        <code className="truncate-url">{`https://${host}/.well-known/ankt-mini-app-verification.txt`}</code>
        {domain ? <button className="btn" type="button" disabled={busy} onClick={() => verify.mutate(domain.id)}>Kiểm tra lại domain {host}</button> : <p>Developer cần tạo mã và đặt file xác minh trên domain này.</p>}
      </div>; })}
      <p className="mini-muted">Kiểm tra lại dùng mã đã cấp và truy cập HTTPS công khai. Kết quả không khớp sẽ hủy bằng chứng cũ và chặn phát hành; mỗi domain cần chờ ít nhất 30 giây giữa hai lần kiểm tra.</p>
    </QueryState></div>
    {review.configuration ? <div className="detail-card mini-stack"><h2>Cấu hình phiên bản {review.version?.version} · chỉ đọc</h2><p>Đây là bản chụp Developer đã gửi. Quyết định phê duyệt phát hành đúng bản này.</p><QueryState query={metadata}><fieldset disabled><div className="mini-stack">{[0, 1, 2, 3].map(section => <div key={section}><h3>{['Thông tin ứng dụng', 'Website và domain', 'Cách đăng nhập', 'Quyền yêu cầu'][section]}</h3><ConfigFields value={review.configuration!} onChange={() => {}} section={section} categories={metadata.data?.categories} permissions={metadata.data?.permissions} /></div>)}</div></fieldset></QueryState></div> : null}
    <div className="detail-card mini-stack"><h2>Quyết định kiểm duyệt</h2>
      {checks.map(label => <label className="check-row" key={label}><input type="checkbox" disabled={busy || !review.version} checked={checked.includes(label)} onChange={e => setChecked(current => e.target.checked ? [...current, label] : current.filter(item => item !== label))} />{label}</label>)}
      <p className="mini-muted">Các dấu chọn là xác nhận đã kiểm tra của quản trị viên. Backend vẫn kiểm tra phiên bản, trạng thái Developer, domain và quyền khi phê duyệt.</p>
      <div className="mini-row"><button className="btn primary" type="button" disabled={busy || !canApprove} onClick={() => decide('approve')}>Phê duyệt và phát hành phiên bản</button><button className="btn danger" type="button" disabled={busy || !review.version || !['Active', 'PendingReview', 'Suspended'].includes(app.status)} onClick={() => decide('reject')}>Từ chối phiên bản</button></div>
      <div className="mini-row">{app.status === 'Active' ? <button className="btn danger" type="button" disabled={busy} onClick={() => decide('suspend')}>Tạm ngừng khẩn cấp</button> : null}{app.status === 'Suspended' ? <button className="btn" type="button" disabled={busy} onClick={() => decide('reactivate')}>Khôi phục bản đã phát hành</button> : null}{['Active', 'Suspended'].includes(app.status) ? <button className="btn" type="button" disabled={busy} onClick={() => decide('archive')}>Lưu trữ ứng dụng</button> : null}</div>
    </div>
    <div className="detail-card"><h2>Phiên bản và lịch sử quyết định</h2><QueryState query={versions}><VersionHistory items={versions.data ?? []} /></QueryState></div>
    <details className="detail-card"><summary>Chỉnh sửa bản nháp · không xác minh hoặc phát hành</summary><p>Chỉ dùng khi cần hỗ trợ Developer sửa cấu hình. Sau khi lưu, Developer phải gửi phiên bản để xét duyệt. Không sửa được cấu hình đang chờ duyệt.</p><QueryState query={metadata}><form className="mini-stack" onSubmit={e => { e.preventDefault(); if (editLocked || busy) return; const error = validateConfig(form); if (error) return toast.error(error); save.mutate(); }}><fieldset disabled={editLocked || busy}><div className="mini-stack">{[0, 1, 2, 3].map(section => <ConfigFields key={section} value={form} onChange={setForm} section={section} categories={metadata.data?.categories} permissions={metadata.data?.permissions} />)}<label className="check-row"><input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />Nổi bật</label></div></fieldset><button className="btn" disabled={editLocked || busy}>Lưu bản nháp cấu hình</button></form></QueryState></details>
    <div className="detail-card"><h2>Nhật ký kiểm duyệt và xác minh</h2><QueryState query={audit}><AuditTimeline items={audit.data?.items ?? []} /></QueryState></div>
    <TechnicalDetails values={{ 'Mã ứng dụng': app.id, 'Client ID': app.clientId }} />
    {action ? <ConfirmDialog title={`${labels[action]}${action === 'approve' || action === 'reject' ? ` ${decisionVersion}` : ''}`} description={action === 'approve' ? 'Phát hành đúng cấu hình phiên bản đã kiểm tra. Backend kiểm tra lại domain và quyền trước khi lưu quyết định.' : action === 'reactivate' ? 'Khôi phục bản đã phát hành. Phiên bản đang chờ duyệt vẫn cần quyết định riêng.' : 'Quyết định được ghi lại trong lịch sử. Nhập lý do cụ thể để Developer hiểu.'} confirmText={labels[action]} confirmDisabled={action === 'approve' ? !canApprove : action === 'reactivate' ? false : reason.trim().length < 3} loading={transition.isPending} onCancel={() => { setAction(undefined); setReason(''); }} onConfirm={() => transition.mutate()}>{action !== 'reactivate' ? <label className="mini-stack">Lý do {action === 'approve' ? '(tùy chọn)' : '(bắt buộc)'}<textarea rows={3} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label> : null}</ConfirmDialog> : null}
  </section>;
}

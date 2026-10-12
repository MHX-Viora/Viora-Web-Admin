import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, ErrorView, Loading, PageHeader, StatusBadge } from '../components/common';
import { getDeveloperApplication, reviewDeveloperApplication } from '../services/admin-mini-app.service';
import { getErrorMessage } from '../services/http';
import type { RegistrationStatus } from '../types/developer-platform';
import { DeveloperReviewHistory } from '../features/developer/DeveloperReviewHistory';
import { registrationStatus } from '../features/developer/registration';
import '../features/developer/developer.css';

const decisions: { value: RegistrationStatus; label: string }[] = [
  { value: 'Approved', label: 'Phê duyệt' }, { value: 'NeedMoreInformation', label: 'Yêu cầu bổ sung' },
  { value: 'Rejected', label: 'Từ chối' }, { value: 'Suspended', label: 'Tạm ngừng' }, { value: 'Revoked', label: 'Thu hồi' },
];
export function DeveloperReviewPage() {
  const { id = '' } = useParams(); const client = useQueryClient();
  const query = useQuery({ queryKey: ['developer-application', id], queryFn: () => getDeveloperApplication(id), enabled: Boolean(id) });
  const [status, setStatus] = useState<RegistrationStatus>('Approved'); const [reason, setReason] = useState('');
  const [internalNotes, setInternalNotes] = useState(''); const [confirming, setConfirming] = useState(false);
  const review = useMutation({ mutationFn: () => reviewDeveloperApplication(id, { version: query.data!.registrationVersion!, status, reason: reason.trim(), internalNotes: internalNotes.trim() }),
    onSuccess: async () => { toast.success('Đã ghi nhận quyết định xét duyệt'); setConfirming(false); setReason(''); setInternalNotes(''); await Promise.all([client.invalidateQueries({ queryKey: ['developer-application', id] }), client.invalidateQueries({ queryKey: ['developers'] })]); }, onError: e => toast.error(getErrorMessage(e)) });
  if (query.isLoading) return <Loading />;
  if (query.isError) return <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  const profile = query.data; if (!profile) return null;
  const current = registrationStatus(profile); const allowed = current === 'PendingReview' ? ['Approved', 'NeedMoreInformation', 'Rejected'] : current === 'Approved' ? ['Suspended', 'Revoked'] : current === 'Suspended' ? ['Approved', 'Revoked'] : [];
  const valid = Boolean(profile.registrationVersion) && allowed.includes(status) && (status === 'Approved' || reason.trim().length >= 3);
  const rows = [['Loại đối tác', profile.partnerType], ['Tên pháp lý', profile.legalName], ['Tên thương mại', profile.tradingName], ['Mã đăng ký doanh nghiệp', profile.businessRegistrationNumber], ['Quốc gia', profile.country], ['Địa chỉ', profile.address], ['Người đại diện', profile.representativeName], ['Email', profile.email], ['Điện thoại', profile.phone], ['Website', profile.website], ['Tài khoản ANKT', profile.accountId], ['Phiên bản điều khoản', profile.termsAcceptedVersion]];
  return <section className="mini-stack"><PageHeader eyebrow="Xét duyệt đối tác" title={profile.name} description="Đánh giá đúng phiên bản hồ sơ đã gửi. Lý do gửi cho Developer; ghi chú nội bộ chỉ dành cho quản trị." actions={<Link className="btn" to="/developers">Danh sách Developer</Link>} />
    <article className="detail-card mini-stack"><div className="mini-row"><StatusBadge status={current} /><span>Hồ sơ phiên bản {profile.registrationVersion ?? 'chưa có'}</span></div><dl className="mini-form-grid">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl><p>Email: {profile.contactEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'} · Điều khoản: {profile.termsAcceptedAt ? new Date(profile.termsAcceptedAt).toLocaleString('vi-VN') : 'Chưa chấp nhận'}</p>{profile.submittedAt && <p>Gửi lúc {new Date(profile.submittedAt).toLocaleString('vi-VN')}</p>}</article>
    <form className="detail-card mini-stack" onSubmit={e => { e.preventDefault(); if (valid) setConfirming(true); }}><h2>Quyết định xét duyệt</h2>{allowed.length ? <><label>Quyết định<select value={status} onChange={e => setStatus(e.target.value as RegistrationStatus)}>{decisions.filter(d => allowed.includes(d.value)).map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></label><label>Lý do gửi cho Developer {status !== 'Approved' && '*'}<textarea value={reason} maxLength={2000} required={status !== 'Approved'} minLength={status !== 'Approved' ? 3 : undefined} onChange={e => setReason(e.target.value)} /></label><label>Ghi chú nội bộ<textarea value={internalNotes} maxLength={4000} onChange={e => setInternalNotes(e.target.value)} /></label><button className="btn primary" disabled={!valid || review.isPending}>Xác nhận quyết định</button>{!profile.registrationVersion && <p role="alert">Hồ sơ cũ chưa có phiên bản xét duyệt. Developer cần hoàn tất quy trình đăng ký mới.</p>}</> : <p>Trạng thái này chưa có quyết định quản trị tiếp theo. Chờ Developer gửi hồ sơ.</p>}</form>
    <article className="detail-card"><h2>Lịch sử xét duyệt</h2><DeveloperReviewHistory items={profile.reviewHistory} internal /></article>
    {confirming && <ConfirmDialog title="Ghi nhận quyết định xét duyệt?" description={`${profile.name} · phiên bản ${profile.registrationVersion} · ${decisions.find(d => d.value === status)?.label}. ${reason.trim()}`} loading={review.isPending} onCancel={() => setConfirming(false)} onConfirm={() => { if (valid) review.mutate(); }} />}
  </section>;
}

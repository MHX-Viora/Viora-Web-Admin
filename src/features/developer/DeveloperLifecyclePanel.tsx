import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, StatusBadge } from '../../components/common';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import type { HybridApp } from '../../types/mini-app';
import { useDeveloperProfile } from './context';
import { QueryState } from './Shared';

export function DeveloperLifecyclePanel({ app }: { app: HybridApp }) {
  const client = useQueryClient(); const profile = useDeveloperProfile(); const [action, setAction] = useState<'publish' | 'unpublish'>();
  const editable = ['Owner', 'Admin', 'Developer', 'Member'].includes(app.membershipRole ?? profile.membershipRole ?? "");
  const query = useQuery({ queryKey: ['developer-technical-test', app.id], queryFn: () => developerApi.technicalTest(app.id) });
  const test = useMutation({ mutationFn: () => developerApi.runTechnicalTest(app.id), onSuccess: result => { client.setQueryData(['developer-technical-test', app.id], result); }, onError: e => toast.error(getErrorMessage(e)) });
  const publish = useMutation({ mutationFn: async () => { if (action === 'publish') await developerApi.publish(app.id, app.approvedVersion!); else await developerApi.unpublish(app.id); }, onSuccess: async () => { setAction(undefined); toast.success('Đã cập nhật trạng thái phát hành'); await Promise.all([client.invalidateQueries({ queryKey: ['developer-app', app.id] }), client.invalidateQueries({ queryKey: ['developer-apps'] })]); }, onError: e => toast.error(getErrorMessage(e)) });
  return <article className="detail-card mini-stack"><h2>Kiểm tra kỹ thuật & phát hành</h2><div className="mini-row"><StatusBadge status={app.reviewState ?? app.status} /><StatusBadge status={app.publicationStatus ?? app.status} /><span>Phiên bản được duyệt: {app.approvedVersion ?? 'Chưa có'}</span></div>
    <p>Kiểm tra giới hạn kiểm tra cấu hình, website HTTPS và tích hợp có thể xác định từ máy chủ. Đây không phải môi trường sandbox cách ly và không tự kiểm chứng toàn bộ hành vi SDK.</p>
    <button className="btn" type="button" disabled={!editable || test.isPending} onClick={() => test.mutate()}>{test.isPending ? 'Đang kiểm tra…' : 'Chạy kiểm tra cấu hình đã lưu'}</button>
    <QueryState query={query}>{query.data ? <><p role="status">{query.data.passed ? 'Đạt các kiểm tra hiện có' : 'Còn kiểm tra chưa đạt'} · {new Date(query.data.checkedAt).toLocaleString('vi-VN')}</p><ul className="mini-checklist">{query.data.checks.map(check => <li key={check.code}><strong>{check.passed ? '✓' : '✗'} {check.code}</strong><p>{check.message}{check.httpStatus ? ` · HTTP ${check.httpStatus}` : ''}{check.durationMs !== undefined ? ` · ${check.durationMs} ms` : ''}</p></li>)}</ul><small>Mã kiểm tra: {query.data.requestId}</small></> : <p>Chưa chạy kiểm tra cấu hình đã lưu.</p>}</QueryState>
    <p>Phê duyệt phiên bản và phát hành là hai bước riêng. Bạn chủ động phát hành phiên bản đã được ANKT duyệt.</p><div className="mini-row"><button className="btn primary" type="button" disabled={!editable || !app.approvedVersion || publish.isPending} onClick={() => setAction('publish')}>Phát hành phiên bản {app.approvedVersion ?? 'đã duyệt'}</button>{app.publicationStatus === 'Published' && <button className="btn danger" type="button" disabled={!editable || publish.isPending} onClick={() => setAction('unpublish')}>Ngừng phát hành</button>}</div>
    {action && <ConfirmDialog title={action === 'publish' ? 'Phát hành Mini App?' : 'Ngừng phát hành Mini App?'} description={action === 'publish' ? `Đưa phiên bản ${app.approvedVersion} đã duyệt lên danh sách Mini Apps cho người dùng.` : 'Ứng dụng sẽ không còn xuất hiện cho người dùng. Hồ sơ và phiên bản được giữ lại.'} loading={publish.isPending} onCancel={() => setAction(undefined)} onConfirm={() => publish.mutate()} />}
  </article>;
}

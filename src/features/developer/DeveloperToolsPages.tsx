import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, Empty, PageHeader, Pagination, StatCard, StatusBadge } from '../../components/common';
import { CheckCircle2, Users, XCircle } from 'lucide-react';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import { useDeveloperApp, useDeveloperProfile } from './context';
import { AuditTimeline, QueryState, SecretDisclosure } from './Shared';
import { downloadVerificationFile } from './verification-download';

export function DeveloperDomainsPage() {
  const app = useDeveloperApp(); const client = useQueryClient(); const [host, setHost] = useState('');
  const query = useQuery({ queryKey: ['developer-domains', app.id], queryFn: () => developerApi.domains(app.id) });
  const mutation = useMutation({ mutationFn: async (domainId?: string) => { if (domainId) await developerApi.verifyDomain(app.id, domainId); else await developerApi.addDomain(app.id, host.trim()); }, onSuccess: async () => { setHost(''); toast.success('Đã cập nhật domain'); await client.invalidateQueries({ queryKey: ['developer-domains', app.id] }); }, onError: e => toast.error(getErrorMessage(e)) });
  async function download(token: string) {
    try { await downloadVerificationFile(token); }
    catch (error) { toast.error(getErrorMessage(error)); }
  }
  return <div className="detail-card mini-stack">
    <h2>Xác minh quyền sở hữu domain</h2>
    <ol><li>Tải file TXT chứa sẵn mã xác minh của domain bên dưới.</li><li>Đưa nguyên file vào thư mục gốc của website, giữ nguyên tên và nội dung. Không cần tạo thư mục con.</li><li>Bấm Kiểm tra xác minh. URL phải trả HTTP 200 qua HTTPS, không chuyển hướng hoặc yêu cầu đăng nhập.</li></ol>
    <form className="mini-row" onSubmit={e => { e.preventDefault(); mutation.mutate(undefined); }}><label>Domain<input required placeholder="app.example.com" value={host} onChange={e => setHost(e.target.value)} pattern="[a-zA-Z0-9.-]+" /></label><button className="btn primary" disabled={mutation.isPending}>Thêm domain</button></form>
    <QueryState query={query}>{!query.data?.length ? <Empty /> : query.data.map(domain => <article className="mini-version mini-stack" key={domain.id}>
      <div className="mini-row"><strong>{domain.host}</strong><StatusBadge status={domain.verifiedAt ? 'approved' : 'pending'} /></div>
      <label>URL file cần đặt trên website<input readOnly value={`https://${domain.host}/ankt-mini-app-verification.txt`} /></label>
      <button className="btn primary" disabled={mutation.isPending} type="button" onClick={() => void download(domain.challengeToken)}>Tải file xác minh (.txt)</button>
      <p>File <code>ankt-mini-app-verification.txt</code> đã chứa mã của domain này. Không cần tạo hoặc sửa file.</p>
      <details><summary>Xem mã xác minh</summary><textarea aria-label={`Mã xác minh ${domain.host}`} readOnly rows={2} value={domain.challengeToken} /></details>
      {domain.verifiedAt ? <p>Đã xác minh {new Date(domain.verifiedAt).toLocaleString('vi-VN')}</p> : <button className="btn" disabled={mutation.isPending} type="button" onClick={() => mutation.mutate(domain.id)}>Kiểm tra xác minh</button>}
    </article>)}</QueryState>
  </div>;
}

export function DeveloperSsoPage() {
  const app = useDeveloperApp(); const [confirm, setConfirm] = useState(false); const [secret, setSecret] = useState('');
  const profile = useQuery({ queryKey: ['developer-profile-sso'], queryFn: developerApi.profile });
  const rotate = useMutation({ mutationFn: () => developerApi.rotate(app.id), onSuccess: result => { setConfirm(false); setSecret(result.clientSecret); }, onError: e => toast.error(getErrorMessage(e)) });
  return <div className="mini-stack"><div className="detail-card mini-stack"><h2>Tích hợp ANKT SSO</h2><p>{app.authenticationMode === 'AnktSso' ? 'Website yêu cầu đăng nhập ANKT qua SDK. Người dùng cấp quyền, rồi backend đối tác đổi mã để tạo phiên riêng.' : 'Ứng dụng đang dùng đăng nhập riêng. Bật ANKT SSO trong Chi tiết để sử dụng đăng nhập ANKT.'}</p><dl className="mini-definition"><dt>Client ID</dt><dd><code>{app.clientId}</code></dd><dt>Phương thức</dt><dd>{app.clientAuthenticationMethod ?? 'ClientSecretPost'}</dd><dt>Callback</dt><dd>{app.callbackUrls?.join(', ') || app.callbackUrl || 'Chưa đăng ký'}</dd><dt>PKCE</dt><dd>S256 bắt buộc</dd></dl><h3>Luồng đăng nhập</h3><ol><li>Backend đối tác tạo state và PKCE verifier, lưu trong phiên đăng nhập của đối tác.</li><li>Website gọi SDK requestLogin với callback đã đăng ký, state và S256 challenge.</li><li>ANKT trả URL callback chứa code và state sau khi người dùng cấp quyền.</li><li>Backend đối tác xác minh state và đổi code tại <code>POST /api/mini-app-auth/exchange</code>, kèm redirectUri và codeVerifier.</li><li>Tìm tài khoản theo subject hoặc yêu cầu người dùng xác nhận liên kết với tài khoản cũ.</li></ol><pre className="mini-code">{JSON.stringify({ clientId: app.clientId, code: '<mã dùng một lần>', redirectUri: app.callbackUrls?.[0] || app.callbackUrl || 'https://your-app.example/auth/callback', state: '<state từ phiên đối tác>', codeVerifier: '<PKCE verifier từ phiên đối tác>', ...(app.clientAuthenticationMethod === 'None' ? {} : { clientSecret: '<secret lưu trên backend>' }) }, null, 2)}</pre><p className="mini-notice">Không tự liên kết theo email. Liên kết tài khoản cũ cần đăng nhập tài khoản đó và xác nhận rõ ràng; xử lý xung đột subject và hỗ trợ hủy liên kết ở phía đối tác.</p><QueryState query={profile}>{profile.data?.membershipRole === 'Owner' && app.authenticationMode === 'AnktSso' && app.clientAuthenticationMethod !== 'None' ? <button className="btn danger" disabled={rotate.isPending} type="button" onClick={() => setConfirm(true)}>Đổi client secret</button> : null}</QueryState></div>{confirm ? <ConfirmDialog title="Đổi client secret" description="Secret cũ sẽ mất hiệu lực ngay. Cập nhật backend đối tác bằng secret mới để tiếp tục đổi mã đăng nhập." confirmText="Đổi secret" loading={rotate.isPending} onCancel={() => setConfirm(false)} onConfirm={() => rotate.mutate()} /> : null}{secret ? <SecretDisclosure secret={secret} onDismiss={() => { setSecret(''); rotate.reset(); }} /> : null}</div>;
}

export function DeveloperAnalyticsPage() {
  const app = useDeveloperApp(); const query = useQuery({ queryKey: ['developer-analytics', app.id], queryFn: () => developerApi.analytics(app.id) });
  return <QueryState query={query}>{query.data ? <><div className="stats-grid"><StatCard icon={<CheckCircle2 />} tone="green" label="Lượt mở thành công" value={String(query.data.successfulLaunches)} /><StatCard icon={<XCircle />} tone="red" label="Lượt mở thất bại" value={String(query.data.failedLaunches)} /><StatCard icon={<Users />} tone="blue" label="Người dùng" value={String(query.data.uniqueUsers)} /></div><div className="detail-card"><h2>Sử dụng theo ngày</h2><DataTable items={query.data.daily.map(day => ({ ...day, id: day.date }))} columns={[{ key: 'date', title: 'Ngày', render: day => day.date }, { key: 'launches', title: 'Lượt mở', render: day => day.launches }, { key: 'failures', title: 'Thất bại', render: day => day.failures }]} /></div></> : null}</QueryState>;
}
export function DeveloperAuditPage() {
  const app = useDeveloperApp(); const [page, setPage] = useState(1); const query = useQuery({ queryKey: ['developer-audit', app.id, page], queryFn: () => developerApi.audit(app.id, page) });
  return <div className="detail-card"><h2>Lịch sử hoạt động</h2><QueryState query={query}><AuditTimeline items={query.data?.items ?? []} /><Pagination page={page} pageSize={20} total={query.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={() => undefined} /></QueryState></div>;
}
export function DeveloperTeamPage() {
  const profile = useDeveloperProfile(); const client = useQueryClient(); const [accountId, setAccountId] = useState(''); const [removing, setRemoving] = useState<string>();
  const query = useQuery({ queryKey: ['developer-team'], queryFn: developerApi.team });
  const mutation = useMutation({ mutationFn: async (id?: string) => { if (id) await developerApi.removeMember(id); else await developerApi.addMember(accountId, 'Member'); }, onSuccess: async () => { setAccountId(''); setRemoving(undefined); toast.success('Đã cập nhật thành viên'); await client.invalidateQueries({ queryKey: ['developer-team'] }); }, onError: e => toast.error(getErrorMessage(e)) });
  return <section><PageHeader title="Thành viên Developer" description="Chủ sở hữu quản lý thành viên. Thành viên được quản lý ứng dụng của đơn vị; quyền truy cập luôn được kiểm tra trên backend." /><div className="detail-card mini-stack">{profile.membershipRole === 'Owner' ? <form className="mini-row" onSubmit={e => { e.preventDefault(); mutation.mutate(undefined); }}><label>ANKT Account ID<input required value={accountId} onChange={e => setAccountId(e.target.value)} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}" /></label><button className="btn primary" disabled={mutation.isPending}>Thêm thành viên</button></form> : <p>Chỉ chủ sở hữu được thêm hoặc xóa thành viên.</p>}<QueryState query={query}><DataTable items={query.data ?? []} columns={[{ key: 'account', title: 'Tài khoản ANKT', render: member => <code>{member.accountId}</code> }, { key: 'role', title: 'Vai trò', render: member => member.role === 'Owner' ? 'Chủ sở hữu' : 'Thành viên' }, { key: 'added', title: 'Ngày thêm', render: member => new Date(member.createdAt).toLocaleDateString('vi-VN') }, { key: 'action', title: 'Thao tác', render: member => profile.membershipRole === 'Owner' && member.role !== 'Owner' ? <button className="btn danger" type="button" onClick={() => setRemoving(member.id)}>Xóa</button> : '—' }]} /></QueryState></div>{removing ? <ConfirmDialog title="Xóa thành viên" description="Tài khoản này sẽ mất quyền quản lý ứng dụng của Developer." loading={mutation.isPending} onCancel={() => setRemoving(undefined)} onConfirm={() => mutation.mutate(removing)} /> : null}</section>;
}

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../components/common';
import { getErrorMessage } from '../../services/http';
import { getOpenApiIntegration, revokeOpenApiTokens } from '../../services/open-api.service';

export function OpenApiIntegrationPanel({ appId, admin = false }: { appId: string; admin?: boolean }) {
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const query = useQuery({ queryKey: ['open-api-integration', appId, admin], queryFn: () => getOpenApiIntegration(appId, admin), retry: false });
  const revoke = useMutation({ mutationFn: () => revokeOpenApiTokens(appId, reason.trim()), onSuccess: async () => {
    setConfirm(false); setReason(''); toast.success('Đã thu hồi token Open API của ứng dụng.');
    await Promise.all([client.invalidateQueries({ queryKey: ['open-api-integration', appId] }), client.invalidateQueries({ queryKey: ['mini-app-audit', appId] })]);
  }, onError: error => toast.error(getErrorMessage(error)) });
  const data = query.data;
  return <div className="detail-card mini-stack"><h2>Open API · OAuth 2.0 / OpenID Connect</h2>
    {query.isLoading ? <p role="status">Đang tải cấu hình tích hợp…</p> : query.isError ? <div>
      <p role="alert">{isAxiosError(query.error) && query.error.response?.status === 404 ? 'Backend chưa hỗ trợ Open API. Luồng SSO hiện tại vẫn hoạt động.' : getErrorMessage(query.error)}</p>
      <button className="btn" type="button" onClick={() => void query.refetch()}>Thử lại</button>
    </div> : data ? <>
      <h3>SSO &amp; Auto Login</h3>
      {data.ssoReadiness ? <dl className="mini-definition"><dt>OAuth configuration</dt><dd>{data.ssoReadiness.oAuthConfigurationValid ? 'Hợp lệ' : 'Chưa hợp lệ'}</dd><dt>Callback domains</dt><dd>{data.ssoReadiness.callbackDomainsVerified ? 'Đã xác minh domain' : 'Chưa xác minh domain'}</dd><dt>PKCE</dt><dd>S256 bắt buộc</dd><dt>Auto Login đã phát hành</dt><dd>{data.ssoReadiness.autoLoginEnabled ? 'Đã bật' : 'Chưa bật'}</dd><dt>Silent SSO / Account linking</dt><dd>Chưa xác minh tích hợp website. Chạy callback và SDK thực tế để xác nhận tạo phiên theo subject; xác minh domain không chứng minh website đã đăng nhập thành công.</dd><dt>Consent</dt><dd>Chỉ hỏi scope còn thiếu; không tự cấp quyền.</dd></dl> : <p>Backend chưa trả trạng thái Auto Login.</p>}
      <p>{!data.enabled ? 'Open API chưa được bật. Tiếp tục dùng luồng SSO hiện tại; chỉ chuyển khi quản trị viên hoàn tất cấu hình và bật dịch vụ.' : data.eligible ? 'Ứng dụng đủ điều kiện dùng ANKT SSO. Chỉ chia sẻ các quyền đã được duyệt và người dùng đồng ý.' : 'Ứng dụng chưa đủ điều kiện SSO. Kiểm tra trạng thái Developer, phiên bản đã phát hành, cách đăng nhập và quyền openid.'}</p>
      <dl className="mini-definition"><dt>Client ID</dt><dd><code>{data.clientId}</code></dd>
        <dt>Issuer</dt><dd><code>{data.issuer || 'Chưa cấu hình'}</code></dd>
        <dt>Discovery</dt><dd><code className="truncate-url">{data.discoveryUrl || 'Chưa bật'}</code></dd>
        <dt>Scope đã duyệt</dt><dd>{data.approvedScopes.join(' · ') || 'Chưa có quyền OAuth phù hợp'}</dd>
        <dt>Callback đã duyệt</dt><dd>{data.approvedCallbackUrls.map(url => <div key={url}><code className="truncate-url">{url}</code></div>)}</dd></dl>
      {data.enabled && !admin ? <><h3>Cài đặt backend đối tác</h3><pre className="mini-code">{`ANKT_OIDC_ISSUER=${data.issuer}\nANKT_HOST_ORIGIN=${data.hostOrigin || '<origin ANKT do quản trị cung cấp>'}\nANKT_CLIENT_ID=${data.clientId}\nANKT_CLIENT_SECRET=<secret chỉ lưu trên backend>\nANKT_REDIRECT_URI=${data.approvedCallbackUrls[0] || '<callback HTTPS đã duyệt>'}`}</pre>
        <ol><li>Dùng thư viện OAuth/OIDC để đọc discovery; backend tạo state, nonce và PKCE S256 rồi lưu vào phiên riêng.</li><li>Cấu hình SDK với BFF cùng origin, gọi <code>ANKT.auth.autoLogin()</code> khi website mở trong ANKT. Ngoài ANKT, dùng <code>ANKT.auth.login()</code>.</li><li>Callback kiểm tra state; backend đổi code bằng PKCE verifier và xác thực ID token, issuer, audience, nonce, runtime_session_id khớp giao dịch.</li><li>Tạo phiên HttpOnly theo subject và runtime_session_id đã xác minh. Session API trả authenticated và runtimeSessionId, giữ token trên backend; không tự liên kết theo email.</li></ol>
        <p className="mini-notice">Mở Mini App không yêu cầu cấp quyền. Chỉ hỏi khi cần chia sẻ dữ liệu mới; quyền đã cấp còn hợp lệ được dùng lại.</p></> : null}
      <h3>Hoạt động 7 ngày gần nhất</h3><p>{data.usage.requests} yêu cầu · {data.usage.successful} thành công · {data.accountLinks} định danh đã liên kết</p>
      <dl className="mini-definition"><dt>401 · chưa xác thực</dt><dd>{data.usage.unauthorized}</dd><dt>403 · thiếu quyền</dt><dd>{data.usage.forbidden}</dd><dt>429 · giới hạn tần suất</dt><dd>{data.usage.rateLimited}</dd></dl>
      {admin && (data.usage.rateLimited > 0 || (data.usage.requests >= 20 && data.usage.unauthorized + data.usage.forbidden >= data.usage.requests / 2)) ? <p role="alert" className="mini-notice">Cần kiểm tra hoạt động API: có yêu cầu vượt giới hạn tần suất hoặc ít nhất một nửa yêu cầu bị từ chối xác thực/quyền. Dùng mã tra cứu bên dưới để kiểm tra log; cảnh báo này chưa xác định nguyên nhân.</p> : null}
      {data.usage.truncated ? <p role="status">Thống kê hiển thị 10.000 yêu cầu gần nhất trong 7 ngày.</p> : null}
      <h3>Lỗi gần đây</h3>
      {data.recentErrors?.length ? <ul>{data.recentErrors.slice(0, 5).map((error, index) => <li key={`${error.occurredAt}-${index}`}>
        {new Date(error.occurredAt).toLocaleString('vi-VN')} · HTTP {error.status} · <code>{error.path}</code>{error.correlationId ? <> · Mã tra cứu: <code>{error.correlationId}</code></> : null}
      </li>)}</ul> : <p>Chưa có lỗi Open API được ghi nhận trong 7 ngày.</p>}
      {admin && data.enabled ? <button className="btn danger" type="button" disabled={revoke.isPending} onClick={() => setConfirm(true)}>Thu hồi toàn bộ token Open API</button> : null}
    </> : null}
    {confirm ? <ConfirmDialog title="Thu hồi token Open API" description="Các access token và mã OAuth đã cấp cho ứng dụng sẽ mất hiệu lực. Người dùng cần đăng nhập lại. Quyền đã đồng ý được giữ; tạm ngừng ứng dụng nếu cần chặn cả đăng nhập mới." confirmText="Thu hồi token" confirmDisabled={reason.trim().length < 3} loading={revoke.isPending} onCancel={() => { setConfirm(false); setReason(''); }} onConfirm={() => revoke.mutate()}><label className="mini-stack">Lý do bắt buộc<textarea value={reason} rows={3} maxLength={1000} onChange={event => setReason(event.target.value)} /></label></ConfirmDialog> : null}
  </div>;
}

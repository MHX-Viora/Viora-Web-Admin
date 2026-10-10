import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog, Empty, ErrorView, Loading, StatusBadge } from '../../components/common';
import { getErrorMessage } from '../../services/http';
import type { AppVersion, MiniAppAudit } from '../../types/mini-app';

export function QueryState({ query, children }: { query: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }; children: ReactNode }) {
  if (query.isLoading) return <Loading rows={3} />;
  if (query.isError) return <ErrorView message={getErrorMessage(query.error)} onRetry={() => { void query.refetch(); }} />;
  return <>{children}</>;
}
export function AuditTimeline({ items }: { items: MiniAppAudit[] }) {
  if (!items.length) return <Empty />;
  return <ol className="mini-timeline">{items.map(item => <li key={item.id}><strong>{item.action}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN')}</time><p>{item.detail || 'Thay đổi đã được ghi nhận.'}</p></li>)}</ol>;
}
export function VersionHistory({ items }: { items: AppVersion[] }) {
  if (!items.length) return <Empty />;
  return <div className="mini-stack">{items.map(item => <article className="mini-version" key={item.id}><div className="mini-row"><strong>Phiên bản {item.version}</strong><StatusBadge status={item.status} /><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN')}</time></div>{item.reason ? <p>{item.reason}</p> : null}{item.configuration ? <details><summary>Xem cấu hình gửi duyệt</summary><dl className="mini-definition"><dt>Website</dt><dd>{item.configuration.webUrl}</dd><dt>Domain</dt><dd>{item.configuration.allowedDomains.join(', ')}</dd><dt>Đăng nhập</dt><dd>{item.configuration.authenticationMode}</dd><dt>Callback</dt><dd>{item.configuration.callbackUrls?.join(', ') || 'Không có'}</dd><dt>Origins</dt><dd>{item.configuration.allowedOrigins?.join(', ') || 'Không có'}</dd><dt>Quyền</dt><dd>{item.configuration.permissions.join(', ') || 'Không yêu cầu'}</dd></dl></details> : null}</article>)}</div>;
}
export function SecretDisclosure({ secret, onDismiss }: { secret: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  return <ConfirmDialog title="Lưu client secret" description="Secret chỉ hiển thị trong lần này. Lưu vào kho bí mật của máy chủ đối tác trước khi đóng." confirmText="Đã lưu, đóng" onCancel={onDismiss} onConfirm={onDismiss}><div className="mini-stack"><label>Client secret<input readOnly type={visible ? 'text' : 'password'} value={secret} autoComplete="off" /></label><div className="mini-row"><button className="btn" type="button" onClick={() => setVisible(!visible)}>{visible ? 'Ẩn' : 'Hiện'}</button><button className="btn" type="button" onClick={() => void navigator.clipboard.writeText(secret).then(() => toast.success('Đã sao chép')).catch(() => toast.error('Không thể sao chép; hãy lưu secret thủ công.'))}>Sao chép</button></div></div></ConfirmDialog>;
}

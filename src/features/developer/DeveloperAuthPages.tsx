import { useState, type ReactNode, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { developerAccountVerification, developerGoogleLogin, developerLogin, developerRegister, developerResetWithEmailLink, developerResetWithGoogle, developerVerifyAccountEmail, getDeveloperSession } from '../../services/developer-auth.service';
import { developerSendEmailLink } from '../../services/developer-provider.service';
import { getErrorMessage } from '../../services/http';
import { DeveloperThemeButton } from './DeveloperThemeButton';

function AuthFrame({ title, children }: { title: string; children: ReactNode }) {
  return <main className="developer-login"><section className="detail-card"><DeveloperThemeButton /><Link className="page-eyebrow" to="/developer/welcome">ANKT Developer</Link><h1>{title}</h1>{children}<p className="mini-muted">Một tài khoản ANKT dùng chung cho Developer Portal và toàn hệ thống.</p></section></main>;
}

export function DeveloperWelcomePage() {
  if (getDeveloperSession()) return <Navigate to="/developer" replace />;
  return <AuthFrame title="Xây dựng cùng ANKT"><p>Phát triển Mini App, kết nối ANKT SSO và quản lý ứng dụng của bạn.</p><div className="mini-stack"><Link className="btn primary" to="/developer/login">Đăng nhập ANKT hoặc Google</Link><Link className="btn" to="/developer/signup">Đăng ký tài khoản Developer</Link><Link to="/developer/forgot-password">Quên mật khẩu</Link><Link to="/developer/docs">Tài liệu tích hợp</Link></div></AuthFrame>;
}

function AccountForm({ signup = false }: { signup?: boolean }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  if (getDeveloperSession()) return <Navigate to="/developer" replace />;
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError('');
    try { await action(); setPassword(''); setConfirmation(''); navigate('/developer', { replace: true }); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (signup && password !== confirmation) { setError('Mật khẩu xác nhận chưa khớp.'); return; }
    void run(() => signup ? developerRegister({ identifier, password }) : developerLogin({ identifier, password }));
  }
  return <AuthFrame title={signup ? 'Đăng ký Developer' : 'Đăng nhập Developer Portal'}><p>{signup ? 'Tạo tài khoản ANKT, sau đó hoàn tất hồ sơ Developer. Nếu email đã tồn tại, hãy đăng nhập tài khoản cũ.' : 'Dùng tài khoản ANKT hiện có hoặc đăng nhập Google.'}</p>{error && <p role="alert" className="mini-error">{error}</p>}<form className="mini-stack" onSubmit={submit}><label>{signup ? 'Email' : 'Email hoặc số điện thoại'}<input required type={signup ? 'email' : 'text'} autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} disabled={busy} /></label><label>Mật khẩu ANKT<input type="password" required minLength={signup ? 8 : undefined} maxLength={100} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>{signup && <><small>8–100 ký tự, có chữ hoa, chữ thường và số.</small><label>Nhập lại mật khẩu<input type="password" required autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy} /></label></>}<button className="btn primary" disabled={busy}>{busy ? 'Đang xử lý…' : signup ? 'Tạo tài khoản' : 'Đăng nhập'}</button></form><button type="button" className="btn" disabled={busy} onClick={() => void run(developerGoogleLogin)}>Tiếp tục với Google</button><div className="mini-row"><Link to={signup ? '/developer/login' : '/developer/signup'}>{signup ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới'}</Link><Link to="/developer/forgot-password">Quên mật khẩu</Link></div></AuthFrame>;
}

export function DeveloperSignInPage() { return <AccountForm />; }
export function DeveloperSignUpPage() { return <AccountForm signup />; }

export function DeveloperForgotPasswordPage() {
  const [identifier, setIdentifier] = useState(() => sessionStorage.getItem('ankt_developer_pending_email') ?? ''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const incomingLink = new URLSearchParams(window.location.search).get('mode') === 'signIn';
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setMessage('');
    try {
      if (!incomingLink) { await developerSendEmailLink(identifier, 'forgot-password'); setMessage('Đã gửi liên kết xác nhận. Mở email để tiếp tục đặt lại mật khẩu ANKT.'); }
      else { const result = await developerResetWithEmailLink(identifier, password); setPassword(''); setMessage(result.message || 'Đã đổi mật khẩu ANKT. Bạn có thể đăng nhập lại.'); }
    }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }
  async function googleReset() {
    if (busy) return; setBusy(true); setError(''); setMessage('');
    try { const result = await developerResetWithGoogle(identifier, password); setPassword(''); setMessage(result.message || 'Đã đổi mật khẩu ANKT.'); }
    catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }
  return <AuthFrame title="Khôi phục mật khẩu ANKT"><p>Nhận liên kết xác nhận qua email để đặt lại mật khẩu tài khoản ANKT. Tài khoản dùng số điện thoại có thể dùng quy trình SMS trong ứng dụng ANKT.</p>{error && <p role="alert" className="mini-error">{error}</p>}{message && <p role="status">{message}</p>}<form className="mini-stack" onSubmit={submit}><label>Email ANKT<input required type="email" autoComplete="username" value={identifier} disabled={busy} onChange={e => setIdentifier(e.target.value)} /></label><label>Mật khẩu mới<input required={incomingLink} type="password" minLength={8} maxLength={100} autoComplete="new-password" value={password} disabled={busy} onChange={e => setPassword(e.target.value)} /></label><small>Mật khẩu gồm 8–100 ký tự, có chữ hoa, chữ thường và số.</small><button className="btn primary" disabled={busy}>{busy ? 'Đang xử lý…' : incomingLink ? 'Xác nhận email & đổi mật khẩu' : 'Gửi liên kết khôi phục'}</button></form><button className="btn" type="button" disabled={busy || !identifier || password.length < 8} onClick={() => void googleReset()}>Xác nhận bằng Google & đổi mật khẩu</button><Link to="/developer/login">Về đăng nhập</Link></AuthFrame>;
}

export function DeveloperVerifyEmailPage() {
  const session = getDeveloperSession();
  const query = useQuery({ queryKey: ['developer-account-verification', session?.accountId], queryFn: developerAccountVerification, enabled: Boolean(session) });
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const incomingLink = new URLSearchParams(window.location.search).get('mode') === 'signIn';
  if (!session) return <AuthFrame title="Xác minh email ANKT"><p>Đăng nhập ANKT trước khi xác nhận email tài khoản. Sau đó mở lại liên kết email trong trình duyệt này.</p><Link to="/developer/login">Đăng nhập ANKT</Link></AuthFrame>;
  async function run(google = false) {
    if (busy || !query.data?.email) return; setBusy(true); setError(''); setMessage('');
    try {
      if (!incomingLink && !google) { await developerSendEmailLink(query.data.email, 'verify-email'); setMessage('Đã gửi liên kết xác nhận. Mở email để hoàn tất xác minh.'); }
      else { await developerVerifyAccountEmail(query.data.email, google); await query.refetch(); setMessage('Email ANKT đã được xác minh.'); }
    } catch (e) { setError(getErrorMessage(e)); } finally { setBusy(false); }
  }
  return <AuthFrame title="Xác minh email ANKT"><p>Xác minh email một lần trước các thao tác nhạy cảm như đổi Client Secret hoặc quản lý thành viên.</p>{query.isPending ? <p>Đang tải tài khoản…</p> : query.isError ? <p role="alert">{getErrorMessage(query.error)}</p> : <p>{query.data?.email || 'Tài khoản chưa có email.'} · {query.data?.emailVerifiedAt ? 'Đã xác minh' : 'Chưa xác minh'}</p>}{error && <p role="alert" className="mini-error">{error}</p>}{message && <p role="status">{message}</p>}{!query.data?.emailVerifiedAt && <div className="mini-stack"><button className="btn primary" disabled={busy || !query.data?.email} onClick={() => void run()}>{busy ? 'Đang xử lý…' : incomingLink ? 'Hoàn tất xác minh email' : 'Gửi liên kết xác minh email'}</button><button className="btn" disabled={busy || !query.data?.email} onClick={() => void run(true)}>Xác nhận email bằng Google</button></div>}<Link to="/developer">Về Developer Console</Link></AuthFrame>;
}

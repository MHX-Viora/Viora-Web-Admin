import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AppWindow, CheckCircle2, Clock3, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Empty, ErrorView, Loading, PageHeader, SearchBox, StatCard, StatusBadge } from '../../components/common';
import { developerLogin, developerLogout, getDeveloperSession } from '../../services/developer-auth.service';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import type { DeveloperProfile } from '../../types/mini-app';
import { QueryState } from './Shared';
import { useDeveloperProfile } from './context';
import './developer.css';
import { DeveloperRegistrationWizard } from './DeveloperRegistrationWizard';
import { DeveloperThemeButton } from './DeveloperThemeButton';

export function DeveloperLoginPage() {
  const navigate = useNavigate(); const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState('');
  const login = useMutation({ mutationFn: () => developerLogin({ identifier, password }), onSuccess: () => { setPassword(''); navigate('/developer', { replace: true }); }, onError: e => toast.error(getErrorMessage(e)) });
  if (getDeveloperSession()) return <Navigate to="/developer" replace />;
  return <main className="developer-login"><section className="detail-card"><DeveloperThemeButton /><span className="page-eyebrow">ANKT Developer</span><h1>Đăng nhập Developer Portal</h1><p>Đăng nhập bằng tài khoản ANKT để quản lý Mini Apps của bạn.</p><form className="mini-stack" onSubmit={e => { e.preventDefault(); login.mutate(); }}><label>Tài khoản<input required autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} /></label><label>Mật khẩu<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><button className="btn primary" disabled={login.isPending}>{login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button></form><Link to="/login">Đến trang quản trị ANKT</Link></section></main>;
}

export function DeveloperLayout() {
  const navigate = useNavigate(); const client = useQueryClient(); const session = getDeveloperSession();
  const profile = useQuery({ queryKey: ['developer-profile', session?.accountId], queryFn: developerApi.profile, enabled: Boolean(session), retry: (count, error) => !(axios.isAxiosError(error) && error.response?.status === 404) && count < 1 });
  if (!session) return <Navigate to="/developer/login" replace />;
  const onboarding = profile.isError && axios.isAxiosError(profile.error) && profile.error.response?.status === 404;
  return <div className="developer-shell"><a className="mini-skip" href="#developer-main">Đến nội dung</a><header className="developer-header"><Link className="developer-brand" to="/developer"><AppWindow size={24} /><strong>ANKT <span>Developer</span></strong></Link><div className="mini-row"><span>{session.displayName}</span><DeveloperThemeButton /><button className="btn" type="button" onClick={() => { developerLogout(); client.removeQueries({ predicate: q => String(q.queryKey[0]).startsWith('developer') }); navigate('/developer/login', { replace: true }); }}><LogOut size={16} /> Đăng xuất</button></div></header><div className="developer-workspace"><nav className="developer-nav" aria-label="Developer navigation"><NavLink to="/developer" end>Tổng quan</NavLink>{profile.data?.status === 'Active' && <><NavLink to="/developer/apps">Mini Apps của tôi</NavLink><NavLink to="/developer/apps/new">Tạo Mini App</NavLink><NavLink to="/developer/team">Thành viên</NavLink></>}<NavLink to="/developer/profile">Hồ sơ Developer</NavLink></nav><main id="developer-main" className="developer-main">{profile.isLoading ? <Loading /> : onboarding ? <DeveloperProfileForm /> : profile.isError ? <ErrorView message={getErrorMessage(profile.error)} onRetry={() => void profile.refetch()} /> : profile.data ? <>{profile.data.status !== 'Active' ? <div className="mini-notice"><p role="status">Hồ sơ Developer: <StatusBadge status={profile.data.status} />. Hồ sơ cần được duyệt trước khi tạo Mini App.</p><button className="btn" type="button" disabled={profile.isFetching} onClick={() => void profile.refetch()}>Kiểm tra trạng thái</button></div> : null}{profile.data.status === 'Active' ? <Outlet context={profile.data} /> : <DeveloperProfileForm key={profile.data.id + profile.data.status} profile={profile.data} />}</> : null}</main></div><footer className="developer-footer">ANKT Mini App Platform · Website và tài khoản đối tác được quản lý bởi từng Developer.</footer></div>;
}

export function DeveloperProfilePage() { const profile = useDeveloperProfile(); return <DeveloperProfileForm profile={profile} />; }
function DeveloperProfileForm({ profile }: { profile?: DeveloperProfile }) {
  return <DeveloperRegistrationWizard key={`${profile?.id ?? 'new'}-${profile?.registrationVersion ?? 0}-${profile?.registrationStatus ?? profile?.status ?? 'Draft'}`} profile={profile} />;
}

export function DeveloperOverviewPage() {
  const profile = useDeveloperProfile(); const query = useQuery({ queryKey: ['developer-apps'], queryFn: () => developerApi.apps() }); const apps = query.data ?? [];
  return <section><PageHeader eyebrow={profile.companyName || profile.name} title="Tổng quan Developer" description="Theo dõi ứng dụng, hoàn tất cấu hình và gửi phiên bản để xét duyệt." actions={<Link className="btn primary" to="/developer/apps/new"><Plus size={16} /> Tạo Mini App</Link>} /><QueryState query={query}><div className="stats-grid"><StatCard icon={<AppWindow />} tone="blue" label="Mini Apps" value={String(apps.length)} /><StatCard icon={<CheckCircle2 />} tone="green" label="Đã duyệt" value={String(apps.filter(a => a.status === 'Active').length)} /><StatCard icon={<Clock3 />} tone="warning" label="Chờ duyệt" value={String(apps.filter(a => a.status === 'PendingReview' || a.pendingVersion).length)} /></div><div className="section-heading"><h2>Ứng dụng của bạn</h2><Link to="/developer/apps">Xem tất cả</Link></div><AppCards apps={apps.slice(0, 6)} /></QueryState></section>;
}
export function DeveloperAppsPage() {
  const [search, setSearch] = useState(''); const query = useQuery({ queryKey: ['developer-apps'], queryFn: () => developerApi.apps() });
  return <section><PageHeader title="Mini Apps của tôi" description="Bản nháp, phiên bản đang xét duyệt và ứng dụng đã phát hành." actions={<Link className="btn primary" to="/developer/apps/new"><Plus size={16} /> Tạo Mini App</Link>} /><div className="toolbar"><SearchBox value={search} onChange={setSearch} placeholder="Tìm tên hoặc slug" /></div><QueryState query={query}><AppCards apps={(query.data ?? []).filter(a => `${a.name} ${a.slug}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))} /></QueryState></section>;
}
function AppCards({ apps }: { apps: Awaited<ReturnType<typeof developerApi.apps>> }) {
  if (!apps.length) return <><Empty /><Link className="btn" to="/developer/apps/new">Tạo ứng dụng đầu tiên</Link></>;
  return <div className="developer-apps">{apps.map(app => <Link className="developer-app-card" key={app.id} to={`/developer/apps/${app.id}`}><div className="mini-app-identity">{app.iconUrl ? <img src={app.iconUrl} alt={`Logo ${app.name}`} /> : <span className="mini-app-icon">{app.name.slice(0, 1)}</span>}<div><h2>{app.name}</h2><span className="mini-muted">{app.category || app.slug}</span></div></div><p>{app.description || 'Chưa có mô tả'}</p><div className="mini-row"><StatusBadge status={app.status} /><small>{app.authenticationMode === 'Independent' ? 'Standard WebView' : 'ANKT SSO'}</small>{app.pendingVersion ? <small>Phiên bản {app.pendingVersion} chờ duyệt</small> : null}</div></Link>)}</div>;
}

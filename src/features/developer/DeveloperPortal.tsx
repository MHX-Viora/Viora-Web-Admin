import { InvitationInbox } from './InvitationInbox';
import { useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppWindow, CheckCircle2, Clock3, LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Empty, ErrorView, Loading, PageHeader, Pagination, SearchBox, StatCard, StatusBadge } from '../../components/common';
import { developerLogin, developerLogout, getDeveloperSession } from '../../services/developer-auth.service';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import type { DeveloperProfile } from '../../types/mini-app';
import { QueryState } from './Shared';
import { DeveloperProfileContext, useDeveloperProfile } from './context';
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
  const navigate = useNavigate(); const location = useLocation(); const client = useQueryClient(); const session = getDeveloperSession();
  const profile = useQuery({ queryKey: ['developer-profile', session?.accountId], queryFn: developerApi.profile, enabled: Boolean(session), retry: (count, error) => !(axios.isAxiosError(error) && error.response?.status === 404) && count < 1 });
  const onboarding = profile.isError && axios.isAxiosError(profile.error) && profile.error.response?.status === 404;
  const accessible = useQuery({ queryKey: ['developer-apps'], queryFn: () => developerApi.apps(), enabled: Boolean(session) && (onboarding || (!!profile.data && profile.data.status !== 'Active')) });
  if (!session) return <Navigate to="/developer/welcome" replace />;
  if (onboarding && accessible.isLoading) return <Loading />;
  const scoped = !!accessible.data?.length && profile.data?.status !== 'Active' && !location.pathname.endsWith('/profile');
  const scopeContext: DeveloperProfile = { id: '', name: session.displayName, email: '', status: 'Draft', miniAppCount: accessible.data?.length || 0, createdAt: '', updatedAt: '', membershipRole: 'Viewer' };
  return <div className="developer-shell"><a className="mini-skip" href="#developer-main">Đến nội dung</a><header className="developer-header"><Link className="developer-brand" to="/developer"><AppWindow size={24} /><strong>ANKT <span>Developer</span></strong></Link><div className="mini-row"><span>{session.displayName}</span><OrganizationSelector /><DeveloperThemeButton /><button className="btn" type="button" onClick={() => { developerLogout(); client.removeQueries({ predicate: q => String(q.queryKey[0]).startsWith('developer') }); navigate('/developer/login', { replace: true }); }}><LogOut size={16} /> Đăng xuất</button></div></header><div className="developer-workspace"><nav className="developer-nav" aria-label="Developer navigation"><NavLink to="/developer" end>Tổng quan</NavLink>{(profile.data?.status === 'Active' || scoped) && <><NavLink to="/developer/apps">Mini Apps của tôi</NavLink>{!scoped && <NavLink to="/developer/apps/new">Tạo Mini App</NavLink>} {!scoped && <NavLink to="/developer/team">Thành viên</NavLink>}</>}<NavLink to="/developer/profile">Hồ sơ Developer</NavLink></nav><main id="developer-main" className="developer-main"><InvitationInbox />{profile.isLoading ? <Loading /> : onboarding ? scoped ? <DeveloperProfileContext.Provider value={scopeContext}><p className="mini-notice">Bạn đang truy cập ứng dụng được mời. Hồ sơ tổ chức và quyền tạo ứng dụng được quản lý riêng.</p><Outlet context={scopeContext} /></DeveloperProfileContext.Provider> : <DeveloperProfileForm /> : profile.isError ? <ErrorView message={getErrorMessage(profile.error)} onRetry={() => void profile.refetch()} /> : profile.data ? <>{profile.data.status !== 'Active' ? <div className="mini-notice"><p role="status">Hồ sơ Developer: <StatusBadge status={profile.data.status} />. Hồ sơ cần được duyệt trước khi tạo Mini App.</p><button className="btn" type="button" disabled={profile.isFetching} onClick={() => void profile.refetch()}>Kiểm tra trạng thái</button></div> : null}{profile.data.status === 'Active' || scoped ? <DeveloperProfileContext.Provider value={profile.data}><Outlet context={profile.data} /></DeveloperProfileContext.Provider> : <DeveloperProfileForm key={profile.data.id + profile.data.status} profile={profile.data} />}</> : null}</main></div><footer className="developer-footer">ANKT Mini App Platform · Website và tài khoản đối tác được quản lý bởi từng Developer.</footer></div>;
}

export function DeveloperProfilePage() { const profile = useDeveloperProfile(); return <DeveloperProfileForm profile={profile.id ? profile : undefined} />; }
function DeveloperProfileForm({ profile }: { profile?: DeveloperProfile }) {
  return <DeveloperRegistrationWizard key={`${profile?.id ?? 'new'}-${profile?.registrationVersion ?? 0}-${profile?.registrationStatus ?? profile?.status ?? 'Draft'}`} profile={profile} />;
}

export function DeveloperOverviewPage() {
  const profile = useDeveloperProfile(); const query = useQuery({ queryKey: ['developer-apps'], queryFn: () => developerApi.apps() }); const apps = query.data ?? [];
  return <section><PageHeader eyebrow={profile.companyName || profile.name} title="Tổng quan Developer" description="Theo dõi ứng dụng, hoàn tất cấu hình và gửi phiên bản để xét duyệt." actions={profile.status === 'Active' && ['Owner','Admin','Developer','Member'].includes(profile.membershipRole || '') ? <Link className="btn primary" to="/developer/apps/new"><Plus size={16} /> Tạo Mini App</Link> : undefined} /><QueryState query={query}><div className="stats-grid"><StatCard icon={<AppWindow />} tone="blue" label="Mini Apps" value={String(apps.length)} /><StatCard icon={<CheckCircle2 />} tone="green" label="Đã duyệt" value={String(apps.filter(a => a.status === 'Active').length)} /><StatCard icon={<Clock3 />} tone="warning" label="Chờ duyệt" value={String(apps.filter(a => a.status === 'PendingReview' || a.pendingVersion).length)} /></div><div className="section-heading"><h2>Ứng dụng của bạn</h2><Link to="/developer/apps">Xem tất cả</Link></div><AppCards apps={apps.slice(0, 6)} /></QueryState></section>;
}
export function DeveloperAppsPage() {
  const profile = useDeveloperProfile();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [sort, setSort] = useState('updated'); const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['developer-apps'], queryFn: () => developerApi.apps() });
  const filtered = (query.data ?? []).filter(a => `${a.name} ${a.slug} ${a.id}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!status || a.status === status)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'vi') : Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 12)));
  return <section><PageHeader title="Mini Apps của tôi" description="Quản lý bản nháp, xét duyệt và phát hành từ một nơi." actions={profile.status === 'Active' && ['Owner','Admin','Developer','Member'].includes(profile.membershipRole || '') ? <Link className="btn primary" to="/developer/apps/new"><Plus size={16} /> Tạo Mini App</Link> : undefined} /><div className="toolbar"><SearchBox value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Tìm tên, slug hoặc App ID" /><label>Trạng thái<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Tất cả</option>{['Draft','PendingReview','Active','Rejected','Suspended'].map(value => <option key={value}>{value}</option>)}</select></label><label>Sắp xếp<select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}><option value="updated">Cập nhật gần nhất</option><option value="name">Tên ứng dụng</option></select></label></div><QueryState query={query}>{filtered.length ? <AppCards apps={filtered.slice((currentPage - 1) * 12, currentPage * 12)} /> : <div className="detail-card"><h2>{query.data?.length ? 'Không tìm thấy ứng dụng' : 'Chưa có Mini App'}</h2><p>{query.data?.length ? 'Thử từ khóa hoặc trạng thái khác.' : 'Tạo bản nháp đầu tiên để bắt đầu tích hợp website với ANKT.'}</p></div>}<Pagination page={currentPage} pageSize={12} total={filtered.length} onPageChange={setPage} onPageSizeChange={() => undefined} /></QueryState></section>;
}
function AppCards({ apps }: { apps: Awaited<ReturnType<typeof developerApi.apps>> }) {
  if (!apps.length) return <><Empty /><Link className="btn" to="/developer/apps/new">Tạo ứng dụng đầu tiên</Link></>;
  return <div className="developer-apps">{apps.map(app => <Link className="developer-app-card" key={app.id} to={`/developer/apps/${app.id}`}><div className="mini-app-identity">{app.iconUrl ? <img src={app.iconUrl} alt={`Logo ${app.name}`} /> : <span className="mini-app-icon">{app.name.slice(0, 1)}</span>}<div><h2>{app.name}</h2><span className="mini-muted">{app.category || app.slug}</span></div></div><p>{app.description || 'Chưa có mô tả'}</p><dl className="mini-definition"><dt>App ID</dt><dd><code>{app.id}</code></dd><dt>Website</dt><dd>{app.webUrl}</dd><dt>Cập nhật</dt><dd>{new Date(app.updatedAt).toLocaleDateString('vi-VN')}</dd><dt>Đã phát hành</dt><dd>Phiên bản {app.publishedVersion || 0}</dd></dl><div className="mini-row"><StatusBadge status={app.status} /><small>{app.authenticationMode === 'Independent' ? 'Standard WebView' : 'ANKT SSO'}</small>{app.pendingVersion ? <small>Phiên bản {app.pendingVersion} chờ duyệt</small> : null}</div></Link>)}</div>;
}

function OrganizationSelector() {
  const client = useQueryClient(); const [selected, setSelected] = useState('');
  const query = useQuery({ queryKey: ['developer-organizations'], queryFn: developerApi.organizations });
  if (!query.data?.length) return null;
  return <label className="developer-org-select">Tổ chức<select aria-label="Chọn tổ chức Developer" value={selected || query.data[0].id} onChange={event => { const id = event.target.value; setSelected(id); developerApi.selectOrganization(id); void client.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith('developer') }); }}>{query.data.map(org => <option key={org.id} value={org.id}>{org.name} · {org.role}</option>)}</select></label>;
}

import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronLeft, ChevronRight, ClipboardCheck, Command, FileText, Flag,
  Hash, Home, LogOut, Menu, MessageSquare, Moon, Search, ScrollText,
  ShieldCheck, Sparkles, Sun, Users, Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserAvatar } from '../components/common';
import { getCurrentUser, logout } from '../services/auth.service';

type MenuItem = { to: string; label: string; icon: LucideIcon };
type MenuGroup = { label: string; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ to: '/', label: 'Bảng điều khiển', icon: Home }],
  },
  {
    label: 'Quản lý',
    items: [
      { to: '/users', label: 'Người dùng', icon: Users },
      { to: '/identities', label: 'Xác thực danh tính', icon: ShieldCheck },
      { to: '/posts', label: 'Bài viết', icon: FileText },
      { to: '/videos', label: 'Video ngắn', icon: Video },
      { to: '/reports', label: 'Báo cáo', icon: Flag },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/hashtags', label: 'Hashtag', icon: Hash },
      { to: '/chat-rooms', label: 'Phòng chat', icon: MessageSquare },
      { to: '/notifications', label: 'Thông báo hệ thống', icon: Bell },
      { to: '/admin-logs', label: 'Nhật ký quản trị', icon: ScrollText },
      { to: '/legal', label: 'Tài liệu pháp lý', icon: ClipboardCheck },
    ],
  },
];

const allMenuItems = menuGroups.flatMap((group) => group.items);

export function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = getCurrentUser();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('viora_admin_sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('viora_admin_theme') === 'dark' ? 'dark' : 'light');
  const [clock, setClock] = useState(() => new Date());
  const current = useMemo(
    () => allMenuItems.find((item) => item.to === location.pathname || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)))?.label ?? 'Bảng điều khiển',
    [location.pathname],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('viora_admin_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('viora_admin_sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function handleLogout() {
    await logout();
    onLogout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`admin-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && <button aria-label="Đóng menu" className="sidebar-scrim" onClick={() => setMobileOpen(false)} type="button" />}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><ClipboardCheck size={21} /></span>
          <div className="brand-copy"><strong>ANKT Admin</strong><span>Control Center · v1.0</span></div>
          <button aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} className="sidebar-toggle" onClick={() => setCollapsed((value) => !value)} type="button">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav aria-label="Điều hướng quản trị">
          {menuGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink aria-label={label} data-tooltip={label} key={to} onClick={() => setMobileOpen(false)} to={to} end={to === '/'}>
                  <Icon aria-hidden size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <UserAvatar name={admin?.displayName || 'ANKT Admin'} src={admin?.avatarUrl} />
          <div><strong>{admin?.displayName || 'ANKT Admin'}</strong><span>Quản trị viên</span></div>
          <button aria-label="Đăng xuất" className="icon-button" onClick={() => void handleLogout()} type="button"><LogOut size={17} /></button>
        </div>
      </aside>
      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-leading">
            <button aria-label="Mở menu" className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} type="button"><Menu size={19} /></button>
            <div className="page-context"><span>Quản trị / {current}</span><strong>{current}</strong></div>
          </div>
          <label className="global-search">
            <Search size={17} />
            <input aria-label="Tìm kiếm nhanh" placeholder="Tìm kiếm trong hệ thống…" />
            <kbd><Command size={12} /> K</kbd>
          </label>
          <div className="topbar-actions">
            <time className="realtime-clock" dateTime={clock.toISOString()}>{clock.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>
            <button aria-label="Thao tác nhanh" className="icon-button" title="Thao tác nhanh" type="button"><Sparkles size={18} /></button>
            <button aria-label="Thông báo" className="icon-button notification-button" title="Thông báo" type="button"><Bell size={18} /><span /></button>
            <button aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} className="icon-button" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} type="button">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="topbar-profile"><UserAvatar name={admin?.displayName || 'ANKT Admin'} src={admin?.avatarUrl} size="sm" /><div><strong>{admin?.displayName || 'ANKT Admin'}</strong><span>Quản trị viên</span></div></div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}

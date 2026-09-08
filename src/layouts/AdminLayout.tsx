import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronLeft, ChevronRight, ClipboardCheck, Command, FileText, Flag,
  Hash, Home, LogOut, Menu, MessageSquare, Moon, ScrollText,
  Search, ShieldCheck, Sun, Users, Video, AppWindow, Code2, Sticker,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserAvatar } from '../components/common';
import { getCurrentUser, logout } from '../services/auth.service';
import { filterNavigationItems } from './admin-navigation';

type MenuItem = { to: string; label: string; icon: LucideIcon };
type MenuGroup = { label: string; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [{ to: '/', label: 'Bảng điều khiển', icon: Home }],
  },
  {
    label: 'Vận hành',
    items: [
      { to: '/users', label: 'Người dùng', icon: Users },
      { to: '/chat-rooms', label: 'Phòng chat', icon: MessageSquare },
    ],
  },
  {
    label: 'Kiểm duyệt',
    items: [
      { to: '/reports', label: 'Báo cáo', icon: Flag },
      { to: '/identities', label: 'Xác thực danh tính', icon: ShieldCheck },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { to: '/posts', label: 'Bài viết', icon: FileText },
      { to: '/videos', label: 'Video ngắn', icon: Video },
      { to: '/hashtags', label: 'Hashtag', icon: Hash },
      { to: '/stickers', label: 'Nhãn dán', icon: Sticker },
    ],
  },
  {
    label: 'Nền tảng',
    items: [
      { to: '/mini-apps', label: 'Mini Apps', icon: AppWindow },
      { to: '/developers', label: 'Developers', icon: Code2 },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/notifications', label: 'Thông báo hệ thống', icon: Bell },
      { to: '/admin-logs', label: 'Nhật ký quản trị', icon: ScrollText },
      { to: '/legal', label: 'Tài liệu pháp lý', icon: ClipboardCheck },
    ],
  },
];

const allMenuItems = menuGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
const SIDEBAR_KEY = 'ankt_admin_sidebar';
const THEME_KEY = 'ankt_admin_theme';
const LEGACY_SIDEBAR_KEY = 'viora_admin_sidebar';
const LEGACY_THEME_KEY = 'viora_admin_theme';

export function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = getCurrentUser();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(() => readMigratedPreference(SIDEBAR_KEY, LEGACY_SIDEBAR_KEY) === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readMigratedPreference(THEME_KEY, LEGACY_THEME_KEY) === 'dark' ? 'dark' : 'light');
  const [clock, setClock] = useState(() => new Date());
  const current = useMemo(
    () => allMenuItems.find((item) => item.to === location.pathname || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)))?.label ?? 'Bảng điều khiển',
    [location.pathname],
  );
  const searchResults = useMemo(() => filterNavigationItems(allMenuItems, searchQuery).slice(0, 8), [searchQuery]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        window.requestAnimationFrame(() => searchRef.current?.focus());
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (!searchContainerRef.current?.contains(event.target as Node)) setSearchOpen(false);
    }
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  function openSearch() {
    setSearchOpen(true);
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }

  function goToSearchResult(to: string) {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(to);
  }

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
          <span aria-hidden className="brand-mark"><img alt="" src="/ankt-logo.png" /></span>
          <div className="brand-copy"><strong>ANKT Admin</strong><span>Trung tâm quản trị hệ thống</span></div>
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
          <div className={`global-nav-search ${searchOpen ? 'open' : ''}`} ref={searchContainerRef}>
            <Search aria-hidden size={16} />
            <input
              aria-label="Tìm trang quản trị"
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchResults[0]) goToSearchResult(searchResults[0].to);
              }}
              placeholder="Đi đến người dùng, báo cáo…"
              ref={searchRef}
              value={searchQuery}
            />
            <kbd><Command size={11} />K</kbd>
            {searchOpen ? (
              <div className="global-nav-results" role="listbox" aria-label="Kết quả điều hướng">
                {searchResults.length > 0 ? searchResults.map(({ to, label, group, icon: Icon }) => (
                  <button aria-selected="false" key={to} onMouseDown={(event) => event.preventDefault()} onClick={() => goToSearchResult(to)} role="option" type="button">
                    <Icon aria-hidden size={16} /><span><strong>{label}</strong><small>{group}</small></span><span>Đi đến</span>
                  </button>
                )) : <p>Không tìm thấy trang phù hợp</p>}
              </div>
            ) : null}
          </div>
          <div className="topbar-actions">
            <time className="realtime-clock" dateTime={clock.toISOString()}>{clock.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>
            <button aria-label="Mở tìm kiếm điều hướng" className="icon-button mobile-search-button" onClick={openSearch} type="button"><Search size={18} /></button>
            <NavLink aria-label="Mở thông báo hệ thống" className="icon-button notification-button" title="Thông báo hệ thống" to="/notifications"><Bell size={18} /><span /></NavLink>
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

function readMigratedPreference(key: string, legacyKey: string) {
  const current = localStorage.getItem(key);
  if (current !== null) return current;

  const legacy = localStorage.getItem(legacyKey);
  if (legacy !== null) {
    localStorage.setItem(key, legacy);
    localStorage.removeItem(legacyKey);
  }
  return legacy;
}

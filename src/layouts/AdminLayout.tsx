import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ClipboardCheck,
  FileText,
  Flag,
  Hash,
  Home,
  LogOut,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react';
import { UserAvatar } from '../components/common';
import { logout } from '../services/auth.service';

const menu = [
  { to: '/', label: 'Bảng điều khiển', icon: Home },
  { to: '/users', label: 'Người dùng', icon: Users },
  { to: '/identities', label: 'Xác thực danh tính', icon: ShieldCheck },
  { to: '/posts', label: 'Bài viết', icon: FileText },
  { to: '/videos', label: 'Video ngắn', icon: Video },
  { to: '/reports', label: 'Báo cáo', icon: Flag },
  { to: '/hashtags', label: 'Hashtag', icon: Hash },
  { to: '/chat-rooms', label: 'Phòng chat', icon: MessageSquare },
  { to: '/notifications', label: 'Thông báo hệ thống', icon: Bell },
  { to: '/admin-logs', label: 'Nhật ký quản trị', icon: ScrollText },
];

export function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = menu.find((item) => item.to === location.pathname)?.label ?? 'Bảng điều khiển';

  async function handleLogout() {
    await logout();
    onLogout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <ClipboardCheck size={24} />
          <span>Viora</span>
        </div>
        <nav>
          {menu.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">Quản trị / {current}</div>
          <div className="admin-profile">
            <UserAvatar name="Viora Admin" />
            <div>
              <strong>Viora Admin</strong>
              <span>Quản trị viên cấp cao</span>
            </div>
            <button className="btn ghost" onClick={handleLogout} type="button">
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

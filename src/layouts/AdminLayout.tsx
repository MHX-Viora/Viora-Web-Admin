import { NavLink, Outlet, useLocation } from 'react-router-dom';
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

const menu = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/users', label: 'Nguoi dung', icon: Users },
  { to: '/identities', label: 'Xac thuc danh tinh', icon: ShieldCheck },
  { to: '/posts', label: 'Bai viet', icon: FileText },
  { to: '/videos', label: 'Video ngan', icon: Video },
  { to: '/reports', label: 'Bao cao', icon: Flag },
  { to: '/hashtags', label: 'Hashtag', icon: Hash },
  { to: '/chat-rooms', label: 'Phong chat', icon: MessageSquare },
  { to: '/notifications', label: 'Thong bao he thong', icon: Bell },
  { to: '/admin-logs', label: 'Nhat ky Admin', icon: ScrollText },
];

export function AdminLayout() {
  const location = useLocation();
  const current = menu.find((item) => item.to === location.pathname)?.label ?? 'Dashboard';

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
          <div className="breadcrumbs">Admin / {current}</div>
          <div className="admin-profile">
            <UserAvatar name="Viora Admin" />
            <div>
              <strong>Viora Admin</strong>
              <span>Super Admin</span>
            </div>
            <button className="btn ghost" type="button">
              <LogOut size={16} />
              Logout
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

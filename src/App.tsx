import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { IdentitiesPage } from './pages/IdentitiesPage';
import { PostsPage } from './pages/PostsPage';
import { VideosPage } from './pages/VideosPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { AdminLogsPage, ChatRoomsPage, HashtagsPage, NotificationsPage } from './pages/MetaPages';
import { LoginPage } from './pages/LoginPage';
import { isAuthenticated, setupAuthInterceptors, subscribeAuthChange } from './services/auth.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

setupAuthInterceptors();

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Admin app crashed', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-error" role="alert">
          <h1>Khong tai duoc trang quan tri</h1>
          <p>{this.state.error.message || 'Da co loi xay ra khi hien thi ung dung.'}</p>
          <button className="btn primary" type="button" onClick={() => window.location.assign('/')}>
            Tai lai
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated());

  useEffect(() => {
    return subscribeAuthChange(() => setAuthenticated(isAuthenticated()));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="login" element={authenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={() => setAuthenticated(true)} />} />
            <Route element={authenticated ? <AdminLayout onLogout={() => setAuthenticated(false)} /> : <Navigate to="/login" replace />}>
              <Route index element={<DashboardPage />} />
              <Route path="admin" element={<Navigate to="/" replace />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="admin/users/:id" element={<UserDetailPage />} />
              <Route path="identities" element={<IdentitiesPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="posts/:id" element={<PostDetailPage />} />
              <Route path="admin/posts/:id" element={<PostDetailPage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="admin/videos/:id" element={<VideoDetailPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="admin/reports/:id" element={<ReportDetailPage />} />
              <Route path="hashtags" element={<HashtagsPage />} />
              <Route path="chat-rooms" element={<ChatRoomsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="admin-logs" element={<AdminLogsPage />} />
            </Route>
            <Route path="*" element={<Navigate to={authenticated ? '/' : '/login'} replace />} />
          </Routes>
        </BrowserRouter>
      </AppErrorBoundary>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

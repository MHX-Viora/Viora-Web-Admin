import { DeveloperDocumentationPage } from './features/developer/DeveloperDocumentationPage';
import { DeveloperWelcomePage, DeveloperSignInPage, DeveloperSignUpPage, DeveloperForgotPasswordPage, DeveloperVerifyEmailPage } from './features/developer/DeveloperAuthPages';
import { DeveloperLayout, DeveloperOverviewPage, DeveloperAppsPage, DeveloperProfilePage } from './features/developer/DeveloperPortal';
import { DeveloperAppLayout, DeveloperAppDetailsPage, DeveloperReleasesPage, DeveloperSettingsPage, DeveloperPermissionsPage } from './features/developer/DeveloperAppPage';
import { DeveloperAppMembersPage, DeveloperConnectionPage, DeveloperDomainsPage, DeveloperSsoPage, DeveloperAnalyticsPage, DeveloperAuditPage, DeveloperTeamPage } from './features/developer/DeveloperToolsPages';
import { CreateMiniAppPage } from './features/developer/CreateMiniAppPage';
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
import { LegalDocumentsPage } from './pages/LegalDocumentsPage';
import { MiniAppsPage } from './pages/MiniAppsPage';
import { MiniAppDetailPage } from './pages/MiniAppDetailPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { DeveloperReviewPage } from './pages/DeveloperReviewPage';
import { StickerPacksPage } from './pages/StickerPacksPage';
import { FinancePage } from './pages/FinancePage';
import { WithdrawalDetailPage } from './pages/WithdrawalDetailPage';
import { AdvertisementsPage } from './pages/AdvertisementsPage';
import { isAuthenticated, setupAuthInterceptors, subscribeAuthChange } from './services/auth.service';
import { MiniAppEditorialPage } from './pages/MiniAppEditorialPage';
import { MiniAppAuditPage, MiniAppPolicyPage, MiniAppReportsPage } from './pages/MiniAppPolicyPage';
import { AdminMiniAppCreatePage } from './pages/AdminMiniAppCreatePage';

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
            <Route path="developer/docs" element={<DeveloperDocumentationPage />} /><Route path="developer/docs/:documentId" element={<DeveloperDocumentationPage />} />
            <Route path="developer/welcome" element={<DeveloperWelcomePage />} />
            <Route path="developer/login" element={<DeveloperSignInPage />} />
            <Route path="developer/signup" element={<DeveloperSignUpPage />} />
            <Route path="developer/verify-email" element={<DeveloperVerifyEmailPage />} />
            <Route path="developer/forgot-password" element={<DeveloperForgotPasswordPage />} />
            <Route path="developer" element={<DeveloperLayout />}>
              <Route index element={<DeveloperOverviewPage />} /><Route path="profile" element={<DeveloperProfilePage />} />
              <Route path="apps" element={<DeveloperAppsPage />} /><Route path="apps/new" element={<CreateMiniAppPage />} />
              <Route path="team" element={<DeveloperTeamPage />} />
              <Route path="apps/:id" element={<DeveloperAppLayout />}>
                <Route index element={<DeveloperAppDetailsPage />} /><Route path="connection" element={<DeveloperConnectionPage />} />
                <Route path="domains" element={<DeveloperDomainsPage />} /><Route path="sso" element={<DeveloperSsoPage />} />
                <Route path="members" element={<DeveloperAppMembersPage />} /><Route path="releases" element={<DeveloperReleasesPage />} />
                <Route path="analytics" element={<DeveloperAnalyticsPage />} /><Route path="settings" element={<DeveloperSettingsPage />} />
                <Route path="audit" element={<DeveloperAuditPage />} /><Route path="permissions" element={<DeveloperPermissionsPage />} />
              </Route>
            </Route>
            <Route path="login" element={authenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={() => setAuthenticated(true)} />} />
            <Route element={authenticated ? <AdminLayout onLogout={() => setAuthenticated(false)} /> : <Navigate to="/login" replace />}>
              <Route index element={<DashboardPage />} />
              <Route path="admin" element={<Navigate to="/" replace />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="admin/users/:id" element={<UserDetailPage />} />
              <Route path="identities" element={<IdentitiesPage />} />
              <Route path="posts" element={<PostsPage key="posts" />} />
              <Route path="articles" element={<PostsPage key="articles" scope="articles" />} />
              <Route path="articles/:id" element={<PostDetailPage scope="articles" />} />
              <Route path="admin/articles/:id" element={<PostDetailPage scope="articles" />} />
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
              <Route path="legal" element={<LegalDocumentsPage />} />
              <Route path="mini-apps" element={<MiniAppsPage />} />
              <Route path="mini-apps/pending" element={<MiniAppsPage key="pending" pendingOnly />} />
              <Route path="mini-apps/new" element={<AdminMiniAppCreatePage />} />
              <Route path="mini-apps/policy" element={<MiniAppPolicyPage />} />
              <Route path="mini-apps/editorial" element={<MiniAppEditorialPage />} />
              <Route path="mini-apps/reports" element={<MiniAppReportsPage />} />
              <Route path="mini-apps/audit" element={<MiniAppAuditPage />} />
              <Route path="mini-apps/:id" element={<MiniAppDetailPage />} />
              <Route path="developers" element={<DevelopersPage />} />
              <Route path="developers/:id" element={<DeveloperReviewPage />} />
              <Route path="stickers" element={<StickerPacksPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="finance/withdrawals/:id" element={<WithdrawalDetailPage />} />
              <Route path="advertisements" element={<AdvertisementsPage />} />
            </Route>
            <Route path="*" element={<Navigate to={authenticated ? '/' : '/login'} replace />} />
          </Routes>
        </BrowserRouter>
      </AppErrorBoundary>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

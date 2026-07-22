import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { IdentitiesPage } from './pages/IdentitiesPage';
import { ContentPage } from './pages/ContentPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminLogsPage, ChatRoomsPage, HashtagsPage, NotificationsPage } from './pages/MetaPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="identities" element={<IdentitiesPage />} />
            <Route path="posts" element={<ContentPage type="posts" />} />
            <Route path="videos" element={<ContentPage type="videos" />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="hashtags" element={<HashtagsPage />} />
            <Route path="chat-rooms" element={<ChatRoomsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="admin-logs" element={<AdminLogsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

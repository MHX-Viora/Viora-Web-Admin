import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ErrorView, Loading } from '../components/common';
import { AdminMiniAppReview } from '../features/mini-app-review/AdminMiniAppReview';
import { getMiniApp } from '../services/admin-mini-app.service';
import { getErrorMessage } from '../services/http';

export function MiniAppDetailPage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: ['mini-app', id], queryFn: () => getMiniApp(id), enabled: Boolean(id) });
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data) return <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} />;
  return <AdminMiniAppReview key={query.data.updatedAt} app={query.data} />;
}

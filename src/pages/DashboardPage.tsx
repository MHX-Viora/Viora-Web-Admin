import { useQuery } from '@tanstack/react-query';
import { FileText, Flag, MessageSquare, ShieldCheck, Users, Video, Activity, UserPlus, MessageCircle } from 'lucide-react';
import { ErrorView, Loading, PageHeader, StatCard } from '../components/common';
import { getDashboardStats } from '../services/admin-dashboard.service';
import { getErrorMessage } from '../services/http';
import { formatNumber } from '../utils/format';

const stats = [
  ['totalUsers', 'Tong nguoi dung', Users, 'blue'],
  ['newUsersToday', 'Nguoi dung moi hom nay', UserPlus, 'green'],
  ['activeUsersToday', 'Hoat dong hom nay', Activity, 'teal'],
  ['totalPosts', 'Tong bai viet', FileText, 'amber'],
  ['totalVideos', 'Tong video', Video, 'rose'],
  ['totalComments', 'Tong binh luan', MessageCircle, 'violet'],
  ['chatRooms', 'Phong chat', MessageSquare, 'cyan'],
  ['pendingReports', 'Bao cao cho xu ly', Flag, 'red'],
  ['pendingIdentities', 'CCCD cho duyet', ShieldCheck, 'indigo'],
] as const;

export function DashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats });

  return (
    <section>
      <PageHeader title="Dashboard" description="Tong quan tinh trang van hanh cua Viora." />
      {query.isLoading ? <Loading rows={9} /> : null}
      {query.isError ? <ErrorView message={getErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <div className="stats-grid">
          {stats.map(([key, label, Icon, tone]) => (
            <StatCard key={key} icon={<Icon size={20} />} label={label} value={formatNumber(query.data[key])} tone={tone} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

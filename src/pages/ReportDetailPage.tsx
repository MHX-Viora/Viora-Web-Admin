import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ConfirmDialog, ErrorView, Loading, PageHeader } from '../components/common';
import { ReasonBadge, ReportStatusBadge, TargetTypeBadge } from '../components/ReportManagement/ReportBadges';
import { getErrorMessage } from '../services/http';
import { getReport, reviewReport } from '../services/admin-report.service';
import { formatDate } from '../utils/format';

type PendingAction = { status: 'approved'; action: string } | { status: 'rejected' };

export function ReportDetailPage() {
  const { id } = useParams();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['report', id], queryFn: () => getReport(id ?? ''), enabled: Boolean(id) });
  const mutation = useMutation({
    mutationFn: (payload: PendingAction) => reviewReport(id ?? '', payload),
    onSuccess: () => {
      toast.success('Đã cập nhật báo cáo');
      setPending(null);
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
      void queryClient.invalidateQueries({ queryKey: ['report', id] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (query.isLoading) return <Loading rows={5} />;

  if (query.isError || !query.data) {
    return (
      <section>
        <PageHeader title="Không tìm thấy báo cáo" actions={<BackButton />} />
        <ErrorView message={query.error ? getErrorMessage(query.error) : 'Báo cáo không tồn tại.'} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const report = query.data.summary;

  return (
    <section className="post-detail-page">
      <div className="breadcrumb-row">
        <Link to="/">Bảng điều khiển</Link>
        <span>/</span>
        <Link to="/reports">Báo cáo</Link>
        <span>/</span>
        <strong>Chi tiết</strong>
      </div>
      <PageHeader
        title="Chi tiết báo cáo"
        description={report.reporterDisplayName || report.reporterUserId}
        actions={<div className="row-actions"><BackButton /><button className="btn" onClick={() => void query.refetch()} type="button"><RefreshCw size={16} />Làm mới</button></div>}
      />
      <div className="post-detail-layout">
        <div className="user-card">
          <h2>Nội dung báo cáo</h2>
          <div className="detail-grid">
            <span>Người báo cáo</span><strong>{report.reporterDisplayName || '-'}</strong>
            <span>ID người báo cáo</span><strong className="mono-value">{report.reporterUserId}</strong>
            <span>Đối tượng</span><strong><TargetTypeBadge value={report.targetType} /></strong>
            <span>ID đối tượng</span><strong className="mono-value">{report.targetId}</strong>
            <span>Lý do</span><strong><ReasonBadge value={report.reason} /></strong>
            <span>Trạng thái</span><strong><ReportStatusBadge value={report.status} /></strong>
            <span>Ngày tạo</span><strong>{formatDate(report.createdAt)}</strong>
          </div>
          <h3>Mô tả</h3>
          <p className="post-full-content">{report.description || 'Không có mô tả.'}</p>
        </div>
        <div className="user-card">
          <h2>Đối tượng bị báo cáo</h2>
          <pre className="json-preview">{formatTarget(query.data.target)}</pre>
          <div className="action-grid">
            <button className="btn primary" onClick={() => setPending({ status: 'approved', action: 'HidePost' })} type="button">Duyệt và ẩn</button>
            <button className="btn danger" onClick={() => setPending({ status: 'rejected' })} type="button">Từ chối</button>
          </div>
        </div>
      </div>
      {pending ? (
        <ConfirmDialog
          title="Xác nhận xử lý báo cáo"
          description={pending.status === 'approved' ? 'Báo cáo sẽ được duyệt với hành động ẩn nội dung.' : 'Báo cáo sẽ được đánh dấu từ chối.'}
          confirmText="Xác nhận"
          loading={mutation.isPending}
          onCancel={() => setPending(null)}
          onConfirm={() => mutation.mutate(pending)}
        />
      ) : null}
    </section>
  );
}

function BackButton() {
  return <Link className="btn" to="/reports"><ArrowLeft size={16} />Quay lại</Link>;
}

function formatTarget(target: unknown) {
  if (!target) return 'Không có dữ liệu đối tượng.';
  try {
    return JSON.stringify(target, null, 2);
  } catch {
    return String(target);
  }
}

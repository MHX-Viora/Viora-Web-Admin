import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Heart, MessageCircle, RefreshCw, Share2, UserRound } from 'lucide-react';
import { ConfirmDialog, ErrorView, Loading, PageHeader, UserAvatar } from '../components/common';
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
          <ReportTargetDetails target={query.data.target} targetId={report.targetId} />
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

function ReportTargetDetails({ target, targetId }: { target: unknown; targetId: string }) {
  if (!isRecord(target)) {
    return <div className="report-target-empty"><Eye size={28} /><strong>Không có dữ liệu chi tiết</strong><span>ID: {targetId}</span></div>;
  }
  const displayName = text(target.displayName) || text(target.userName) || text(target.authorName) || 'Người dùng';
  const avatarUrl = text(target.avatarUrl);
  const content = text(target.content) || text(target.description) || text(target.caption);
  const status = target.status;
  const media = Array.isArray(target.media) ? target.media.filter(isRecord) : [];
  const metrics = [
    { label: 'Lượt xem', value: number(target.viewCount), icon: Eye },
    { label: 'Cảm xúc', value: number(target.reactionCount), icon: Heart },
    { label: 'Bình luận', value: number(target.commentCount), icon: MessageCircle },
    { label: 'Chia sẻ', value: number(target.shareCount), icon: Share2 },
  ];

  return (
    <div className="report-target-details">
      <div className="report-target-author">
        <UserAvatar name={displayName} src={avatarUrl} size="lg" />
        <div>
          <span>Chủ sở hữu nội dung</span>
          <strong>{displayName}</strong>
          <small className="mono-value">{text(target.userId) || 'Không có User ID'}</small>
        </div>
      </div>
      <div className="report-target-meta">
        <div><span>ID đối tượng</span><strong className="mono-value">{text(target.id) || targetId}</strong></div>
        <div><span>Loại nội dung</span><strong>{postTypeLabel(target.postType)}</strong></div>
        <div><span>Trạng thái</span><strong>{statusLabel(status)}</strong></div>
        <div><span>Quyền riêng tư</span><strong>{visibilityLabel(target.visibility)}</strong></div>
      </div>
      <section className="report-target-content">
        <span>Nội dung</span>
        <p>{content || 'Nội dung không có văn bản.'}</p>
      </section>
      {media.length > 0 && (
        <div className="report-target-media">
          {media.map((item, index) => {
            const url = text(item.url) || text(item.mediaUrl);
            return url ? <img alt={`Media ${index + 1} của nội dung bị báo cáo`} key={`${url}-${index}`} src={url} /> : null;
          })}
        </div>
      )}
      <div className="report-target-metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label}><Icon size={17} /><span>{label}</span><strong>{value.toLocaleString('vi-VN')}</strong></div>
        ))}
      </div>
      <div className="report-target-secondary">
        <UserRound size={16} />
        <span>Đã lưu: {number(target.saveCount).toLocaleString('vi-VN')}</span>
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function text(value: unknown) { return typeof value === 'string' ? value : ''; }
function number(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function postTypeLabel(value: unknown) { return value === 1 ? 'Video ngắn' : value === 0 ? 'Bài viết' : 'Nội dung'; }
function statusLabel(value: unknown) { return value === 1 ? 'Đang hiển thị' : value === 2 ? 'Đã ẩn' : value === 3 ? 'Đã xóa' : 'Không xác định'; }
function visibilityLabel(value: unknown) { return value === 0 ? 'Công khai' : value === 1 ? 'Bạn bè' : value === 2 ? 'Riêng tư' : 'Không xác định'; }

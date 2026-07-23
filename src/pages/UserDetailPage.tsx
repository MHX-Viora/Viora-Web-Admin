import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorView, PageHeader } from '../components/common';
import { AccountInfoCard } from '../components/UserDetail/AccountInfoCard';
import { IdentityCard } from '../components/UserDetail/IdentityCard';
import { ImagePreviewModal } from '../components/UserDetail/ImagePreviewModal';
import { LoadingSkeleton } from '../components/UserDetail/LoadingSkeleton';
import { UserProfileCard } from '../components/UserDetail/UserProfileCard';
import { UserStatisticsCard } from '../components/UserDetail/UserStatisticsCard';
import { useUserDetail } from '../hooks/useUserDetail';
import { updateUserStatus, updateUserVerification } from '../services/admin-user.service';
import { getErrorMessage } from '../services/http';

type ConfirmAction =
  | { type: 'ban'; title: string; description: string; requireReason: true; confirmText: string; danger?: boolean }
  | { type: 'unban' | 'delete' | 'verify' | 'unverify'; title: string; description: string; requireReason?: false; confirmText: string; danger?: boolean };

export function UserDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [reason, setReason] = useState('');
  const query = useUserDetail(id);
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: number; reason?: string }) => updateUserStatus(id ?? '', { status, reason }),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công.');
      closeConfirm();
      void queryClient.invalidateQueries({ queryKey: ['users', id] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const verifyMutation = useMutation({
    mutationFn: (isVerified: boolean) => updateUserVerification(id ?? '', { isVerified }),
    onSuccess: () => {
      toast.success('Cập nhật xác thực thành công.');
      closeConfirm();
      void queryClient.invalidateQueries({ queryKey: ['users', id] });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (query.isLoading) return <LoadingSkeleton />;

  if (query.isError) {
    return (
      <section>
        <PageHeader title="Không tìm thấy người dùng" actions={<BackButton />} />
        <ErrorView message={getErrorMessage(query.error) || 'Không tìm thấy người dùng.'} onRetry={() => void query.refetch()} />
      </section>
    );
  }

  if (!query.data) {
    return (
      <section>
        <PageHeader title="Không tìm thấy người dùng" actions={<BackButton />} />
        <ErrorView message="Không tìm thấy người dùng." onRetry={() => void query.refetch()} />
      </section>
    );
  }

  const user = query.data;

  function closeConfirm() {
    setConfirmAction(null);
    setReason('');
  }

  function submitConfirm() {
    if (!confirmAction) return;

    if (confirmAction.type === 'ban') {
      if (!reason.trim()) {
        toast.error('Vui lòng nhập lý do khóa.');
        return;
      }
      statusMutation.mutate({ status: 0, reason: reason.trim() });
      return;
    }

    if (confirmAction.type === 'unban') {
      statusMutation.mutate({ status: 1 });
      return;
    }

    if (confirmAction.type === 'delete') {
      statusMutation.mutate({ status: 2 });
      return;
    }

    verifyMutation.mutate(confirmAction.type === 'verify');
  }

  const loading = statusMutation.isPending || verifyMutation.isPending;

  return (
    <section className="user-detail-page">
      <div className="breadcrumb-row">
        <Link to="/">Bảng điều khiển</Link>
        <span>/</span>
        <Link to="/users">Người dùng</Link>
        <span>/</span>
        <strong>{user.name}</strong>
      </div>
      <PageHeader title={user.name} description="Chi tiết người dùng" actions={<BackButton />} />
      <div className="user-detail-layout">
        <UserProfileCard
          user={user}
          actionLoading={loading}
          onBan={() => setConfirmAction({ type: 'ban', title: 'Khóa người dùng', description: 'Người dùng sẽ bị khóa và không thể tiếp tục sử dụng tài khoản.', requireReason: true, confirmText: 'Khóa người dùng', danger: true })}
          onUnban={() => setConfirmAction({ type: 'unban', title: 'Mở khóa người dùng', description: 'Tài khoản sẽ được chuyển về trạng thái đang hoạt động.', confirmText: 'Mở khóa' })}
          onDelete={() => setConfirmAction({ type: 'delete', title: 'Xóa người dùng', description: 'Tài khoản sẽ chuyển sang trạng thái đã xóa. Dữ liệu không bị xóa cứng.', confirmText: 'Xóa người dùng', danger: true })}
          onVerify={() => setConfirmAction({ type: 'verify', title: 'Xác thực người dùng', description: 'Người dùng sẽ được đánh dấu đã xác thực.', confirmText: 'Xác thực' })}
          onUnverify={() => setConfirmAction({ type: 'unverify', title: 'Hủy xác thực người dùng', description: 'Dấu xác thực của người dùng sẽ bị thu hồi.', confirmText: 'Hủy xác thực', danger: true })}
        />
        <UserStatisticsCard user={user} />
        <IdentityCard user={user} onPreview={setPreviewImage} />
        <AccountInfoCard user={user} />
      </div>
      {confirmAction ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true">
            <h2>{confirmAction.title}</h2>
            <p>{confirmAction.description}</p>
            {confirmAction.type === 'ban' ? (
              <label className="field-label">Lý do khóa
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} required />
              </label>
            ) : null}
            <div className="modal-actions">
              <button className="btn" disabled={loading} onClick={closeConfirm} type="button">Hủy</button>
              <button className={`btn ${confirmAction.danger ? 'danger' : 'primary'}`} disabled={loading} onClick={submitConfirm} type="button">{confirmAction.confirmText}</button>
            </div>
          </div>
        </div>
      ) : null}
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </section>
  );
}

function BackButton() {
  return <Link className="btn" to="/users"><ArrowLeft size={16} />Quay lại</Link>;
}

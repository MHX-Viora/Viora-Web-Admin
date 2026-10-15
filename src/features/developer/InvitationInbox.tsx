import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';

export function InvitationInbox() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['developer-invitations'], queryFn: developerApi.invitations });
  const accept = useMutation({ mutationFn: developerApi.acceptInvitation, onSuccess: async () => { toast.success('Đã chấp nhận lời mời'); await client.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith('developer') }); }, onError: e => toast.error(getErrorMessage(e)) });
  if (query.isLoading) return null;
  if (query.isError) return <p role="alert">Không tải được lời mời. <button className="btn" onClick={() => void query.refetch()}>Thử lại</button></p>;
  if (!query.data?.length) return null;
  return <article className="detail-card mini-stack"><h2>Lời mời dành cho bạn</h2>{query.data.map(invite => <div className="mini-version" key={invite.id}><p>Mini App <code>{invite.miniAppId}</code> · Vai trò {invite.role}</p><small>Hết hạn {new Date(invite.expiresAt).toLocaleString('vi-VN')}</small><button className="btn primary" disabled={accept.isPending} onClick={() => accept.mutate(invite.id)}>Chấp nhận lời mời</button></div>)}</article>;
}

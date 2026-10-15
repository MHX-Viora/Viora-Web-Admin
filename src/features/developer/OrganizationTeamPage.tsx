import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDialog, DataTable, PageHeader } from '../../components/common';
import { developerApi } from '../../services/developer.service';
import { developerReauthenticate, getDeveloperSession } from '../../services/developer-auth.service';
import { getErrorMessage } from '../../services/http';
import { useDeveloperProfile } from './context';
import { QueryState } from './Shared';

type Change = { id?: string; role?: string };
export function OrganizationTeamPage() {
  const profile = useDeveloperProfile(); const client = useQueryClient();
  const [accountId, setAccountId] = useState(''), [role, setRole] = useState('Developer');
  const [pending, setPending] = useState<Change>(), [password, setPassword] = useState('');
  const owner = profile.membershipRole === 'Owner', manage = owner || profile.membershipRole === 'Admin';
  const google = getDeveloperSession()?.provider === 'google';
  const roles = owner ? ['Admin', 'Developer', 'Analyst', 'Viewer'] : ['Developer', 'Analyst', 'Viewer'];
  const query = useQuery({ queryKey: ['developer-team', profile.id], queryFn: developerApi.team });
  const mutation = useMutation({ mutationFn: async () => {
    try {
      const proof = await developerReauthenticate('ManageTeam', undefined, password);
      if (pending?.id && pending.role) await developerApi.updateMember(pending.id, pending.role, proof);
      else if (pending?.id) await developerApi.removeMember(pending.id, proof);
      else await developerApi.addMember(accountId, role, proof);
    } finally { setPassword(''); }
  }, onSuccess: async () => { setAccountId(''); setPending(undefined); toast.success('Đã cập nhật thành viên tổ chức'); await client.invalidateQueries({ queryKey: ['developer-team'] }); }, onError: e => toast.error(getErrorMessage(e)) });
  return <section className="mini-stack"><PageHeader title="Thành viên tổ chức Developer" description="Quyền tổ chức được kế thừa bởi các ứng dụng. Quyền riêng cho từng Mini App được quản lý trong tab Thành viên của ứng dụng." /><article className="detail-card mini-stack">{manage ? <form className="mini-form-grid" onSubmit={e => { e.preventDefault(); setPending({}); }}><label>ANKT Account ID<input required pattern="[0-9a-fA-F-]{36}" value={accountId} onChange={e => setAccountId(e.target.value)} /></label><label>Vai trò<select value={role} onChange={e => setRole(e.target.value)}>{roles.map(r => <option key={r}>{r}</option>)}</select></label><button className="btn primary" disabled={mutation.isPending}>Thêm thành viên</button></form> : <p>Chỉ Owner/Admin được quản lý thành viên.</p>}<QueryState query={query}><DataTable items={query.data ?? []} columns={[{ key: 'account', title: 'Tài khoản ANKT', render: m => <code>{m.accountId}</code> }, { key: 'role', title: 'Vai trò', render: m => manage && m.role !== 'Owner' && (owner || m.role !== 'Admin') ? <select aria-label={`Vai trò ${m.accountId}`} value={m.role === 'Member' ? 'Developer' : m.role} disabled={mutation.isPending} onChange={e => setPending({ id: m.id, role: e.target.value })}>{roles.map(r => <option key={r}>{r}</option>)}</select> : m.role }, { key: 'action', title: 'Thao tác', render: m => manage && m.role !== 'Owner' && (owner || m.role !== 'Admin') ? <button className="btn danger" disabled={mutation.isPending} onClick={() => setPending({ id: m.id })}>Xóa quyền</button> : '—' }]} /></QueryState></article>{pending && <ConfirmDialog title="Xác nhận thay đổi thành viên?" description={google ? 'Xác thực lại bằng Google để cập nhật quyền tổ chức.' : 'Xác nhận bằng mật khẩu ANKT để cập nhật quyền tổ chức.'} confirmText={google ? 'Xác thực Google & tiếp tục' : 'Xác nhận'} loading={mutation.isPending} confirmDisabled={!google && !password} onCancel={() => { setPassword(''); setPending(undefined); }} onConfirm={() => mutation.mutate()}>{!google && <label>Mật khẩu ANKT<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>}<Link to="/developer/verify-email">Xác minh email ANKT trước thao tác nhạy cảm</Link></ConfirmDialog>}</section>;
}

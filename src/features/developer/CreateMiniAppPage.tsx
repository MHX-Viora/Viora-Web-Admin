import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import { ConfigFields } from './ConfigFields';
import { newConfig, validateConfig } from './config';
import { QueryState, SecretDisclosure } from './Shared';
import { useDeveloperProfile } from './context';

const steps = ['Thông tin', 'Website & domain', 'Đăng nhập', 'Quyền truy cập', 'Xem trước'];
export function CreateMiniAppPage() {
  const profile = useDeveloperProfile();
  const navigate = useNavigate(); const client = useQueryClient(); const [step, setStep] = useState(0); const [form, setForm] = useState(newConfig); const [createdId, setCreatedId] = useState(''); const [secret, setSecret] = useState('');
  const metadata = useQuery({ queryKey: ['developer-metadata'], queryFn: async () => { const [categories, permissions] = await Promise.all([developerApi.categories(), developerApi.permissions()]); return { categories, permissions }; } });
  const create = useMutation({ mutationFn: () => developerApi.create(form), onSuccess: async result => { setCreatedId(result.id); await client.invalidateQueries({ queryKey: ['developer-apps'] }); if (result.clientSecret && form.authenticationMode === 'AnktSso') setSecret(result.clientSecret); else navigate(`/developer/apps/${result.id}/domains`); }, onError: e => toast.error(getErrorMessage(e)) });
  if (profile.status !== 'Active') return <section><PageHeader title="Tạo Mini App" description="Hồ sơ Developer cần được ANKT phê duyệt trước khi tạo ứng dụng." /><p className="mini-notice">Trạng thái hiện tại: {profile.status}. Theo dõi hồ sơ đăng ký hoặc liên hệ ANKT để được xét duyệt.</p><Link className="btn" to="/developer/profile">Xem hồ sơ Developer</Link></section>;
  return <section><PageHeader title="Tạo Mini App" description="Đưa website vào ANKT với đăng nhập riêng hoặc tích hợp ANKT SSO." actions={<Link className="btn" to="/developer/apps">Quay lại</Link>} /><ol className="mini-steps" aria-label="Các bước đăng ký">{steps.map((title, index) => <li className={index === step ? 'current' : index < step ? 'complete' : ''} key={title} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{title}</li>)}</ol><QueryState query={metadata}><form className="detail-card mini-stack" onSubmit={e => { e.preventDefault(); const error = validateConfig(form, step === 4 ? undefined : step); if (error) { toast.error(error); return; } if (step < 4) setStep(step + 1); else create.mutate(); }}><h2>{steps[step]}</h2><ConfigFields value={form} onChange={setForm} section={step} categories={metadata.data?.categories} permissions={metadata.data?.permissions} /><div className="mini-row mini-end"><button className="btn" type="button" disabled={step === 0 || create.isPending} onClick={() => setStep(step - 1)}>Trước</button><button className="btn primary" disabled={create.isPending}>{step === 4 ? 'Tạo bản nháp & xác minh domain' : 'Tiếp theo'}</button></div></form></QueryState>{secret ? <SecretDisclosure secret={secret} onDismiss={() => { setSecret(''); create.reset(); navigate(`/developer/apps/${createdId}/domains`); }} /> : null}</section>;
}

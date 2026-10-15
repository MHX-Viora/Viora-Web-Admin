import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader, StatusBadge } from '../../components/common';
import { developerApi } from '../../services/developer.service';
import { getErrorMessage } from '../../services/http';
import type { DeveloperProfile } from '../../types/mini-app';
import type { PartnerType } from '../../types/developer-platform';
import { QueryState } from './Shared';
import { canEditRegistration, registrationInput, registrationStatus, validateRegistration } from './registration';
import { DeveloperReviewHistory } from './DeveloperReviewHistory';

const steps = ['Loại đối tác', 'Thông tin đăng ký', 'Điều khoản', 'Xem lại & gửi'];
export function DeveloperRegistrationWizard({ profile }: { profile?: DeveloperProfile }) {
  const client = useQueryClient();
  const [saved, setSaved] = useState(profile);
  const [changing, setChanging] = useState(false);
  const [form, setForm] = useState(() => registrationInput(profile));
  const [step, setStep] = useState(0), [error, setError] = useState(''), [acceptedVersion, setAcceptedVersion] = useState(profile?.termsAcceptedVersion ?? '');
  const terms = useQuery({ queryKey: ['developer-terms'], queryFn: developerApi.terms, retry: false });
  const approved = profile?.status === 'Active' || registrationStatus(profile) === 'Approved';
  const editable = canEditRegistration(saved) && (!approved || changing);
  const status = registrationStatus(saved);
  const save = useMutation({ mutationFn: () => developerApi.saveApplication({ ...form, version: saved?.registrationVersion }), onSuccess: next => {
    setSaved(next); setForm(current => ({ ...current, version: next.registrationVersion })); setStep(2); setError('');
  }, onError: reason => setError(getErrorMessage(reason)) });
  const submit = useMutation({ mutationFn: async () => { const current = await developerApi.terms(); client.setQueryData(['developer-terms'], current); if (acceptedVersion !== current.version) { setAcceptedVersion(''); setStep(2); throw new Error('Điều khoản đã thay đổi. Hãy xem và đồng ý phiên bản hiện hành trước khi gửi.'); } return developerApi.submitApplication(saved!.registrationVersion!, current.version); }, onSuccess: async () => {
    toast.success('Đã gửi hồ sơ Developer. Theo dõi quyết định tại trang này.'); await client.invalidateQueries({ queryKey: ['developer-profile'] });
  }, onError: reason => setError(getErrorMessage(reason)) });
  const busy = save.isPending || submit.isPending;
  function next() {
    setError('');
    if (step === 1) { const reason = validateRegistration(form); if (reason) { setError(reason); return; } save.mutate(); return; }
    if (step === 2 && (!terms.data || acceptedVersion !== terms.data.version)) { setError('Đọc và chấp thuận bộ điều khoản hiện hành.'); return; }
    if (step === 3) { if (!saved?.registrationVersion || !terms.data || acceptedVersion !== terms.data.version) { setError('Lưu bản nháp và chấp thuận điều khoản trước khi gửi.'); return; } submit.mutate(); return; }
    setStep(value => value + 1);
  }
  return <section className="mini-stack"><PageHeader eyebrow="ANKT Developer" title={saved ? 'Hồ sơ nhà phát triển' : 'Trở thành nhà phát triển'} description="Hoàn tất hồ sơ và đồng ý điều khoản. ANKT xét duyệt trước khi cấp quyền tạo Mini App." />
    {saved ? <div className="detail-card mini-stack"><div className="mini-row"><StatusBadge status={status} /><strong>Hồ sơ phiên bản {saved.registrationVersion ?? 'cũ'}</strong></div>
      <dl className="mini-definition"><dt>Mã hồ sơ</dt><dd><code>{saved.id}</code></dd><dt>Ngày gửi</dt><dd>{saved.submittedAt ? new Date(saved.submittedAt).toLocaleString('vi-VN') : 'Chưa gửi xét duyệt'}</dd><dt>Đơn vị / cá nhân</dt><dd>{saved.name}</dd><dt>Email liên hệ</dt><dd>{saved.email}</dd></dl>
      {saved.publicReason ? <p className="mini-notice">Thông tin từ ANKT: {saved.publicReason}</p> : null}
      {!editable && !approved ? <p>{status === 'PendingReview' ? 'Hồ sơ đã gửi được giữ nguyên trong thời gian xét duyệt. Bấm kiểm tra trạng thái để xem yêu cầu bổ sung hoặc quyết định.' : status === 'Suspended' || status === 'Revoked' ? 'Quyền Developer đang bị hạn chế. Liên hệ hỗ trợ; dữ liệu ứng dụng vẫn được giữ lại.' : 'Chỉ chủ sở hữu được cập nhật hồ sơ.'}</p> : null}
      {approved && !changing && profile?.membershipRole === 'Owner' && <><p>Hồ sơ đã được phê duyệt. Ứng dụng hiện tại tiếp tục hoạt động khi bạn gửi yêu cầu thay đổi thông tin.</p><button className="btn" type="button" onClick={() => setChanging(true)}>Yêu cầu thay đổi hồ sơ</button></>}<DeveloperReviewHistory items={saved.reviewHistory} />
    </div> : null}
    {editable ? <><ol className="mini-steps" aria-label="Tiến trình đăng ký Developer">{steps.map((title, index) => <li key={title} className={step === index ? 'current' : index < step ? 'complete' : ''} aria-current={step === index ? 'step' : undefined}><span>{index + 1}</span>{title}</li>)}</ol>
      <form className="detail-card mini-stack" onSubmit={event => { event.preventDefault(); if (!busy) next(); }}><h2>{approved ? `Yêu cầu thay đổi · ${steps[step]}` : steps[step]}</h2>
        {error ? <p className="mini-notice" role="alert">{error}</p> : null}
        <fieldset disabled={busy} className="platform-fieldset"><div className="mini-stack">
          {step === 0 ? <fieldset className="mini-mode-options"><legend>Đăng ký với tư cách</legend>{([{ value: 'Individual', label: 'Cá nhân', description: 'Phát triển Mini App dưới tên cá nhân.' }, { value: 'Business', label: 'Doanh nghiệp', description: 'Đơn vị kinh doanh có tên pháp lý và người đại diện.' }, { value: 'Organization', label: 'Tổ chức', description: 'Tổ chức có người chịu trách nhiệm vận hành.' }] as { value: PartnerType; label: string; description: string }[]).map(option => <label key={option.value} className="mini-mode"><input type="radio" name="partnerType" checked={form.partnerType === option.value} onChange={() => setForm({ ...form, partnerType: option.value })} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}</fieldset> : null}
          {step === 1 ? <div className="mini-form-grid">
            <label>{form.partnerType === 'Individual' ? 'Họ và tên' : 'Tên hiển thị Developer'}<input required maxLength={120} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
            <label>Email liên hệ<input type="email" required maxLength={255} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
            <label>Số điện thoại<input type="tel" required maxLength={20} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
            <label>Quốc gia / khu vực<input required maxLength={2} pattern="[A-Z]{2}" value={form.country ?? ''} onChange={event => setForm({ ...form, country: event.target.value.toUpperCase() })} /><small>Mã hai chữ cái: VN, US, SG…</small></label>
            <label className="mini-full">Website / portfolio<input type="url" value={form.website} onChange={event => setForm({ ...form, website: event.target.value })} /></label>
            {form.partnerType !== 'Individual' ? <>
              <label>Tên pháp lý<input required maxLength={200} value={form.legalName ?? ''} onChange={event => setForm({ ...form, legalName: event.target.value })} /></label>
              <label>Tên thương mại<input maxLength={160} value={form.tradingName ?? ''} onChange={event => setForm({ ...form, tradingName: event.target.value, companyName: event.target.value })} /></label>
              <label>Mã doanh nghiệp / mã số thuế (nếu áp dụng)<input maxLength={80} value={form.businessRegistrationNumber ?? ''} onChange={event => setForm({ ...form, businessRegistrationNumber: event.target.value })} /></label>
              <label>Người đại diện / phụ trách<input required maxLength={120} value={form.representativeName ?? ''} onChange={event => setForm({ ...form, representativeName: event.target.value })} /></label>
              <label className="mini-full">Địa chỉ<input required maxLength={500} value={form.address ?? ''} onChange={event => setForm({ ...form, address: event.target.value })} /></label>
            </> : null}
          </div> : null}
          {step === 2 ? <QueryState query={terms}><div className="mini-stack">{terms.data?.documents.map(document => <details key={document.id} className="mini-version"><summary>{document.title}</summary><Link target="_blank" rel="noopener noreferrer" to={`/developer/docs/${encodeURIComponent(document.id)}`}>Mở nội dung chi tiết</Link></details>)}<label className="check-row"><input type="checkbox" checked={Boolean(terms.data && acceptedVersion === terms.data.version)} onChange={event => setAcceptedVersion(event.target.checked ? terms.data!.version : '')} />Tôi đồng ý điều khoản Developer, Mini App, Open API và chính sách dữ liệu phiên bản {terms.data?.version}.</label></div></QueryState> : null}
          {step === 3 ? <><dl className="mini-definition"><dt>Loại đối tác</dt><dd>{form.partnerType}</dd><dt>Tên</dt><dd>{form.name}</dd><dt>Email</dt><dd>{form.email}</dd><dt>Số điện thoại</dt><dd>{form.phone}</dd><dt>Quốc gia</dt><dd>{form.country}</dd><dt>Điều khoản</dt><dd>{acceptedVersion}</dd></dl><p className="mini-notice">Gửi hồ sơ phiên bản {saved?.registrationVersion}. Trong thời gian xét duyệt không thể thay đổi nội dung đã gửi. Thay đổi hồ sơ đã được duyệt sẽ tạo phiên bản mới để xét duyệt.</p></> : null}
        </div></fieldset><div className="mini-row mini-end"><button className="btn" type="button" disabled={step === 0 || busy} onClick={() => { setStep(value => value - 1); setError(''); }}>Trước</button><button className="btn primary" disabled={busy || (step >= 2 && terms.isError)}>{busy ? 'Đang xử lý…' : step === 3 ? 'Gửi hồ sơ xét duyệt' : step === 1 ? 'Lưu bản nháp & tiếp tục' : 'Tiếp theo'}</button></div>
      </form></> : null}
  </section>;
}

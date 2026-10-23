import type { Snapshot } from '../../types/mini-app-review';
export function ReviewLogo({ value }: { value: string | null | undefined }) {
  let source: string | null = null;
  try {
    const url = new URL(value ?? '');
    if (url.protocol === 'https:' && !url.username && !url.password) source = url.href;
  } catch { /* Unsafe or absent logo has a neutral fallback. */ }
  if (source) return <img className="mini-review-logo" src={source} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" />;
  return <span className="mini-review-logo" aria-hidden="true">M</span>;
}
export function SafePartnerLink({ value }: { value: string | null | undefined }) {
  let safe = false;
  try { const url = new URL(value ?? ''); safe = url.protocol === 'https:' && !url.username && !url.password; } catch { /* Display invalid links as text only. */ }
  return value ? safe ? <a href={value} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{value}</a> : <span>{value}</span> : <span>Chưa cung cấp</span>;
}
export function ReviewSnapshot({ snapshot, title = 'Bản chụp bất biến đã gửi' }: { snapshot: Snapshot; title?: string }) {
  return <section className="mini-review-section"><h2>{title}</h2><p className="muted">Nội dung được lưu theo phiên bản, tách biệt với bản nháp hiện tại.</p>
    <dl className="mini-review-facts">
      <dt>Tên ứng dụng</dt><dd>{snapshot.name}</dd><dt>Danh mục</dt><dd>{snapshot.category}</dd>
      <dt>Mô tả ngắn</dt><dd>{snapshot.shortDescription || 'Chưa cung cấp'}</dd><dt>Mô tả</dt><dd className="mini-review-prose">{snapshot.description || 'Chưa cung cấp'}</dd>
      <dt>Logo đã gửi</dt><dd><ReviewLogo value={snapshot.logoUrl} /><SafePartnerLink value={snapshot.logoUrl} /></dd>
      <dt>Website</dt><dd><SafePartnerLink value={snapshot.websiteUrl} /></dd><dt>Tên miền</dt><dd>{snapshot.domain || 'Chưa cung cấp'}</dd>
      <dt>Chính sách riêng tư</dt><dd><SafePartnerLink value={snapshot.privacyPolicyUrl} /></dd><dt>Điều khoản</dt><dd><SafePartnerLink value={snapshot.termsOfServiceUrl} /></dd>
      <dt>Email hỗ trợ</dt><dd>{snapshot.supportEmail || 'Chưa cung cấp'}</dd><dt>SSO</dt><dd>{snapshot.ssoEnabled ? 'Đã bật trong phiên bản' : 'Không bật'}</dd>
    </dl>
    {(['sandbox', 'production'] as const).map(environment => <section key={environment}><h3>{environment === 'sandbox' ? 'Sandbox' : 'Production'} · cấu hình đề xuất</h3>{snapshot[environment] ? <dl className="mini-review-facts"><dt>Loại client</dt><dd>{snapshot[environment].clientType}</dd><dt>Scopes</dt><dd>{snapshot[environment].scopes.join(', ') || 'Không có'}</dd><dt>Callback</dt><dd><ul>{snapshot[environment].redirectUris.map(uri => <li key={uri}>{uri}</li>)}</ul></dd></dl> : <p>Chưa cấu hình.</p>}</section>)}
  </section>;
}

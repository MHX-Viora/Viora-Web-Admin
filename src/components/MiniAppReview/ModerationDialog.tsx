import { actionLabels } from '../../types/mini-app-review';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { miniAppQueryKey } from '../../hooks/useMiniAppReviews';
import { MiniAppAdminError, moderateApp } from '../../services/admin-mini-app.service';
import type { AppDetail, ModerationCommand } from '../../types/mini-app-review';
import { ReviewDecisionDialog } from './ReviewDecisionDialog';

export function ModerationDialog({ detail, refreshing = false, refresh }: { detail: AppDetail; refreshing?: boolean; refresh: () => void }) {
  const client = useQueryClient(), mounted = useRef(true), pending = useRef(false), captured = useRef<ModerationCommand | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null), restoreTrigger = useRef(false), restoreHeading = useRef(false);
  const openedRevision = useRef(detail.app.appVersion);
  const [action, setAction] = useState<'suspend' | 'restore' | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(false), [blocked, setBlocked] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (action) return;
    if (restoreTrigger.current) { if (!refreshing) { const opener = trigger.current; if (opener?.isConnected && !opener.disabled) opener.focus(); else heading.current?.focus(); restoreTrigger.current = false; } return; }
    if (restoreHeading.current) { heading.current?.focus(); restoreHeading.current = false; }
  }, [action, refreshing]);
  async function confirm(reason: string) {
    if (!action || pending.current || blocked) return;
    pending.current = true; setBusy(true); setError('');
    try {
      if (!captured.current) {
        if (openedRevision.current !== detail.app.appVersion || !(action === 'suspend' ? detail.app.canSuspend : detail.app.canRestore)) throw new MiniAppAdminError(409);
        const publication = detail.publications.find(item => item.id === detail.app.publicationId);
        if (detail.app.publicationId && !publication) throw new Error('Thiếu phiên bản phát hành hiện tại. Hãy tải lại.');
        captured.current = { requestId: crypto.randomUUID(), concurrencyToken: detail.app.appVersion, reason,
          operationalRevision: detail.app.operationalRevision, publicationId: detail.app.publicationId, publicationRevision: publication?.concurrencyToken ?? null };
      }
      const result = await moderateApp(detail.app.appId, action, captured.current);
      await client.invalidateQueries({ queryKey: miniAppQueryKey });
      if (mounted.current) { restoreHeading.current = true; setMessage(result.operational.status === 'Suspended' ? 'Đã tạm ngưng ứng dụng và thu hồi quyền của ứng dụng.' : 'Đã khôi phục. Ứng dụng chưa phát hành; chủ ứng dụng phải phát hành lại.'); setAction(null); captured.current = null; }
    } catch (failure) {
      if (mounted.current) {
        setError(failure instanceof Error ? failure.message : 'Không xác nhận được kết quả.');
        const ambiguous = failure instanceof MiniAppAdminError && failure.ambiguous;
        setRetry(ambiguous); setBlocked(!ambiguous); if (!ambiguous) { captured.current = null; refresh(); }
      }
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  }
  return <section className="mini-review-section"><h2 ref={heading} tabIndex={-1}>Vận hành ứng dụng</h2><p>Khôi phục không tự phát hành và không phục hồi các quyền truy cập đã thu hồi.</p><p role="status">{message}</p><div className="mini-review-actions">{(['suspend', 'restore'] as const).filter(value => value === 'suspend' ? detail.app.canSuspend : detail.app.canRestore).map(value => <button className={`btn ${value === 'suspend' ? 'danger' : ''}`} key={value} disabled={busy || refreshing} type="button" onClick={event => { trigger.current = event.currentTarget; openedRevision.current = detail.app.appVersion; captured.current = null; setAction(value); setError(''); setRetry(false); setBlocked(false); }}>{actionLabels[value]}</button>)}</div>
    {action && <ReviewDecisionDialog action={action} target={`${detail.app.name} · ${detail.app.appId}`} busy={busy} error={error} retry={retry} blocked={blocked} onConfirm={values => void confirm(values.reason)} onCancel={() => { if (!pending.current) { restoreTrigger.current = true; setAction(null); captured.current = null; if (blocked) refresh(); } }} />}
  </section>;
}

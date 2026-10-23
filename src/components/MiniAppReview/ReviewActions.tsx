import { actionLabels, statusLabel } from '../../types/mini-app-review';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { miniAppQueryKey } from '../../hooks/useMiniAppReviews';
import { MiniAppAdminError, reviewCommand } from '../../services/admin-mini-app.service';
import type { ReviewAction, ReviewCommand, ReviewDetail } from '../../types/mini-app-review';
import { ReviewDecisionDialog } from './ReviewDecisionDialog';
import type { DialogValues } from './ReviewDecisionDialog';

export function ReviewActions({ detail, refreshing = false, refresh }: { detail: ReviewDetail; refreshing?: boolean; refresh: () => void }) {
  const client = useQueryClient(), mounted = useRef(true), inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null), restoreTrigger = useRef(false), restoreHeading = useRef(false);
  const captured = useRef<{ action: ReviewAction; body: ReviewCommand } | null>(null);
  const openedRevision = useRef(detail.review.review.concurrencyToken);
  const [action, setAction] = useState<ReviewAction | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(false), [blocked, setBlocked] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (action) return;
    if (restoreTrigger.current) { if (!refreshing) { const opener = trigger.current; if (opener?.isConnected && !opener.disabled) opener.focus(); else heading.current?.focus(); restoreTrigger.current = false; } return; }
    if (restoreHeading.current) { heading.current?.focus(); restoreHeading.current = false; }
  }, [action, refreshing]);
  const allowed: ReviewAction[] = [...(detail.canStart ? ['start' as const] : []), ...(detail.canAssign ? ['assign' as const] : []), ...(detail.canDecide ? ['approve' as const, 'request-changes' as const, 'reject' as const] : [])];
  async function confirm(values: DialogValues) {
    if (!action || inFlight.current || blocked) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      if (!captured.current) {
        if (!allowed.includes(action) || openedRevision.current !== detail.review.review.concurrencyToken) throw new MiniAppAdminError(409);
        const body: ReviewCommand = { requestId: crypto.randomUUID(), concurrencyToken: openedRevision.current };
        if (action !== 'start') body.reason = values.reason || null;
        if (action === 'assign') body.adminAccountId = values.adminAccountId;
        if (action === 'request-changes') body.changes = values.changes.map(item => ({ ...item, message: item.message.trim() }));
        captured.current = { action, body };
      }
      const result = await reviewCommand(detail.review.review.id, captured.current.action, captured.current.body);
      await client.invalidateQueries({ queryKey: miniAppQueryKey });
      if (mounted.current) { restoreHeading.current = true; setMessage(`Đã xác nhận: ${statusLabel[result.status] ?? result.status}.`); setAction(null); captured.current = null; }
    } catch (failure) {
      if (mounted.current) {
        setError(failure instanceof Error ? failure.message : 'Không xác nhận được kết quả.');
        const ambiguous = failure instanceof MiniAppAdminError && failure.ambiguous;
        setRetry(ambiguous); setBlocked(failure instanceof MiniAppAdminError && !ambiguous);
        if (!ambiguous) { captured.current = null; refresh(); }
      }
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  return <section className="mini-review-section"><h2 ref={heading} tabIndex={-1}>Thao tác xét duyệt</h2><p role="status">{message || (allowed.length === 0 ? 'Hiện không có thao tác xét duyệt được phép cho phiên này.' : 'Quyền thao tác do máy chủ xác định; chỉ người được giao mới có thể quyết định.')}</p><div className="mini-review-actions">{allowed.map(value => <button type="button" className={`btn ${value === 'approve' ? 'primary' : ''}`} key={value} disabled={busy || refreshing} onClick={event => { trigger.current = event.currentTarget; openedRevision.current = detail.review.review.concurrencyToken; captured.current = null; setAction(value); setError(''); setRetry(false); setBlocked(false); }}>{actionLabels[value]}</button>)}</div>
    {action && <ReviewDecisionDialog action={action} target={`${detail.review.snapshot.name} · ${detail.review.versionName} (#${detail.review.review.versionCode})`} busy={busy} error={error} retry={retry} blocked={blocked} onConfirm={values => void confirm(values)} onCancel={() => { if (!inFlight.current) { restoreTrigger.current = true; setAction(null); captured.current = null; if (blocked) refresh(); } }} />}
  </section>;
}

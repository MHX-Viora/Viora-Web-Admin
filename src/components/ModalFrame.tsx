import { useEffect, useRef, type ReactNode } from 'react';

export function ModalFrame({ titleId, className = 'modal', busy = false, onClose, children }: { titleId: string; className?: string; busy?: boolean; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : document.activeElement as HTMLElement);
  const close = useRef(onClose);
  const pending = useRef(busy);
  useEffect(() => { close.current = onClose; pending.current = busy; }, [onClose, busy]);
  useEffect(() => {
    const previous = opener.current;
    const element = panel.current;
    if (!element) return;
    const controls = () => Array.from(element.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]')).filter(control => control.offsetParent !== null);
    (controls()[0] ?? element).focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); if (!pending.current) close.current(); }
      if (event.key !== 'Tab') return;
      const items = controls();
      if (!items.length) { event.preventDefault(); element.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    };
    element.addEventListener('keydown', handle);
    return () => { element.removeEventListener('keydown', handle); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className="modal-backdrop"><div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={className}>{children}</div></div>;
}

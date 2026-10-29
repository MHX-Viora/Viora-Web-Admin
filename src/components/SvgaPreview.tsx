import { useEffect, useRef, useState } from 'react';

type Player = { setVideoItem: (item: unknown) => void; startAnimation: () => void; clear: () => void; stopAnimation: () => void; setContentMode: (mode: string) => void; loops: number };
type Svga = { Player: new (element: HTMLElement) => Player; Parser: new (element: HTMLElement) => { load: (source: string, done: (item: unknown) => void, failed: () => void) => void } };
declare global { interface Window { SVGA?: Svga } }
let loading: Promise<Svga> | undefined;
function loadPlayer() {
  if (window.SVGA) return Promise.resolve(window.SVGA);
  loading ??= new Promise<Svga>((resolve, reject) => {
    const script = document.createElement('script'); script.src = '/gift-presets/svga.min.js';
    script.onload = () => window.SVGA ? resolve(window.SVGA) : reject(new Error('Không tải được player.'));
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('Không tải được player.')); };
    document.head.append(script);
  });
  return loading;
}
export function SvgaPreview({ source, file }: { source?: string | null; file?: File | null }) {
  const element = useRef<HTMLDivElement>(null); const [error, setError] = useState(false);
  useEffect(() => {
    const host = element.current; if (!host || (!source && !file)) return;
    let disposed = false; let player: Player | undefined; const url = file ? URL.createObjectURL(file) : source!;
    void loadPlayer().then(SVGA => {
      if (disposed) return;
      player = new SVGA.Player(host); player.loops = 0; player.setContentMode('AspectFit');
      new SVGA.Parser(host).load(url, item => { if (!disposed) { player!.setVideoItem(item); player!.startAnimation(); } }, () => { if (!disposed) setError(true); });
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; player?.stopAnimation(); player?.clear(); host.replaceChildren(); if (file) URL.revokeObjectURL(url); };
  }, [source, file]);
  return <div className="gift-animation-preview"><div ref={element} aria-label="Xem trước hiệu ứng quà" />{error && <p role="alert">Không thể xem trước file hiệu ứng này.</p>}</div>;
}

import { useState } from 'react';
import { developerClient } from '../../services/developer-auth.service';
import { unwrapApiData, getErrorMessage } from '../../services/http';

export function AppImageField({ label, value, onChange, onBusyChange }: { label: string; value: string; onChange: (url: string) => void; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/') || !file.size || file.size > 15_000_000) { setError('Chọn ảnh tối đa 15 MB.'); return; }
    setBusy(true); onBusyChange?.(true); setError('');
    try {
      const body = new FormData(); body.append('Files', file);
      const media = unwrapApiData<{ mediaUrl: string }[]>((await developerClient.post('/api/articles/media', body)).data);
      if (!media[0]?.mediaUrl) throw new Error('Máy chủ chưa trả về ảnh đã tải.');
      onChange(media[0].mediaUrl);
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setBusy(false); onBusyChange?.(false); }
  }
  return <label className="mini-image-upload">{label}{value && <img src={value} alt={label} />}<input type="file" accept="image/*" disabled={busy} onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /><small>{busy ? 'Đang tải ảnh…' : 'Chọn ảnh từ máy · tối đa 15 MB'}</small>{error && <span role="alert">{error}</span>}{value && <button type="button" className="btn" disabled={busy} onClick={() => onChange('')}>Bỏ ảnh</button>}</label>;
}

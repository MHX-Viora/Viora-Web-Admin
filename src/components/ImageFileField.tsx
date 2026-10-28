import { useEffect, useId, useRef, useState } from 'react';
import { imageTypes, validateImageFile } from '../lib/image-file';
import './image-file-field.css';

type Props = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string;
  required?: boolean;
  disabled?: boolean;
  types?: readonly string[];
};
export function ImageFileField({ label, file, onChange, existingUrl, required, disabled, types = imageTypes }: Props) {
  const id = useId(), image = useRef<HTMLImageElement>(null), input = useRef<HTMLInputElement>(null), [error, setError] = useState('');
  useEffect(() => {
    if (!file) { if (input.current) input.current.value = ''; return; }
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="image-file-field">
    <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
    <input ref={input} id={id} type="file" accept={types.join(',')} disabled={disabled} required={required && !file && !existingUrl}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={!!error}
      onChange={event => {
        const next = event.currentTarget.files?.[0];
        if (!next) return;
        const message = validateImageFile(next, types); setError(message ?? '');
        event.currentTarget.setCustomValidity(message ?? '');
        if (message) { event.currentTarget.value = ''; onChange(null); }
        else onChange(next);
      }} />
    <small id={`${id}-help`}>{types.includes('image/jpeg') ? 'JPEG · PNG · WebP' : 'PNG · WebP'} · Tối đa 5 MB</small>
    <small aria-live="polite">{file ? `Đã chọn: ${file.name}` : existingUrl ? 'Đang dùng ảnh hiện tại.' : ''}</small>
    {error && <p id={`${id}-error`} role="alert">{error}</p>}
    {(file || existingUrl) && <img ref={image} src={file ? undefined : existingUrl} alt={`Xem trước ${label.toLowerCase()}`} />}
    {(file || error) && <button className="btn ghost" type="button" disabled={disabled} onClick={() => {
      setError(''); input.current?.setCustomValidity(''); onChange(null);
    }}>{file ? 'Bỏ ảnh đã chọn' : 'Bỏ lựa chọn ảnh'}</button>}
  </div>;
}

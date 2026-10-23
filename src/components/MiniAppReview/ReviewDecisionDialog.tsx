import { useEffect, useRef, useState } from 'react';
import { changeFields, actionLabels } from '../../types/mini-app-review';
import type { ReviewAction } from '../../types/mini-app-review';
export type DialogValues = { reason: string; adminAccountId: string; changes: { field: string; message: string }[] };

export function ReviewDecisionDialog({ action, target, busy, error, retry = false, blocked = false, onCancel, onConfirm }: { action: ReviewAction | 'suspend' | 'restore'; target: string; busy: boolean; error: string; retry?: boolean; blocked?: boolean; onCancel: () => void; onConfirm: (value: DialogValues) => void }) {
  const dialog = useRef<HTMLDialogElement>(null), errorRef = useRef<HTMLParagraphElement>(null);
  const [changes, setChanges] = useState([{ field: 'name', message: '' }]);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  return <dialog className="mini-review-page mini-review-dialog" ref={dialog} aria-labelledby="mini-review-dialog-title" aria-describedby="mini-review-dialog-target" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="mini-review-dialog-title">{actionLabels[action]}</h2><p id="mini-review-dialog-target">{target}</p>
    {action === 'approve' && <p>Chỉ duyệt đúng phiên bản này; không tự phát hành. Máy chủ sẽ kiểm tra lại an toàn.</p>}
    {action === 'suspend' && <p>Ứng dụng ngừng hoạt động ở Production và Sandbox. Quyền truy cập của ứng dụng sẽ bị thu hồi.</p>}
    {action === 'restore' && <p>Khôi phục vẫn để ứng dụng chưa phát hành. Chủ ứng dụng phải phát hành lại và người dùng cấp quyền mới.</p>}
    {retry && <p role="status">Kết quả chưa xác nhận. Thử lại giữ nguyên mã yêu cầu và toàn bộ nội dung.</p>}
    {error && <p ref={errorRef} tabIndex={-1} role="alert">{error}</p>}
    <form onSubmit={event => {
      event.preventDefault(); if (busy || blocked) return;
      const form = new FormData(event.currentTarget);
      onConfirm({ reason: String(form.get('reason') ?? '').trim(), adminAccountId: String(form.get('adminAccountId') ?? '').trim(), changes });
    }}>
      <fieldset disabled={busy || retry || blocked}>
        <legend>Nội dung xác nhận</legend>
        {action !== 'start' && <label>Lý do {action === 'approve' ? '(không bắt buộc)' : '(bắt buộc, 10–2000 ký tự)'}<textarea name="reason" required={action !== 'approve'} minLength={action !== 'approve' ? 10 : undefined} maxLength={2000} /></label>}
        {action === 'assign' && <label>Admin ID được giao<input name="adminAccountId" required pattern="[a-fA-F0-9-]{36}" maxLength={36} /></label>}
        {action === 'request-changes' && <><p>Chọn trường và mô tả cụ thể điều cần thay đổi.</p>{changes.map((item, index) => <div key={index}><label>Trường cần sửa {index + 1}<select value={item.field} onChange={event => setChanges(current => current.map((value, i) => i === index ? { ...value, field: event.target.value } : value))}>{changeFields.map(field => <option key={field}>{field}</option>)}</select></label><label>Nội dung chỉnh sửa {index + 1}<textarea required maxLength={2000} value={item.message} onChange={event => setChanges(current => current.map((value, i) => i === index ? { ...value, message: event.target.value } : value))} /></label>{changes.length > 1 && <button className="btn" type="button" onClick={() => setChanges(current => current.filter((_, i) => i !== index))}>Xóa mục {index + 1}</button>}</div>)}<button className="btn" type="button" disabled={changes.length >= 20} onClick={() => setChanges(current => [...current, { field: 'name', message: '' }])}>Thêm mục chỉnh sửa</button></>}
      </fieldset>
      <div className="mini-review-actions"><button className="btn" type="button" autoFocus disabled={busy} onClick={onCancel}>{blocked ? 'Đóng & kiểm tra trạng thái mới' : 'Hủy'}</button><button className={`btn ${action === 'reject' || action === 'suspend' ? 'danger' : 'primary'}`} type="submit" disabled={busy || blocked}>{busy ? 'Đang xử lý…' : retry ? 'Thử lại cùng yêu cầu' : `Xác nhận ${actionLabels[action].toLocaleLowerCase('vi-VN')}`}</button></div>
    </form>
  </dialog>;
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { createLegalDocument, createLegalVersion, deleteLegalDocument, getLegalDocument, getLegalDocuments, getPublishedLegalDocuments, publishLegalDocument, type LegalInput } from '../services/admin-legal.service';
import { getErrorMessage } from '../services/http';

const labels = ['Điều khoản sử dụng', 'Chính sách bảo mật', 'Quyền truy cập ứng dụng', 'Tiêu chuẩn cộng đồng', 'Khác'];
const empty: LegalInput = { type: 0, title: '', summary: '', content: '', languageCode: 'vi', version: '' };

export function LegalDocumentsPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['legal-documents'],
    queryFn: getLegalDocuments,
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const publishedQuery = useQuery({ queryKey: ['published-legal-documents'], queryFn: getPublishedLegalDocuments });
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [form, setForm] = useState<LegalInput>(empty);
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['legal-documents'] }),
      client.invalidateQueries({ queryKey: ['published-legal-documents'] }),
    ]);
  };
  const save = useMutation({
    mutationFn: () => sourceId ? createLegalVersion(sourceId, form) : createLegalDocument(form),
    onSuccess: (document) => {
      client.setQueryData<Awaited<ReturnType<typeof getLegalDocuments>>>(
        ['legal-documents'],
        (current = []) => [document, ...current.filter((item) => item.id !== document.id)],
      );
      toast.success('Đã lưu phiên bản tài liệu.');
      setForm(empty);
      setSourceId(null);
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: 'publish' | 'delete' }) => kind === 'publish' ? publishLegalDocument(id) : deleteLegalDocument(id),
    onSuccess: () => { toast.success('Đã cập nhật tài liệu.'); void refresh(); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  async function versionFrom(id: string) {
    try {
      const document = await getLegalDocument(id);
      setSourceId(id);
      setForm({ type: document.type, title: document.title, summary: document.summary, content: document.content ?? '', languageCode: document.languageCode, version: '' });
    } catch (error) { toast.error(getErrorMessage(error)); }
  }
  function submit(event: FormEvent) { event.preventDefault(); save.mutate(); }
  return <>
    <div className="page-header"><div><h1>Tài liệu pháp lý</h1><p>Quản lý phiên bản Markdown và trạng thái công bố.</p></div></div>
    <h2>Đang hoạt động</h2>
    {publishedQuery.isLoading ? <p>Đang tải tài liệu đang hoạt động…</p> : publishedQuery.isError ? (
      <div role="alert">
        <p>{getErrorMessage(publishedQuery.error)}</p>
        <button className="btn" onClick={() => void publishedQuery.refetch()} type="button">Thử lại</button>
      </div>
    ) : !publishedQuery.data?.length ? <p>Chưa có tài liệu nào được công bố.</p> : (
      <div className="table-wrap">
        <table>
          <thead><tr><th>Loại</th><th>Tiêu đề</th><th>Phiên bản</th><th>Ngôn ngữ</th><th>Ngày công bố</th></tr></thead>
          <tbody>{publishedQuery.data.map((item) => (
            <tr key={item.id}>
              <td>{labels[item.type] ?? 'Khác'}</td>
              <td>{item.title}</td>
              <td>{item.version}</td>
              <td>{item.languageCode}</td>
              <td>{item.publishedAt ? new Date(item.publishedAt).toLocaleString('vi-VN') : 'Chưa ghi nhận'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    )}
    <h2 style={{ marginTop: 32 }}>Lịch sử phiên bản</h2>
    {query.isLoading ? <p>Đang tải lịch sử…</p> : query.isError ? <div role="alert"><p>Không tải được lịch sử quản trị: {getErrorMessage(query.error)}</p><button className="btn" onClick={() => void query.refetch()} type="button">Thử lại</button></div> : !query.data?.length ? <p>Chưa có phiên bản nào.</p> :
      <div className="table-wrap"><table><thead><tr><th>Loại</th><th>Tiêu đề</th><th>Phiên bản</th><th>Ngôn ngữ</th><th>Trạng thái</th><th>Cập nhật</th><th>Thao tác</th></tr></thead><tbody>{query.data.map((item) => <tr key={item.id}><td>{labels[item.type] ?? 'Khác'}</td><td>{item.title}</td><td>{item.version}</td><td>{item.languageCode}</td><td>{item.isPublished ? 'Đã công bố' : 'Bản nháp'}</td><td>{new Date(item.updatedAt).toLocaleString('vi-VN')}</td><td><button className="btn" onClick={() => void versionFrom(item.id)} type="button">Phiên bản mới</button>{!item.isPublished && <><button className="btn primary" onClick={() => action.mutate({ id: item.id, kind: 'publish' })} type="button">Công bố</button><button className="btn danger" onClick={() => action.mutate({ id: item.id, kind: 'delete' })} type="button">Xóa</button></>}</td></tr>)}</tbody></table></div>}
    <h2 style={{ marginTop: 32 }}>Tạo phiên bản</h2>
    <form className="form-grid" onSubmit={submit}>
      <label>Loại<select disabled={Boolean(sourceId)} value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) })}>{labels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label>
      <label>Tiêu đề<input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Phiên bản<input required maxLength={20} placeholder="1.0" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></label>
      <label>Ngôn ngữ<input required maxLength={10} disabled={Boolean(sourceId)} value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })} /></label>
      <label>Tóm tắt<textarea value={form.summary ?? ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
      <label>Nội dung Markdown<textarea required style={{ minHeight: 300 }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>
      <div><button className="btn primary" disabled={save.isPending} type="submit">{sourceId ? 'Tạo phiên bản mới' : 'Tạo tài liệu'}</button>{sourceId && <button className="btn ghost" onClick={() => { setSourceId(null); setForm(empty); }} type="button">Hủy</button>}</div>
    </form>
  </>;
}

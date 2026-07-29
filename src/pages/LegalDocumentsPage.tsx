import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FilePlus2, RefreshCw, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  createLegalDocument,
  createLegalVersion,
  deleteLegalDocument,
  getLegalDocument,
  getLegalDocuments,
  getPublishedLegalDocuments,
  publishLegalDocument,
  type LegalDocument,
  type LegalInput,
} from '../services/admin-legal.service';
import { getErrorMessage } from '../services/http';

const labels = ['Điều khoản sử dụng', 'Chính sách bảo mật', 'Quyền truy cập ứng dụng', 'Tiêu chuẩn cộng đồng', 'Khác'];
const empty: LegalInput = { type: 0, title: '', summary: '', content: '', languageCode: 'vi', version: '' };

function DocumentCards({
  documents,
  management,
  onDelete,
  onPublish,
  onVersion,
  onView,
}: {
  documents: LegalDocument[];
  management?: boolean;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  onVersion?: (id: string) => void;
  onView?: (id: string) => void;
}) {
  return (
    <div className="legal-document-grid">
      {documents.map((document) => (
        <article className="legal-document-card" key={document.id}>
          <div className="legal-card-heading">
            <div>
              <span className="legal-type">{labels[document.type] ?? 'Khác'}</span>
              <h3>{document.title}</h3>
            </div>
            <span className={`legal-status ${document.isPublished ? 'published' : 'draft'}`}>
              {document.isPublished ? 'Đang hoạt động' : 'Bản nháp'}
            </span>
          </div>
          <p>{document.summary || 'Không có tóm tắt.'}</p>
          <dl className="legal-meta">
            <div><dt>Phiên bản</dt><dd>{document.version}</dd></div>
            <div><dt>Ngôn ngữ</dt><dd>{document.languageCode}</dd></div>
            <div><dt>Cập nhật</dt><dd>{new Date(document.updatedAt).toLocaleString('vi-VN')}</dd></div>
          </dl>
          {(management || onView) && (
            <div className="legal-actions">
              {onView && <button className="btn" onClick={() => onView(document.id)} type="button"><Eye size={15} /> Xem chi tiết</button>}
              {management && <button className="btn" onClick={() => onVersion?.(document.id)} type="button">Tạo phiên bản mới</button>}
              {management && !document.isPublished && (
                <>
                  <button className="btn primary" onClick={() => onPublish?.(document.id)} type="button">Công bố</button>
                  <button className="btn danger" onClick={() => onDelete?.(document.id)} type="button">Xóa</button>
                </>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function LegalDocumentsPage() {
  const client = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [form, setForm] = useState<LegalInput>(empty);
  const [detailId, setDetailId] = useState<string | null>(null);
  const history = useQuery({ queryKey: ['legal-documents'], queryFn: getLegalDocuments, refetchOnMount: 'always', staleTime: 0 });
  const active = useQuery({ queryKey: ['published-legal-documents'], queryFn: getPublishedLegalDocuments, refetchOnMount: 'always', staleTime: 0 });
  const detail = useQuery({
    queryKey: ['legal-document-detail', detailId],
    queryFn: () => getLegalDocument(detailId ?? ''),
    enabled: Boolean(detailId),
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['legal-documents'] }),
      client.invalidateQueries({ queryKey: ['published-legal-documents'] }),
    ]);
  };
  const closeEditor = () => { setEditorOpen(false); setSourceId(null); setForm(empty); };
  const save = useMutation({
    mutationFn: () => sourceId ? createLegalVersion(sourceId, form) : createLegalDocument(form),
    onSuccess: (document) => {
      client.setQueryData<LegalDocument[]>(['legal-documents'], (current = []) => [document, ...current.filter((item) => item.id !== document.id)]);
      toast.success('Đã lưu phiên bản tài liệu.');
      closeEditor();
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: 'publish' | 'delete' }) =>
      kind === 'publish' ? publishLegalDocument(id) : deleteLegalDocument(id),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tài liệu.');
      setDetailId(null);
      void refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  async function versionFrom(id: string) {
    try {
      const document = await getLegalDocument(id);
      setSourceId(id);
      setForm({ type: document.type, title: document.title, summary: document.summary, content: document.content ?? '', languageCode: document.languageCode, version: '' });
      setEditorOpen(true);
    } catch (error) { toast.error(getErrorMessage(error)); }
  }
  function submit(event: FormEvent) { event.preventDefault(); save.mutate(); }
  const historyDocuments = Array.isArray(history.data) ? history.data : [];
  const activeDocuments = Array.isArray(active.data) ? active.data : [];

  return (
    <>
      <div className="page-header">
        <div><h1>Tài liệu pháp lý</h1><p>Quản lý phiên bản Markdown và trạng thái công bố.</p></div>
        <button className="btn primary" onClick={() => { closeEditor(); setEditorOpen(true); }} type="button">
          <FilePlus2 size={17} /> Tạo tài liệu mới
        </button>
      </div>

      {editorOpen && (
        <section className="legal-editor-card">
          <div className="legal-section-heading"><div><h2>{sourceId ? 'Tạo phiên bản mới' : 'Tạo tài liệu mới'}</h2><p>Nội dung được lưu dưới dạng Markdown.</p></div><button className="btn ghost" onClick={closeEditor} type="button">Đóng</button></div>
          <form className="legal-editor-grid" onSubmit={submit}>
            <label>Loại<select disabled={Boolean(sourceId)} value={form.type} onChange={(event) => setForm({ ...form, type: Number(event.target.value) })}>{labels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label>
            <label>Phiên bản<input required maxLength={20} placeholder="1.0.0" value={form.version} onChange={(event) => setForm({ ...form, version: event.target.value })} /></label>
            <label className="legal-editor-wide">Tiêu đề<input required maxLength={255} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
            <label>Ngôn ngữ<input required maxLength={10} disabled={Boolean(sourceId)} value={form.languageCode} onChange={(event) => setForm({ ...form, languageCode: event.target.value })} /></label>
            <label className="legal-editor-wide">Tóm tắt<textarea value={form.summary ?? ''} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label>
            <label className="legal-editor-wide">Nội dung Markdown<textarea required className="legal-content-input" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
            <div className="legal-editor-wide legal-actions"><button className="btn primary" disabled={save.isPending} type="submit">{save.isPending ? 'Đang lưu…' : sourceId ? 'Tạo phiên bản' : 'Tạo tài liệu'}</button><button className="btn ghost" onClick={closeEditor} type="button">Hủy</button></div>
          </form>
        </section>
      )}

      <section className="legal-section">
        <div className="legal-section-heading"><div><h2>Đang hoạt động</h2><p>{activeDocuments.length} tài liệu đã công bố</p></div><button aria-label="Tải lại tài liệu đang hoạt động" className="btn ghost" onClick={() => void active.refetch()} type="button"><RefreshCw size={16} /></button></div>
        {active.isLoading ? <p>Đang tải…</p> : active.isError ? <p role="alert">{getErrorMessage(active.error)}</p> : activeDocuments.length ? <DocumentCards documents={activeDocuments} onView={setDetailId} /> : <p>Chưa có tài liệu nào được công bố.</p>}
      </section>

      <section className="legal-section">
        <div className="legal-section-heading"><div><h2>Lịch sử phiên bản</h2><p>{historyDocuments.length} phiên bản</p></div><button aria-label="Tải lại lịch sử" className="btn ghost" onClick={() => void history.refetch()} type="button"><RefreshCw size={16} /></button></div>
        {history.isLoading ? <p>Đang tải…</p> : history.isError ? <p role="alert">{getErrorMessage(history.error)}</p> : historyDocuments.length ? (
          <DocumentCards
            documents={historyDocuments}
            management
            onDelete={(id) => action.mutate({ id, kind: 'delete' })}
            onPublish={(id) => action.mutate({ id, kind: 'publish' })}
            onVersion={(id) => void versionFrom(id)}
            onView={setDetailId}
          />
        ) : <p>Chưa có phiên bản nào.</p>}
      </section>

      {detailId && (
        <div className="legal-detail-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setDetailId(null);
        }}>
          <aside aria-label="Chi tiết tài liệu pháp lý" aria-modal="true" className="legal-detail-panel" role="dialog">
            <div className="legal-detail-header">
              <div><span className="legal-type">Chi tiết tài liệu</span><h2>{detail.data?.title ?? 'Đang tải…'}</h2></div>
              <button aria-label="Đóng chi tiết" className="btn ghost" onClick={() => setDetailId(null)} type="button"><X size={18} /></button>
            </div>
            {detail.isLoading ? <p>Đang tải chi tiết…</p> : detail.isError ? (
              <div role="alert"><p>{getErrorMessage(detail.error)}</p><button className="btn" onClick={() => void detail.refetch()} type="button">Thử lại</button></div>
            ) : detail.data ? (
              <>
                <div className="legal-detail-status">
                  <span className={`legal-status ${detail.data.isPublished ? 'published' : 'draft'}`}>{detail.data.isPublished ? 'Đang hoạt động' : 'Bản nháp'}</span>
                  <span>Phiên bản {detail.data.version}</span>
                  <span>{detail.data.languageCode}</span>
                </div>
                <dl className="legal-detail-meta">
                  <div><dt>Loại</dt><dd>{labels[detail.data.type] ?? 'Khác'}</dd></div>
                  <div><dt>Ngày tạo</dt><dd>{new Date(detail.data.createdAt).toLocaleString('vi-VN')}</dd></div>
                  <div><dt>Cập nhật</dt><dd>{new Date(detail.data.updatedAt).toLocaleString('vi-VN')}</dd></div>
                  <div><dt>Ngày công bố</dt><dd>{detail.data.publishedAt ? new Date(detail.data.publishedAt).toLocaleString('vi-VN') : 'Chưa ghi nhận'}</dd></div>
                </dl>
                <section><h3>Tóm tắt</h3><p className="legal-detail-summary">{detail.data.summary || 'Không có tóm tắt.'}</p></section>
                <section><h3>Nội dung Markdown</h3><pre className="legal-markdown-preview">{detail.data.content || 'Không có nội dung.'}</pre></section>
                <div className="legal-actions legal-detail-actions">
                  <button className="btn" onClick={() => { setDetailId(null); void versionFrom(detail.data!.id); }} type="button">Tạo phiên bản mới</button>
                  {!detail.data.isPublished && (
                    <>
                      <button className="btn primary" disabled={action.isPending} onClick={() => action.mutate({ id: detail.data!.id, kind: 'publish' })} type="button">Công bố</button>
                      <button className="btn danger" disabled={action.isPending} onClick={() => action.mutate({ id: detail.data!.id, kind: 'delete' })} type="button">Xóa bản nháp</button>
                    </>
                  )}
                </div>
              </>
            ) : null}
          </aside>
        </div>
      )}
    </>
  );
}

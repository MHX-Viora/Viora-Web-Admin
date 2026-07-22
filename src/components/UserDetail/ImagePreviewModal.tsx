export function ImagePreviewModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;

  return (
    <div className="modal-backdrop image-lightbox" onClick={onClose} role="presentation">
      <img src={src} alt="Ảnh phóng to" />
    </div>
  );
}

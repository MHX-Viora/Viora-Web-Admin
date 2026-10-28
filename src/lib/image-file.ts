export const imageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const stickerImageTypes = ['image/png', 'image/webp'] as const;
export function validateImageFile(file: Pick<File, 'type' | 'size'>, types: readonly string[]): string | null {
  if (!types.includes(file.type)) return 'Định dạng ảnh không được hỗ trợ. Vui lòng chọn ' + (types.includes('image/jpeg') ? 'JPEG, PNG hoặc WebP.' : 'PNG hoặc WebP.');
  if (file.size <= 0) return 'Ảnh đã chọn không có dữ liệu.';
  if (file.size > 5 * 1024 * 1024) return 'Ảnh không được vượt quá 5 MB.';
  return null;
}

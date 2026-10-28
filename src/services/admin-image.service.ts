import { apiClient } from './http';
import { imageTypes, validateImageFile } from '../lib/image-file';

export async function uploadAdminImage(file: File): Promise<string> {
  const error = validateImageFile(file, imageTypes);
  if (error) throw new Error(error);
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ url: string }>('/api/admin/images', form);
  const url = new URL(data.url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Không thể nhận đường dẫn ảnh đã tải lên.');
  return data.url;
}

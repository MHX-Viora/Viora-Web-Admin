import { apiClient } from './http';
import { imageTypes, validateImageFile } from '../lib/image-file';
import axios from 'axios';

export async function uploadAdminImage(file: File): Promise<string> {
  const error = validateImageFile(file, imageTypes);
  if (error) throw new Error(error);
  const form = new FormData();
  form.append('file', file);
  let data: unknown;
  try { ({ data } = await apiClient.post<unknown>('/api/admin/images', form)); }
  catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404)
      throw new Error('API tải ảnh admin chưa được triển khai. Cần cập nhật backend trước khi lưu ảnh.', { cause: error });
    if (axios.isAxiosError(error) && error.response?.status === 413)
      throw new Error('Ảnh không được vượt quá 5 MB. Nếu ảnh nhỏ hơn giới hạn này, cần kiểm tra giới hạn upload trên máy chủ.', { cause: error });
    throw error;
  }
  const invalidResponse = 'Không thể nhận đường dẫn ảnh đã tải lên. Vui lòng thử lại hoặc kiểm tra API tải ảnh.';
  const value = data && typeof data === 'object' && 'url' in data ? data.url : undefined;
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\\\s]/.test(value)
    || [...value].some(character => character.charCodeAt(0) < 32)) throw new Error(invalidResponse);
  let url: URL;
  try { url = new URL(value); } catch (cause) { throw new Error(invalidResponse, { cause }); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(invalidResponse);
  return value;
}

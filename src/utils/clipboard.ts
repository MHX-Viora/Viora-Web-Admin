import { toast } from 'sonner';

export async function copyFinancialValue(value: string) {
  try { await navigator.clipboard.writeText(value); toast.success('Đã sao chép'); }
  catch { toast.error('Không thể sao chép. Hãy chọn và sao chép nội dung trực tiếp.'); }
}

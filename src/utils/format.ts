export function formatNumber(value?: number) {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0);
}

export function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

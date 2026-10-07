const formatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
export const isSafeVnd = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
export const formatVnd = (value: unknown): string => isSafeVnd(value) ? `${formatter.format(value)} ₫` : '—';
export const formatAnktCoin = (value: unknown): string => isSafeVnd(value) ? `${formatter.format(value)} ANKT coin` : '—';

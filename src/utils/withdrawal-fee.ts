const percentFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export function parseFeePercent(value: string): number | null {
  const text = value.trim().replace(',', '.');
  if (!/^\d{1,2}(?:\.\d{1,2})?$/.test(text)) return null;
  const percent = Number(text);
  return percent >= 0 && percent <= 99.99 ? percent : null;
}

export const formatFeePercent = (value: number) => percentFormatter.format(value) + '%';

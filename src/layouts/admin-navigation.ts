export type NavigationSearchItem = {
  to: string;
  label: string;
  group: string;
};

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .trim();
}

export function filterNavigationItems<T extends NavigationSearchItem>(items: T[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return items;

  return items.filter((item) => normalizeSearchText(`${item.label} ${item.group}`).includes(normalizedQuery));
}

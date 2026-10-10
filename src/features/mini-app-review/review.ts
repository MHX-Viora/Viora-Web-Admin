import type { AdminReviewContext, AppVersion, HybridApp, MiniAppCategory, MiniAppPermission } from '../../types/mini-app';

export function reviewReadiness(app: Pick<HybridApp, 'status' | 'pendingVersion'>, versions?: AppVersion[], context?: AdminReviewContext, permissions?: MiniAppPermission[], categories?: MiniAppCategory[]) {
  const version = versions?.find(item => item.version === app.pendingVersion && item.status === 'PendingReview');
  const configuration = version?.configuration;
  const blockers: string[] = [];
  let hosts: string[] = [];
  if (!configuration) blockers.push('Chưa có cấu hình phiên bản gửi duyệt hợp lệ. Developer cần gửi phiên bản xét duyệt.');
  if (!['Active', 'PendingReview'].includes(app.status)) blockers.push('Ứng dụng chưa ở trạng thái cho phép phát hành phiên bản.');
  if (!context || !permissions || !categories) blockers.push('Chưa tải đủ hồ sơ Developer, domain và danh mục quyền để kiểm duyệt.');
  if (context && context.developer.status !== 'Active') blockers.push('Hồ sơ Developer chưa được duyệt hoặc đang tạm ngừng.');
  if (configuration) {
    try {
      hosts = [...new Set([...configuration.allowedDomains, new URL(configuration.webUrl).hostname, ...(configuration.allowedOrigins ?? []).map(url => new URL(url).hostname), ...(configuration.callbackUrls ?? []).map(url => new URL(url).hostname)])];
    } catch { blockers.push('Cấu hình website, origin hoặc callback không hợp lệ.'); }
    if (context) for (const host of hosts) if (!context.domains.some(domain => domain.host === host && domain.verifiedAt)) blockers.push(`Domain chưa xác minh: ${host}`);
    if (permissions) for (const code of configuration.permissions) if (!permissions.some(permission => permission.code === code && permission.isActive !== false)) blockers.push(`Quyền không còn được cung cấp: ${code}`);
    if (categories && configuration.categoryId && !categories.some(category => category.id === configuration.categoryId && category.isActive !== false)) blockers.push('Danh mục đã ngừng hoạt động.');
  }
  return { version, configuration, hosts, blockers };
}

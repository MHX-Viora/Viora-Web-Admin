import type { HybridApp, HybridConfig } from '../../types/mini-app';

export const lines = (value: string) => [...new Set(value.split(/[\n,]/).map(item => item.trim()).filter(Boolean))];
export function newConfig(app?: HybridApp): HybridConfig {
  return { name: app?.name ?? '', slug: app?.slug ?? '', description: app?.description ?? '', iconUrl: app?.iconUrl ?? '', coverUrl: app?.coverUrl ?? '', webUrl: app?.webUrl ?? '', callbackUrl: app?.callbackUrl ?? '', allowedDomains: app?.allowedDomains ?? [], permissions: app?.permissions.map(item => item.code) ?? [], isFeatured: app?.isFeatured ?? false, categoryId: app?.categoryId ?? null, authenticationMode: app?.authenticationMode ?? (app ? 'AnktSso' : 'Independent'), callbackUrls: app?.callbackUrls ?? (app?.callbackUrl ? [app.callbackUrl] : []), allowedOrigins: app?.allowedOrigins ?? [], clientAuthenticationMethod: app?.clientAuthenticationMethod ?? 'ClientSecretPost', version: app?.pendingVersion ?? ((app?.publishedVersion ?? 0) + 1) };
}
function https(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.hash && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.)/i.test(url.hostname) && !/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname); } catch { return false; }
}
export function validateConfig(config: HybridConfig, step?: number): string | null {
  if ((step === undefined || step === 0) && (!config.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.slug))) return 'Nhập tên và slug gồm chữ thường, số hoặc dấu gạch ngang.';
  if (step === undefined || step === 1) {
    if (!https(config.webUrl)) return 'Website phải là URL HTTPS công khai.';
    const host = new URL(config.webUrl).hostname;
    if (config.allowedDomains.some(domain => domain.includes('*')) || !config.allowedDomains.includes(host)) return 'Domain website phải khớp domain công khai được đăng ký; không dùng wildcard.';
  }
  if (step === undefined || step === 2 || step === 4) {
    if (config.authenticationMode === 'AnktSso' && (!config.callbackUrls.length || config.callbackUrls.some(url => !https(url)))) return 'ANKT SSO cần ít nhất một callback HTTPS chính xác.';
    if (config.authenticationMode === 'AnktSso' && config.callbackUrls.some(url => !config.allowedDomains.includes(new URL(url).hostname))) return 'Domain callback phải được khai báo và xác minh.';
    if (config.allowedOrigins.some(value => !https(value) || new URL(value).origin !== value)) return 'Origin phải là HTTPS origin, không có đường dẫn hoặc dấu / cuối.';
    if (config.authenticationMode === 'Independent' && config.permissions.some(code => code.startsWith('identity.') || code.startsWith('profile.'))) return 'Quyền danh tính chỉ dùng khi bật ANKT SSO.';
    if (config.authenticationMode === 'AnktSso' && !config.permissions.includes('identity.login')) return 'ANKT SSO cần quyền identity.login.';
  }
  return null;
}

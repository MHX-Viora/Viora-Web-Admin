import type { DeveloperInput, DeveloperProfile } from '../../types/mini-app';

export const registrationStatus = (profile?: DeveloperProfile) => profile?.registrationStatus ?? (profile?.status === 'Active' ? 'Approved' : profile?.status === 'Pending' ? 'PendingReview' : profile?.status ?? 'Draft');
export const canEditRegistration = (profile?: DeveloperProfile) => (!profile || profile.membershipRole === 'Owner') && !['PendingReview', 'Suspended', 'Revoked'].includes(registrationStatus(profile));
export function registrationInput(profile?: DeveloperProfile): DeveloperInput {
  return { name: profile?.name ?? '', email: profile?.email ?? '', phone: profile?.phone ?? '', website: profile?.website ?? '', companyName: profile?.companyName ?? '', partnerType: profile?.partnerType ?? 'Individual', country: profile?.country ?? 'VN', legalName: profile?.legalName ?? '', tradingName: profile?.tradingName ?? '', businessRegistrationNumber: profile?.businessRegistrationNumber ?? '', address: profile?.address ?? '', representativeName: profile?.representativeName ?? '', version: profile?.registrationVersion };
}
export function validateRegistration(input: DeveloperInput): string | null {
  if (!input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return 'Nhập tên và email liên hệ hợp lệ.';
  if (!input.phone?.trim() || !/^[+\d\s().-]{6,20}$/.test(input.phone)) return 'Nhập số điện thoại liên hệ từ 6–20 ký tự.';
  if (!input.country || !/^[A-Z]{2}$/.test(input.country)) return 'Chọn mã quốc gia gồm hai chữ cái, ví dụ VN.';
  if (input.website) { try { const url = new URL(input.website); if (url.protocol !== 'https:' || url.username || url.password) return 'Website phải là địa chỉ HTTPS công khai, không chứa thông tin đăng nhập.'; } catch { return 'Website không hợp lệ.'; } }
  if (input.partnerType !== 'Individual' && (!input.legalName?.trim() || !input.address?.trim() || !input.representativeName?.trim() || !input.website?.trim())) return 'Doanh nghiệp/tổ chức cần tên pháp lý, địa chỉ, website HTTPS và người đại diện.';
  return null;
}

import { developerClient } from './developer-auth.service';
import { unwrapApiData } from './http';
import type { ClientCredentials, AdminPage, AppAnalytics, AppVersion, CreatedMiniApp, DeveloperInput, DeveloperProfile, HybridApp, HybridConfig, MiniAppAudit, MiniAppCategory, MiniAppPermission, TeamMember, VerifiedDomain } from '../types/mini-app';
import type { DeveloperTerms, EmailVerificationChallenge, TechnicalTest } from '../types/developer-platform';

const root = '/api/developer';
const app = (id: string) => `${root}/mini-apps/${encodeURIComponent(id)}`;
async function get<T>(url: string, params?: object) { return unwrapApiData<T>((await developerClient.get(url, { params })).data); }
export const developerApi = {
  organizations: () => get<{ id: string; name: string; status: string; role: string; isAccountOwner: boolean }[]>(`${root}/organizations`),
  selectOrganization: (id: string) => { developerClient.defaults.headers.common['X-Developer-Organization'] = id; },
  appMembers: (id: string) => get<TeamMember[]>(`${app(id)}/members`),
  invitations: () => get<{ id: string; miniAppId: string; accountId: string; role: string; expiresAt: string }[]>(`${root}/invitations`),
  acceptInvitation: async (id: string) => { await developerClient.post(`${root}/invitations/${encodeURIComponent(id)}/accept`); },
  appInvitations: (id: string) => get<{ id: string; accountId: string; role: string; expiresAt: string; acceptedAt?: string | null }[]>(`${app(id)}/invitations`),
  inviteAppMember: async (id: string, accountId: string, role: string) => { await developerClient.post(`${app(id)}/invitations`, { accountId, role }); },
  cancelAppInvitation: async (id: string, invitationId: string) => { await developerClient.delete(`${app(id)}/invitations/${encodeURIComponent(invitationId)}`); },
  updateAppMember: async (id: string, memberId: string, role: string) => { await developerClient.put(`${app(id)}/members/${encodeURIComponent(memberId)}`, { role }); },
  removeAppMember: async (id: string, memberId: string) => { await developerClient.delete(`${app(id)}/members/${encodeURIComponent(memberId)}`); },
  profile: () => get<DeveloperProfile>(`${root}/profile`),
  terms: () => get<DeveloperTerms>(`${root}/terms`),
  saveApplication: async (input: DeveloperInput) => unwrapApiData<DeveloperProfile>((await developerClient.post(`${root}/application/draft`, input)).data),
  submitApplication: async (version: number, termsVersion: string) => { await developerClient.post(`${root}/application/submit`, { version, termsVersion, acceptedTerms: true }); },
  requestEmailVerification: async (email: string) => unwrapApiData<EmailVerificationChallenge>((await developerClient.post(`${root}/email-verification/request`, { email })).data),
  confirmEmailVerification: async (verificationId: string, code: string) => unwrapApiData<{ verified: boolean; email: string; verifiedAt: string }>((await developerClient.post(`${root}/email-verification/confirm`, { verificationId, code })).data),
  register: async (input: DeveloperInput) => unwrapApiData<DeveloperProfile>((await developerClient.post(`${root}/profile`, input)).data),
  updateProfile: async (input: DeveloperInput) => { await developerClient.put(`${root}/profile`, input); },
  apps: () => get<HybridApp[]>(`${root}/mini-apps`),
  app: (id: string) => get<HybridApp>(app(id)),
  create: async (input: HybridConfig) => unwrapApiData<CreatedMiniApp>((await developerClient.post(`${root}/mini-apps`, input)).data),
  update: async (id: string, input: HybridConfig) => { await developerClient.put(app(id), input); },
  submit: async (id: string) => { await developerClient.post(`${app(id)}/submit-review`); },
  publish: async (id: string, version: number) => { await developerClient.post(`${app(id)}/publish`, { version }); },
  unpublish: async (id: string) => { await developerClient.post(`${app(id)}/unpublish`); },
  technicalTest: (id: string) => get<TechnicalTest | null>(`${app(id)}/technical-test`),
  runTechnicalTest: async (id: string) => unwrapApiData<TechnicalTest>((await developerClient.post(`${app(id)}/technical-test`)).data),
  reauth: async (password: string, operation: string, miniAppId: string) => unwrapApiData<{ proof: string }>((await developerClient.post(`${root}/reauth`, { password, operation, miniAppId })).data),
  credentials: (id: string) => get<ClientCredentials>(`${app(id)}/credentials`),
  revokePreviousSecret: async (id: string, proof: string) => { await developerClient.post(`${app(id)}/revoke-previous-secret`, undefined, { headers: { 'X-Developer-Reauth': proof } }); },
  rotate: async (id: string, proof: string, graceMinutes = 0) => unwrapApiData<{ clientSecret: string }>((await developerClient.post(`${app(id)}/rotate-secret`, { graceMinutes }, { headers: { 'X-Developer-Reauth': proof } })).data),
  categories: () => get<MiniAppCategory[]>('/api/mini-apps/categories'),
  permissions: () => get<MiniAppPermission[]>(`${root}/mini-apps/permissions`),
  domains: (id: string) => get<VerifiedDomain[]>(`${app(id)}/domains`),
  addDomain: async (id: string, host: string) => { await developerClient.post(`${app(id)}/domains`, { host }); },
  verifyDomain: async (id: string, domainId: string) => { await developerClient.post(`${app(id)}/domains/${encodeURIComponent(domainId)}/verify`); },
  renewDomain: async (id: string, domainId: string) => { await developerClient.post(`${app(id)}/domains/${encodeURIComponent(domainId)}/renew`); },
  versions: (id: string) => get<AppVersion[]>(`${app(id)}/versions`),
  analytics: (id: string) => get<AppAnalytics>(`${app(id)}/analytics`),
  audit: (id: string, page = 1) => get<AdminPage<MiniAppAudit>>(`${app(id)}/audit`, { page, pageSize: 20 }),
  team: () => get<TeamMember[]>(`${root}/team`),
  addMember: async (accountId: string, role: string, proof: string) => { await developerClient.post(`${root}/team`, { accountId, role }, { headers: { 'X-Developer-Reauth': proof } }); },
  updateMember: async (id: string, role: string, proof: string) => { await developerClient.put(`${root}/team/${encodeURIComponent(id)}`, { role }, { headers: { 'X-Developer-Reauth': proof } }); },
  removeMember: async (id: string, proof: string) => { await developerClient.delete(`${root}/team/${encodeURIComponent(id)}`, { headers: { 'X-Developer-Reauth': proof } }); },
};

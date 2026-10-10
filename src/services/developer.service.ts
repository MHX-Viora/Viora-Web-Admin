import { developerClient } from './developer-auth.service';
import { unwrapApiData } from './http';
import type { AdminPage, AppAnalytics, AppVersion, CreatedMiniApp, DeveloperInput, DeveloperProfile, HybridApp, HybridConfig, MiniAppAudit, MiniAppCategory, MiniAppPermission, TeamMember, VerifiedDomain } from '../types/mini-app';

const root = '/api/developer';
const app = (id: string) => `${root}/mini-apps/${encodeURIComponent(id)}`;
async function get<T>(url: string, params?: object) { return unwrapApiData<T>((await developerClient.get(url, { params })).data); }
export const developerApi = {
  profile: () => get<DeveloperProfile>(`${root}/profile`),
  register: async (input: DeveloperInput) => unwrapApiData<DeveloperProfile>((await developerClient.post(`${root}/profile`, input)).data),
  updateProfile: async (input: DeveloperInput) => { await developerClient.put(`${root}/profile`, input); },
  apps: () => get<HybridApp[]>(`${root}/mini-apps`),
  app: (id: string) => get<HybridApp>(app(id)),
  create: async (input: HybridConfig) => unwrapApiData<CreatedMiniApp>((await developerClient.post(`${root}/mini-apps`, input)).data),
  update: async (id: string, input: HybridConfig) => { await developerClient.put(app(id), input); },
  submit: async (id: string) => { await developerClient.post(`${app(id)}/submit-review`); },
  rotate: async (id: string) => unwrapApiData<{ clientSecret: string }>((await developerClient.post(`${app(id)}/rotate-secret`)).data),
  categories: () => get<MiniAppCategory[]>('/api/mini-apps/categories'),
  permissions: () => get<MiniAppPermission[]>(`${root}/mini-apps/permissions`),
  domains: (id: string) => get<VerifiedDomain[]>(`${app(id)}/domains`),
  addDomain: async (id: string, host: string) => { await developerClient.post(`${app(id)}/domains`, { host }); },
  verifyDomain: async (id: string, domainId: string) => { await developerClient.post(`${app(id)}/domains/${encodeURIComponent(domainId)}/verify`); },
  versions: (id: string) => get<AppVersion[]>(`${app(id)}/versions`),
  analytics: (id: string) => get<AppAnalytics>(`${app(id)}/analytics`),
  audit: (id: string, page = 1) => get<AdminPage<MiniAppAudit>>(`${app(id)}/audit`, { page, pageSize: 20 }),
  team: () => get<TeamMember[]>(`${root}/team`),
  addMember: async (accountId: string, role: string) => { await developerClient.post(`${root}/team`, { accountId, role }); },
  removeMember: async (id: string) => { await developerClient.delete(`${root}/team/${encodeURIComponent(id)}`); },
};

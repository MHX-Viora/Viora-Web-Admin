import { apiClient } from './http';
import { developerClient } from './developer-auth.service';

export interface OpenApiIntegration {
  enabled: boolean;
  issuer: string | null;
  discoveryUrl: string | null;
  hostOrigin: string | null;
  clientId: string;
  approvedScopes: string[];
  approvedCallbackUrls: string[];
  eligible: boolean;
  ssoReadiness?: { autoLoginEnabled: boolean; oAuthConfigurationValid: boolean; callbackDomainsVerified: boolean; pkceSupported: boolean; silentSsoStatus: string; consentRequirements: string; accountLinkingStatus: string };
  accountLinks: number;
  usage: { requests: number; successful: number; unauthorized: number; forbidden: number; rateLimited: number; truncated: boolean };
  recentErrors?: { occurredAt: string; path: string; status: number; correlationId: string | null }[];
}

export async function getOpenApiIntegration(id: string, admin = false): Promise<OpenApiIntegration> {
  const client = admin ? apiClient : developerClient;
  return (await client.get<OpenApiIntegration>(`/api/${admin ? 'admin' : 'developer'}/mini-apps/${encodeURIComponent(id)}/open-api`)).data;
}

export async function revokeOpenApiTokens(id: string, reason: string) {
  await apiClient.post(`/api/admin/mini-apps/${encodeURIComponent(id)}/open-api/revoke-tokens`, { reason });
}

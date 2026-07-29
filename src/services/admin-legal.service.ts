import { apiClient, unwrapApiData } from './http';

export type LegalDocument = {
  id: string; type: number; title: string; summary: string | null; content?: string;
  languageCode: string; version: string; isPublished: boolean;
  publishedAt: string | null; createdAt: string; updatedAt: string;
};
export type LegalInput = Pick<LegalDocument, 'type' | 'title' | 'summary' | 'languageCode' | 'version'> & { content: string };

export async function getLegalDocuments() {
  return unwrapApiData<LegalDocument[]>((await apiClient.get('/api/admin/legal')).data);
}
export async function getPublishedLegalDocuments() {
  return unwrapApiData<LegalDocument[]>((await apiClient.get('/api/legal')).data);
}
export async function getLegalDocument(id: string) {
  return unwrapApiData<LegalDocument>((await apiClient.get(`/api/admin/legal/${id}`)).data);
}
export async function createLegalDocument(input: LegalInput) {
  return unwrapApiData<LegalDocument>((await apiClient.post('/api/admin/legal', input)).data);
}
export async function createLegalVersion(id: string, input: LegalInput) {
  return unwrapApiData<LegalDocument>((await apiClient.put(`/api/admin/legal/${id}`, input)).data);
}
export async function publishLegalDocument(id: string) {
  return apiClient.post(`/api/admin/legal/${id}/publish`);
}
export async function deleteLegalDocument(id: string) {
  return apiClient.delete(`/api/admin/legal/${id}`);
}

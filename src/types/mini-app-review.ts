// Explicit, bounded DTOs for the Stage 7 Admin boundary. Never accept credentials.
type Parser<T> = (value: unknown) => T;
function invalid(): never { throw new Error('Dữ liệu kiểm duyệt không hợp lệ. Hãy tải lại.'); }
function shape<S extends Record<string, Parser<unknown>>>(fields: S): Parser<{ [K in keyof S]: ReturnType<S[K]> }> {
  return value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
    const input = value as Record<string, unknown>;
    if (Object.keys(input).length !== Object.keys(fields).length || Object.keys(input).some(key => !Object.hasOwn(fields, key))) return invalid();
    return Object.fromEntries(Object.entries(fields).map(([key, parse]) => [key, parse(input[key])])) as { [K in keyof S]: ReturnType<S[K]> };
  };
}
const text = (max: number): Parser<string> => value => typeof value === 'string' && value.length <= max ? value : invalid();
const nullable = <T>(parse: Parser<T>): Parser<T | null> => value => value === null ? null : parse(value);
const list = <T>(parse: Parser<T>, max: number): Parser<T[]> => value => Array.isArray(value) && value.length <= max ? value.map(parse) : invalid();
const bool: Parser<boolean> = value => typeof value === 'boolean' ? value : invalid();
const integer = (min: number, max = Number.MAX_SAFE_INTEGER): Parser<number> => value => typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max ? value : invalid();
const oneOf = <T extends string>(values: readonly T[]): Parser<T> => value => values.includes(value as T) ? value as T : invalid();
export const reviewStatuses = ['PendingReview', 'InReview', 'ChangesRequested', 'Rejected', 'Approved'] as const;
export const parseId: Parser<string> = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) && !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(value) ? value : invalid();
export const parseAppId: Parser<string> = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) ? value : invalid();
const date: Parser<string> = value => typeof value === 'string' && value.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? value : invalid();
const hash: Parser<string> = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value) ? value : invalid();
const fingerprint: Parser<string> = value => typeof value === 'string' && /^[A-F0-9]{64}$/.test(value) ? value : invalid();
const intent = shape({ clientIdentity: nullable(parseId), clientId: nullable(text(256)), clientType: oneOf(['Public', 'Confidential']), scopes: list(text(128), 32), redirectUris: list(text(2048), 32), sandboxEnabled: bool });
export const parseSnapshot = shape({ schemaVersion: integer(1, 1), name: text(200), category: text(100), logoUrl: nullable(text(2048)), shortDescription: nullable(text(500)), description: nullable(text(10000)), websiteUrl: nullable(text(2048)), domain: nullable(text(253)), privacyPolicyUrl: nullable(text(2048)), termsOfServiceUrl: nullable(text(2048)), supportEmail: nullable(text(254)), ssoEnabled: bool, sandbox: nullable(intent), production: nullable(intent) });
export const parseReview = shape({ id: parseId, versionId: parseId, versionCode: integer(1), status: oneOf(reviewStatuses), submittedAt: date, reviewStartedAt: nullable(date), decidedAt: nullable(date), concurrencyToken: parseId });
const check = shape({ key: text(128), applicable: bool, status: text(64), messageCode: text(200), evidenceSource: text(200), evidenceAt: nullable(date) });
const change = shape({ field: text(64), message: text(2000) });
const action = shape({ action: text(64), actorType: oneOf(['Developer', 'Admin', 'System']), beforeState: nullable(text(64)), afterState: nullable(text(64)), reason: nullable(text(2000)), createdAt: date });
const reviewDetail = shape({ review: parseReview, versionName: text(100), snapshotHash: hash, snapshot: parseSnapshot, evidence: shape({ schemaVersion: integer(1, 2), versionId: parseId, snapshotHash: hash, sandboxRunId: parseId, configurationFingerprint: fingerprint, evaluatedAt: date, checks: list(check, 100) }), reason: nullable(text(2000)), changes: list(change, 20), actions: list(action, 100) });
const queueItem = shape({ review: parseReview, appId: parseAppId, appName: text(200), versionName: text(100), developerName: text(200), developerEmail: text(254), assignedAdminAccountId: nullable(parseId), logoUrl: nullable(text(2048)) });
const page = <T>(item: Parser<T>) => shape({ items: list(item, 100), page: integer(1, 100000), pageSize: integer(1, 100), total: integer(0) });
export const parseReviewPage = page(queueItem);
const counts = shape({ PendingReview: integer(0), InReview: integer(0), ChangesRequested: integer(0), Rejected: integer(0), Approved: integer(0) });
export const parseOverview = shape({ reviews: counts, publishedApps: integer(0), suspendedApps: integer(0) });
export const parseReviewDetail: Parser<ReturnType<typeof adminDetail>> = value => {
  const result = adminDetail(value);
  const detail = result.review;
  if (detail.review.versionId !== detail.evidence.versionId || detail.snapshotHash !== detail.evidence.snapshotHash) return invalid();
  return result;
};
const adminDetail = shape({ review: reviewDetail, appId: parseAppId, developerName: text(200), developerEmail: text(254), assignedAdminAccountId: nullable(parseId), canStart: bool, canAssign: bool, canDecide: bool, canSuspend: bool });
const app = shape({ appId: parseAppId, name: text(200), developerName: text(200), developerEmail: text(254), legacyStatus: text(64), operationalStatus: oneOf(['NotInitialized', 'Active', 'Suspended']), appVersion: parseId, operationalRevision: nullable(parseId), publicationId: nullable(parseId), publishedVersionId: nullable(parseId), canSuspend: bool, canRestore: bool, operationalReason: nullable(text(2000)) });
export const parseAppPage = page(app);
const version = shape({ id: parseId, versionCode: integer(1), versionName: text(100), state: oneOf(['Draft', 'Submitted', 'Archived']), snapshotHash: hash, concurrencyToken: parseId, createdAt: date, updatedAt: date, submittedAt: nullable(date) });
const publication = shape({ id: parseId, versionId: parseId, reviewId: parseId, status: oneOf(['Published', 'UnpublishedByOwner', 'Archived', 'Suspended']), publishedAt: date, unpublishedAt: nullable(date), concurrencyToken: parseId, suspensionReason: nullable(text(2000)) });
export const parseAppDetail = shape({ app, versions: list(version, 20), publications: list(publication, 20), publishedSnapshot: nullable(parseSnapshot) });
const resultPublication = shape({ id: parseId, versionId: parseId, versionCode: integer(1), approvedReviewRequestId: parseId, status: oneOf(['Published', 'UnpublishedByOwner', 'Archived', 'Suspended']), publishedAt: date, unpublishedAt: nullable(date), concurrencyToken: parseId });
export const parseModerationResult = shape({ operational: shape({ status: oneOf(['Active', 'Suspended']), reason: nullable(text(2000)), suspendedAt: nullable(date), concurrencyToken: parseId }), appVersion: parseId, publication: nullable(resultPublication) });
export type ReviewSummary = ReturnType<typeof parseReview>;
export type ReviewDetail = ReturnType<typeof parseReviewDetail>;
export type ReviewPage = ReturnType<typeof parseReviewPage>;
export type AppDetail = ReturnType<typeof parseAppDetail>;
export type Snapshot = ReturnType<typeof parseSnapshot>;
export type ReviewAction = 'start' | 'assign' | 'approve' | 'reject' | 'request-changes';
export type ReviewCommand = { requestId: string; concurrencyToken: string; reason?: string | null; changes?: { field: string; message: string }[]; adminAccountId?: string };
export type ModerationCommand = { requestId: string; concurrencyToken: string; reason: string; operationalRevision: string | null; publicationId: string | null; publicationRevision: string | null };
export type QueueQuery = { page: number; pageSize: number; search?: string; status?: typeof reviewStatuses[number]; assignee?: string; sort?: 'oldest' | 'newest'; view?: 'published' | 'suspended' };

export function parseQuery(value: QueueQuery, apps = false): QueueQuery {
  const allowed = apps ? ['page', 'pageSize', 'search', 'view'] : ['page', 'pageSize', 'search', 'status', 'assignee', 'sort'];
  if (Object.keys(value).some(key => !allowed.includes(key))) return invalid();
  integer(1, 100000)(value.page); integer(1, 100)(value.pageSize);
  if (value.search !== undefined && (text(128)(value.search), [...value.search].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))) return invalid();
  if (value.status !== undefined) oneOf(reviewStatuses)(value.status);
  if (value.assignee !== undefined) parseId(value.assignee);
  if (value.sort !== undefined) oneOf(['oldest', 'newest'])(value.sort);
  if (value.view !== undefined) oneOf(['published', 'suspended'])(value.view);
  return { ...value };
}
export const changeFields = ['name', 'category', 'logoUrl', 'shortDescription', 'description', 'websiteUrl', 'domain', 'privacyPolicyUrl', 'termsOfServiceUrl', 'supportEmail', 'ssoEnabled', 'sandbox.clientType', 'sandbox.scopes', 'sandbox.redirectUris', 'production.clientType', 'production.scopes', 'production.redirectUris'] as const;
function reason(value: unknown, required: boolean) {
  if (!required && (value === undefined || value === null || value === '')) return;
  if (typeof value !== 'string' || value.trim().length < (required ? 10 : 1) || value.length > 2000) return invalid();
}
export function validateCommand(action: ReviewAction, body: ReviewCommand) {
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > (action === 'start' ? 1024 : 16384)) return invalid();
  oneOf(['start', 'assign', 'approve', 'reject', 'request-changes'])(action);
  const allowed = action === 'start' ? ['requestId', 'concurrencyToken'] : action === 'assign' ? ['requestId', 'concurrencyToken', 'reason', 'adminAccountId'] : ['requestId', 'concurrencyToken', 'reason', 'changes'];
  if (Object.keys(body).some(key => !allowed.includes(key))) return invalid();
  parseId(body.requestId); parseId(body.concurrencyToken);
  if (action === 'start') return;
  reason(body.reason, action !== 'approve');
  if (action === 'assign') { parseId(body.adminAccountId); return; }
  const changes = body.changes ?? [];
  if (!Array.isArray(changes) || changes.length > 20 || (action === 'request-changes' ? changes.length === 0 : changes.length !== 0)) return invalid();
  for (const item of changes) { change(item); oneOf(changeFields)(item.field); if (!item.message.trim()) return invalid(); }
}
export function validateModeration(body: ModerationCommand) {
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > 4096) return invalid();
  if (Object.keys(body).some(key => !['requestId', 'concurrencyToken', 'reason', 'operationalRevision', 'publicationId', 'publicationRevision'].includes(key))) return invalid();
  parseId(body.requestId); parseId(body.concurrencyToken); reason(body.reason, true);
  nullable(parseId)(body.operationalRevision); nullable(parseId)(body.publicationId); nullable(parseId)(body.publicationRevision);
  if ((body.publicationId === null) !== (body.publicationRevision === null)) return invalid();
}

export const statusLabel: Record<string, string> = { PendingReview: 'Chờ xét duyệt', InReview: 'Đang xét duyệt', ChangesRequested: 'Cần chỉnh sửa', Rejected: 'Từ chối', Approved: 'Đã duyệt', Published: 'Đang phát hành', UnpublishedByOwner: 'Chủ ứng dụng đã gỡ', Archived: 'Đã lưu trữ', Suspended: 'Tạm ngưng', Active: 'Đang hoạt động', NotInitialized: 'Chưa khởi tạo', Draft: 'Bản nháp', Submitted: 'Đã gửi' };
export const actionLabels: Record<string, string> = { start: 'Bắt đầu xét duyệt', assign: 'Giao người xét duyệt', approve: 'Phê duyệt', reject: 'Từ chối', 'request-changes': 'Yêu cầu chỉnh sửa', suspend: 'Tạm ngưng ứng dụng', restore: 'Khôi phục ứng dụng' };

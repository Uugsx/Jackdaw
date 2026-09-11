import type { PendingResponseRequest } from "./ResponseReminder";

export interface ResponseTrackingArchiveEntry {
  accountId: number;
  folderId: number;
  emailId: number;
  subject: string;
  receivedAt: number;
  categoryNames: string[];
  archivedAt: number;
}

export type ResponseTrackingArchive = Record<
  string,
  ResponseTrackingArchiveEntry
>;

/**
 * Идентификатор ручного снятия с контроля не зависит от папки: письмо может
 * быть перемещено, но пользователь всё равно ожидает, что оно останется
 * исключённым из живой очереди.
 */
export function responseTrackingArchiveKey(
  request: Pick<PendingResponseRequest, "accountId" | "emailId">,
): string {
  return `${request.accountId}:${request.emailId}`;
}

export function normalizeResponseTrackingArchive(
  value: unknown,
): ResponseTrackingArchive {
  if (!value || typeof value != "object" || Array.isArray(value)) {
    return {};
  }

  const archive: ResponseTrackingArchive = {};
  for (const raw of Object.values(value)) {
    const entry = normalizeArchiveEntry(raw);
    if (entry) {
      archive[responseTrackingArchiveKey(entry)] = entry;
    }
  }
  return archive;
}

export function archiveResponseTrackingRequest(
  archive: ResponseTrackingArchive,
  request: PendingResponseRequest,
  archivedAt = Date.now(),
): ResponseTrackingArchive {
  const safeArchivedAt = positiveTimestamp(archivedAt) ?? Date.now();
  const next = { ...archive };
  next[responseTrackingArchiveKey(request)] = {
    accountId: request.accountId,
    folderId: request.folderId,
    emailId: request.emailId,
    subject: request.subject.trim(),
    receivedAt: request.receivedAt.getTime(),
    categoryNames: normalizeCategoryNames(request.categoryNames),
    archivedAt: safeArchivedAt,
  };
  return next;
}

export function restoreResponseTrackingRequest(
  archive: ResponseTrackingArchive,
  key: string,
): ResponseTrackingArchive {
  if (!(key in archive)) {
    return archive;
  }
  const next = { ...archive };
  delete next[key];
  return next;
}

export function isResponseTrackingArchived(
  request: PendingResponseRequest,
  archive: ResponseTrackingArchive,
): boolean {
  return responseTrackingArchiveKey(request) in archive;
}

export function filterUnarchivedResponseTrackingRequests(
  requests: readonly PendingResponseRequest[],
  archive: ResponseTrackingArchive,
): PendingResponseRequest[] {
  return requests.filter((request) => !isResponseTrackingArchived(request, archive));
}

function normalizeArchiveEntry(value: unknown): ResponseTrackingArchiveEntry | null {
  if (!value || typeof value != "object" || Array.isArray(value)) {
    return null;
  }
  const source = value as Record<string, unknown>;
  const accountId = positiveInteger(source.accountId);
  const folderId = positiveInteger(source.folderId);
  const emailId = positiveInteger(source.emailId);
  const receivedAt = positiveTimestamp(source.receivedAt);
  const archivedAt = positiveTimestamp(source.archivedAt);
  if (
    accountId == null ||
    folderId == null ||
    emailId == null ||
    receivedAt == null ||
    archivedAt == null
  ) {
    return null;
  }
  return {
    accountId,
    folderId,
    emailId,
    subject: typeof source.subject == "string" ? source.subject.trim() : "",
    receivedAt,
    categoryNames: normalizeCategoryNames(source.categoryNames),
    archivedAt,
  };
}

function normalizeCategoryNames(value: unknown): string[] {
  return [
    ...new Set(
      (Array.isArray(value) ? value : [])
        .filter((item): item is string => typeof item == "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function positiveInteger(value: unknown): number | null {
  const result = Number(value);
  return Number.isInteger(result) && result > 0 ? result : null;
}

function positiveTimestamp(value: unknown): number | null {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? Math.floor(result) : null;
}

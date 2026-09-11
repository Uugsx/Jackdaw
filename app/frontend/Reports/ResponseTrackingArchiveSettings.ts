import { getLocalStorage } from "../Util/LocalStorage";
import {
  archiveResponseTrackingRequest,
  normalizeResponseTrackingArchive,
  restoreResponseTrackingRequest,
  type ResponseTrackingArchive,
} from "../../logic/Reports/ResponseTrackingArchive";
import type { PendingResponseRequest } from "../../logic/Reports/ResponseReminder";

export const RESPONSE_TRACKING_ARCHIVE_STORAGE_KEY =
  "reports.response-tracking-archive.v1";

export const responseTrackingArchiveSetting = getLocalStorage<unknown>(
  RESPONSE_TRACKING_ARCHIVE_STORAGE_KEY,
  {},
);

export function getResponseTrackingArchive(
  value: unknown = responseTrackingArchiveSetting.value,
): ResponseTrackingArchive {
  return normalizeResponseTrackingArchive(value);
}

export function archiveResponseRequest(request: PendingResponseRequest): void {
  const archive = getResponseTrackingArchive();
  responseTrackingArchiveSetting.value = archiveResponseTrackingRequest(
    archive,
    request,
  );
}

export function restoreArchivedResponseRequest(key: string): void {
  const archive = getResponseTrackingArchive();
  responseTrackingArchiveSetting.value = restoreResponseTrackingRequest(
    archive,
    key,
  );
}

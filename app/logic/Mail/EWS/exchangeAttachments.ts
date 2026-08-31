import { ensureArray } from "../../util/util";

/** Attachment metadata from Exchange GetItem / FindItem (no file bytes). */
export function exchangeAttachmentEntriesFromJSON(json: Record<string, any>): Record<string, any>[] {
  let raw = json.Attachments;
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }
  if (typeof raw == "object") {
    return [
      ...ensureArray(raw.FileAttachment),
      ...ensureArray(raw.ItemAttachment),
    ].filter(Boolean);
  }
  return [];
}

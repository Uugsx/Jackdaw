import { describe, expect, test } from "vitest";
import {
  archiveResponseTrackingRequest,
  filterUnarchivedResponseTrackingRequests,
  normalizeResponseTrackingArchive,
  responseTrackingArchiveKey,
  restoreResponseTrackingRequest,
} from "../../../logic/Reports/ResponseTrackingArchive";
import type { PendingResponseRequest } from "../../../logic/Reports/ResponseReminder";

const request: PendingResponseRequest = {
  accountId: 7,
  folderId: 11,
  emailId: 42,
  messageID: "<request-42>",
  threadID: "<thread-42>",
  subject: "Access request",
  receivedAt: new Date("2026-09-09T09:00:00.000Z"),
  categoryNames: ["Никита Галкин", "Никита Галкин"],
};

describe("ResponseTrackingArchive", () => {
  test("archives a request by account and email, independently of its folder", () => {
    const archive = archiveResponseTrackingRequest({}, request, 1000);
    const movedRequest = { ...request, folderId: 99 };

    expect(responseTrackingArchiveKey(request)).toBe("7:42");
    expect(filterUnarchivedResponseTrackingRequests([movedRequest], archive)).toEqual([]);
    expect(archive["7:42"]).toEqual({
      accountId: 7,
      folderId: 11,
      emailId: 42,
      subject: "Access request",
      receivedAt: request.receivedAt.getTime(),
      categoryNames: ["Никита Галкин"],
      archivedAt: 1000,
    });
  });

  test("normalizes malformed entries and restores one archived request", () => {
    const archive = normalizeResponseTrackingArchive({
      valid: {
        accountId: 7,
        folderId: 11,
        emailId: 42,
        subject: "Access request",
        receivedAt: 1_000,
        archivedAt: 2_000,
        categoryNames: [" Никита Галкин ", 10],
      },
      malformed: { accountId: 7, emailId: 99 },
    });

    expect(Object.keys(archive)).toEqual(["7:42"]);
    expect(restoreResponseTrackingRequest(archive, "7:42")).toEqual({});
  });
});

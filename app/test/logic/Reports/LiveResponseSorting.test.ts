import { expect, test } from "vitest";
import {
  sortLiveResponseRows,
  type LiveResponseSortRow,
} from "../../../logic/Reports/LiveResponseSorting";
import type {
  PendingResponseRequest,
  ResponseSlaProgress,
} from "../../../logic/Reports/ResponseReminder";

const progress: ResponseSlaProgress = {
  elapsedSeconds: 15 * 60,
  remainingSeconds: 15 * 60,
  overdueSeconds: 0,
  targetSeconds: 30 * 60,
  deadlineAt: new Date("2026-09-10T10:30:00.000Z"),
  status: "within-target",
};

function row(
  emailId: number,
  subject: string,
  receivedAt: string,
  assignee: string,
  rowProgress: ResponseSlaProgress = progress,
): LiveResponseSortRow {
  const request: PendingResponseRequest = {
    accountId: 1,
    folderId: 2,
    emailId,
    messageID: null,
    threadID: null,
    subject,
    receivedAt: new Date(receivedAt),
    categoryNames: [],
  };
  return { request, progress: rowProgress, assignee };
}

test("keeps overdue requests first in the default live queue order", () => {
  const overdue: ResponseSlaProgress = {
    ...progress,
    elapsedSeconds: 2 * 60 * 60,
    remainingSeconds: 0,
    overdueSeconds: 90 * 60,
    status: "over-target",
  };
  const rows = [
    row(1, "Within", "2026-09-10T09:00:00.000Z", "Анна", progress),
    row(2, "Overdue", "2026-09-10T08:00:00.000Z", "Борис", overdue),
  ];

  expect(sortLiveResponseRows(rows, null).map((item) => item.request.emailId)).toEqual([
    2,
    1,
  ]);
});

test("sorts the live queue by the selected column and direction", () => {
  const rows = [
    row(1, "Zebra", "2026-09-10T09:00:00.000Z", "Борис"),
    row(2, "Alpha", "2026-09-10T08:00:00.000Z", "Анна"),
  ];

  expect(
    sortLiveResponseRows(rows, { column: "assignee", direction: "asc" }).map(
      (item) => item.assignee,
    ),
  ).toEqual(["Анна", "Борис"]);
  expect(
    sortLiveResponseRows(rows, { column: "received", direction: "desc" }).map(
      (item) => item.request.emailId,
    ),
  ).toEqual([1, 2]);
});

test("sorts by the SLA deadline date, not by its formatted label", () => {
  const earlierDeadline = {
    ...progress,
    deadlineAt: new Date("2026-09-10T09:30:00.000Z"),
  };
  const laterDeadline = {
    ...progress,
    deadlineAt: new Date("2026-09-10T11:30:00.000Z"),
  };
  const rows = [
    row(1, "Later", "2026-09-10T08:00:00.000Z", "Анна", laterDeadline),
    row(2, "Earlier", "2026-09-10T08:30:00.000Z", "Борис", earlierDeadline),
  ];

  expect(
    sortLiveResponseRows(rows, { column: "deadline", direction: "asc" }).map(
      (item) => item.request.emailId,
    ),
  ).toEqual([2, 1]);
});

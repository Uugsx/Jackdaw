import {
  sortReportRows,
  type ReportSortState,
  type ReportSortValue,
} from "./ReportSorting";
import type {
  PendingResponseRequest,
  ResponseSlaProgress,
  ResponseSlaStatus,
} from "./ResponseReminder";

export type LiveResponseSortColumn =
  | "status"
  | "received"
  | "deadline"
  | "elapsed"
  | "assignee"
  | "subject";

export interface LiveResponseSortRow {
  request: PendingResponseRequest;
  progress: ResponseSlaProgress;
  assignee: string;
}

/**
 * Сортирует оперативную очередь. Без выбранной колонки сохраняется рабочий
 * порядок: сначала просроченные, затем самые давно ожидающие ответа.
 */
export function sortLiveResponseRows(
  rows: readonly LiveResponseSortRow[],
  state: ReportSortState<LiveResponseSortColumn> | null,
): LiveResponseSortRow[] {
  if (!state) {
    return rows.slice().sort(compareDefaultLiveResponseRows);
  }
  return sortReportRows(rows, state, liveResponseSortValue);
}

export function liveResponseSortValue(
  row: LiveResponseSortRow,
  column: LiveResponseSortColumn,
): ReportSortValue {
  switch (column) {
    case "status":
      return statusOrder(row.progress.status);
    case "received":
      return row.request.receivedAt;
    case "deadline":
      return row.progress.deadlineAt;
    case "elapsed":
      return row.progress.elapsedSeconds;
    case "assignee":
      return row.assignee;
    case "subject":
      return row.request.subject;
  }
}

function compareDefaultLiveResponseRows(
  left: LiveResponseSortRow,
  right: LiveResponseSortRow,
): number {
  return (
    statusOrder(left.progress.status) - statusOrder(right.progress.status) ||
    right.progress.elapsedSeconds - left.progress.elapsedSeconds ||
    left.request.receivedAt.getTime() - right.request.receivedAt.getTime() ||
    left.request.emailId - right.request.emailId
  );
}

function statusOrder(status: ResponseSlaStatus): number {
  switch (status) {
    case "over-target":
      return 0;
    case "within-target":
      return 1;
    case "waiting-for-working-hours":
      return 2;
  }
}

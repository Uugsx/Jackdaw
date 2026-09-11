import { expect, test } from "vitest";
import {
  sortReportRows,
  toggleReportSort,
  type ReportSortState,
} from "../../../logic/Reports/ReportSorting";

test("cycles a column through ascending, descending and reset", () => {
  type Column = "name" | "count";
  let state: ReportSortState<Column> | null = null;

  state = toggleReportSort(state, "count");
  expect(state).toEqual({ column: "count", direction: "asc" });
  state = toggleReportSort(state, "count");
  expect(state).toEqual({ column: "count", direction: "desc" });
  expect(toggleReportSort(state, "count")).toBeNull();
  expect(toggleReportSort(state, "name")).toEqual({
    column: "name",
    direction: "asc",
  });
});

test("sorts numbers stably and keeps missing values at the bottom", () => {
  const rows = [
    { name: "same-a", count: 2 },
    { name: "empty", count: null },
    { name: "same-b", count: 2 },
    { name: "first", count: 1 },
  ];

  expect(
    sortReportRows(rows, { column: "count", direction: "asc" }, (row) =>
      row.count,
    ).map((row) => row.name),
  ).toEqual(["first", "same-a", "same-b", "empty"]);

  expect(
    sortReportRows(rows, { column: "count", direction: "desc" }, (row) =>
      row.count,
    ).map((row) => row.name),
  ).toEqual(["same-a", "same-b", "first", "empty"]);
});

test("compares dates by time instead of formatted text", () => {
  const rows = [
    { name: "later", at: new Date("2026-09-10T08:00:00Z") },
    { name: "earlier", at: new Date("2026-09-09T23:00:00Z") },
  ];

  expect(
    sortReportRows(rows, { column: "at", direction: "asc" }, (row) => row.at).map(
      (row) => row.name,
    ),
  ).toEqual(["earlier", "later"]);
});

import { expect, test } from "vitest";
import {
  REPORT_DASHBOARD_DEFAULT_LAYOUT,
  buildCategoryResponderRows,
  defaultResponderCategoryNames,
  filterReportResponsesByCategories,
  intersectResponderCategories,
  moveReportDashboardPanel,
  moveReportDashboardPanelBefore,
  normalizeReportDashboardLayout,
  normalizeResponderAttributionConfig,
  reportDashboardWidthColumns,
  responderResponseShare,
} from "../../../logic/Reports/ReportsPresentation";
import { emptyResponseTimeStats } from "../../../logic/Reports/ReportsData";
import type { MailResponseRow } from "../../../logic/Reports/ReportsData";

test("normalizes and reorders dashboard panels without losing panels", () => {
  const layout = normalizeReportDashboardLayout([
    { id: "topics", width: "full", tall: true },
    { id: "topics", width: "third", tall: false },
    { id: "unknown", width: "half", tall: false },
  ]);

  expect(layout).toHaveLength(REPORT_DASHBOARD_DEFAULT_LAYOUT.length);
  expect(layout[0]).toEqual({ id: "topics", width: "full", tall: true });
  expect(moveReportDashboardPanel(layout, "topics", "down")[1].id).toBe(
    "topics",
  );
  expect(
    moveReportDashboardPanelBefore(layout, "topics", "timeline")[0].id,
  ).toBe("topics");
});

test("maps dashboard width choices to stable six-column spans", () => {
  expect(
    (["third", "half", "two-thirds", "full"] as const).map(
      reportDashboardWidthColumns,
    ),
  ).toEqual([2, 3, 4, 6]);
});

test("calculates responder share from all answered requests", () => {
  expect(responderResponseShare(65, 415)).toBe(65 / 415);
  expect(responderResponseShare(1, 0)).toBe(0);
});

test("maps selected employee name tags to responder rows", () => {
  const categories = [
    {
      name: "Никита Левченко",
      total: 4,
      incoming: 4,
      outgoing: 0,
      answered: 3,
      lastActivity: new Date(2026, 8, 9),
      peakWeekday: 1,
      peakHour: 10,
      responseTime: {
        ...emptyResponseTimeStats(),
        answered: 3,
        averageSeconds: 900,
        minimumSeconds: 300,
        maximumSeconds: 1_800,
        withinTarget: 2,
        overTarget: 1,
      },
    },
    {
      name: "1. Стандартный WS",
      total: 5,
      incoming: 5,
      outgoing: 0,
      answered: 5,
      lastActivity: null,
      peakWeekday: null,
      peakHour: null,
      responseTime: emptyResponseTimeStats(),
    },
  ];

  expect(defaultResponderCategoryNames(categories)).toEqual([
    "Никита Левченко",
  ]);
  expect(
    buildCategoryResponderRows(categories, 2, ["Никита Левченко"]),
  ).toEqual([
    {
      accountId: 2,
      accountName: "Никита Левченко",
      email: "",
      requests: 4,
      answered: 3,
      sent: 3,
      lastActivity: new Date(2026, 8, 9),
      peakWeekday: 1,
      peakHour: 10,
      responseTime: categories[0].responseTime,
    },
  ]);
});

test("keeps responder settings safe and deduplicated", () => {
  expect(
    normalizeResponderAttributionConfig(
      {
        mode: "category",
        categoryNames: [" Никита Левченко ", "Никита Левченко", 5],
      },
      { mode: "profile", categoryNames: ["Елена Силантъева"] },
    ),
  ).toEqual({
    mode: "category",
    categoryNames: ["Никита Левченко"],
  });
});

test("applies the report category filter to responders and response details", () => {
  const responseRow = (
    emailId: number,
    categoryNames: string[],
  ): MailResponseRow => ({
    emailId,
    folderId: 1,
    accountId: 1,
    accountName: "integrators",
    subject: "Тест",
    contactName: "Контакт",
    contactEmail: "contact@example.com",
    requestAt: new Date("2026-09-09T09:00:00Z"),
    responseAt: new Date("2026-09-09T09:01:00Z"),
    durationSeconds: 60,
    withinTarget: true,
    responseTimeStatus: "measured",
    categoryNames,
  });
  const first = responseRow(1, ["Никита Левченко"]);
  const second = responseRow(2, ["Никита Галкин"]);

  expect(
    filterReportResponsesByCategories([first, second], ["Никита Галкин"]).map(
      (response) => response.emailId,
    ),
  ).toEqual([2]);
  expect(
    intersectResponderCategories(
      ["Никита Левченко", "Никита Галкин"],
      ["Никита Галкин"],
    ),
  ).toEqual(["Никита Галкин"]);
  expect(
    filterReportResponsesByCategories([first, second], []).map(
      (response) => response.emailId,
    ),
  ).toEqual([]);
});

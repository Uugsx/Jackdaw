import type {
  MailCategoryRow,
  MailResponseRow,
  MailResponderRow,
} from "./ReportsData";

export type ReportDashboardSectionId =
  | "timeline"
  | "heatmap"
  | "response-time"
  | "response-details"
  | "responders"
  | "topics"
  | "categories"
  | "mail-breakdown"
  | "calendar"
  | "chat"
  | "files";

export type ReportDashboardWidth = "third" | "half" | "two-thirds" | "full";

export interface ReportDashboardPanelLayout {
  id: ReportDashboardSectionId;
  width: ReportDashboardWidth;
  tall: boolean;
}

export type ResponderAttributionMode = "profile" | "category";

export interface ResponderAttributionConfig {
  mode: ResponderAttributionMode;
  categoryNames: string[];
}

export const REPORT_DASHBOARD_DEFAULT_LAYOUT: ReportDashboardPanelLayout[] = [
  { id: "timeline", width: "full", tall: false },
  { id: "heatmap", width: "full", tall: false },
  { id: "response-time", width: "full", tall: false },
  { id: "response-details", width: "full", tall: true },
  { id: "responders", width: "full", tall: false },
  { id: "topics", width: "half", tall: false },
  { id: "categories", width: "half", tall: false },
  { id: "mail-breakdown", width: "half", tall: false },
  { id: "calendar", width: "half", tall: false },
  { id: "chat", width: "half", tall: false },
  { id: "files", width: "half", tall: false },
];

const dashboardSectionIds = new Set<ReportDashboardSectionId>(
  REPORT_DASHBOARD_DEFAULT_LAYOUT.map((panel) => panel.id),
);

export function normalizeReportDashboardLayout(
  value: unknown,
): ReportDashboardPanelLayout[] {
  const input = Array.isArray(value) ? value : [];
  const seen = new Set<ReportDashboardSectionId>();
  const normalized: ReportDashboardPanelLayout[] = [];
  for (const item of input) {
    if (
      !isRecord(item) ||
      !dashboardSectionIds.has(item.id as ReportDashboardSectionId)
    ) {
      continue;
    }
    const id = item.id as ReportDashboardSectionId;
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    normalized.push({
      id,
      width: isDashboardWidth(item.width) ? item.width : defaultPanel(id).width,
      tall: item.tall === true,
    });
  }
  for (const panel of REPORT_DASHBOARD_DEFAULT_LAYOUT) {
    if (!seen.has(panel.id)) {
      normalized.push({ ...panel });
    }
  }
  return normalized;
}

export function moveReportDashboardPanel(
  layout: ReportDashboardPanelLayout[],
  id: ReportDashboardSectionId,
  direction: "up" | "down",
): ReportDashboardPanelLayout[] {
  const next = layout.map((panel) => ({ ...panel }));
  const index = next.findIndex((panel) => panel.id === id);
  if (index < 0) {
    return next;
  }
  const targetIndex = index + (direction === "up" ? -1 : 1);
  if (targetIndex < 0 || targetIndex >= next.length) {
    return next;
  }
  const [panel] = next.splice(index, 1);
  next.splice(targetIndex, 0, panel);
  return next;
}

export function moveReportDashboardPanelBefore(
  layout: ReportDashboardPanelLayout[],
  sourceId: ReportDashboardSectionId,
  targetId: ReportDashboardSectionId,
): ReportDashboardPanelLayout[] {
  if (sourceId === targetId) {
    return layout.map((panel) => ({ ...panel }));
  }
  const next = layout.map((panel) => ({ ...panel }));
  const sourceIndex = next.findIndex((panel) => panel.id === sourceId);
  const targetIndex = next.findIndex((panel) => panel.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) {
    return next;
  }
  const [panel] = next.splice(sourceIndex, 1);
  const adjustedTargetIndex = next.findIndex((item) => item.id === targetId);
  next.splice(adjustedTargetIndex, 0, panel);
  return next;
}

export function cycleReportDashboardWidth(
  width: ReportDashboardWidth,
  direction: "wider" | "narrower" = "wider",
): ReportDashboardWidth {
  const widths: ReportDashboardWidth[] = [
    "third",
    "half",
    "two-thirds",
    "full",
  ];
  const currentIndex = widths.indexOf(width);
  const offset = direction === "wider" ? 1 : -1;
  return widths[
    Math.max(0, Math.min(widths.length - 1, currentIndex + offset))
  ];
}

export function reportDashboardWidthColumns(width: ReportDashboardWidth): number {
  switch (width) {
    case "third":
      return 2;
    case "half":
      return 3;
    case "two-thirds":
      return 4;
    case "full":
      return 6;
  }
}

export function toggleReportDashboardHeight(tall: boolean): boolean {
  return !tall;
}

export function isLikelyPersonCategory(value: string): boolean {
  const tokens = value.trim().split(/\s+/u);
  if (tokens.length < 2 || tokens.length > 4) {
    return false;
  }
  return tokens.every((token) => /^\p{Lu}[\p{L}'’\-]*$/u.test(token));
}

export function defaultResponderCategoryNames(
  categories: Pick<MailCategoryRow, "name">[],
): string[] {
  return categories
    .map((category) => category.name.trim())
    .filter((name) => isLikelyPersonCategory(name));
}

export function buildCategoryResponderRows(
  categories: MailCategoryRow[],
  accountId: number,
  categoryNames: string[],
): MailResponderRow[] {
  const selected = new Set(
    categoryNames.map((name) => name.trim()).filter(Boolean),
  );
  return categories
    .filter((category) => selected.has(category.name.trim()))
    .map((category) => ({
      accountId,
      accountName: category.name,
      email: "",
      requests: category.incoming,
      answered: category.answered,
      // В режиме меток это число подтверждённых первых ответов, а не весь исходящий поток ящика.
      sent: category.answered,
      lastActivity: category.lastActivity ?? null,
      peakWeekday: category.peakWeekday ?? null,
      peakHour: category.peakHour ?? null,
      responseTime: category.responseTime,
    }))
    .sort(
      (a, b) =>
        b.answered - a.answered ||
        b.requests - a.requests ||
        a.accountName.localeCompare(b.accountName),
    );
}

/** Ограничивает строки ответов выбранными метками входящего запроса. */
export function filterReportResponsesByCategories(
  responses: MailResponseRow[],
  categoryNames: string[] | null,
): MailResponseRow[] {
  if (categoryNames == null) {
    return responses;
  }
  const selected = new Set(
    categoryNames.map((name) => name.trim()).filter(Boolean),
  );
  return responses.filter((response) =>
    response.categoryNames.some((name) => selected.has(name.trim())),
  );
}

/** Оставляет в настройке отвечающих только категории, вошедшие в отчёт. */
export function intersectResponderCategories(
  responderCategories: string[],
  reportCategories: string[] | null,
): string[] {
  if (reportCategories == null) {
    return responderCategories.slice();
  }
  const allowed = new Set(
    reportCategories.map((name) => name.trim()).filter(Boolean),
  );
  return responderCategories.filter((name) => allowed.has(name.trim()));
}

export function normalizeResponderAttributionConfig(
  value: unknown,
  fallback: ResponderAttributionConfig,
): ResponderAttributionConfig {
  if (!isRecord(value)) {
    return { ...fallback, categoryNames: fallback.categoryNames.slice() };
  }
  const mode: ResponderAttributionMode =
    value.mode === "category" || value.mode === "profile"
      ? value.mode
      : fallback.mode;
  const categoryNames = Array.isArray(value.categoryNames)
    ? value.categoryNames
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim())
        .filter(Boolean)
    : fallback.categoryNames.slice();
  return {
    mode,
    categoryNames: [...new Set(categoryNames)],
  };
}

function defaultPanel(
  id: ReportDashboardSectionId,
): ReportDashboardPanelLayout {
  return (
    REPORT_DASHBOARD_DEFAULT_LAYOUT.find((panel) => panel.id === id) ??
    REPORT_DASHBOARD_DEFAULT_LAYOUT[0]
  );
}

function isDashboardWidth(value: unknown): value is ReportDashboardWidth {
  return (
    value === "third" ||
    value === "half" ||
    value === "two-thirds" ||
    value === "full"
  );
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

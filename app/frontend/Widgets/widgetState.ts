import { getLocalStorage } from "../Util/LocalStorage";
import { gt } from "../../l10n/l10n";
import { closeWidgetPopout } from "../../logic/util/widgetBrowser";
import { writable } from "svelte/store";

export type WidgetKind = "web" | "calendar";

export type WidgetRefreshMinutes = 0 | 1 | 2 | 5 | 10 | 30 | 60 | 90;

export interface WidgetWebSettings {
  refreshMinutes?: WidgetRefreshMinutes;
  mobileVersion?: boolean;
  /** null = use splitter width */
  customWidthPx?: number | null;
  /** Unmount webview while tab is hidden to save CPU/RAM (cookies stay). */
  freezeWhenHidden?: boolean;
}

export interface WidgetEntry {
  id: string;
  name: string;
  kind: WidgetKind;
  url?: string;
  settings?: WidgetWebSettings;
}

export const WIDGET_REFRESH_MINUTES: WidgetRefreshMinutes[] = [0, 1, 2, 5, 10, 30, 60, 90];

export const WIDGET_PANEL_WIDTHS: Array<number | null> = [null, 280, 320, 360, 420, 480, 560];

export const MOBILE_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

const calendarWidget: WidgetEntry = {
  id: "calendar",
  name: gt`Calendar`,
  kind: "calendar",
};

export const defaultWidgets: WidgetEntry[] = [
  calendarWidget,
  {
    id: "chatgpt",
    name: "ChatGPT",
    kind: "web",
    url: "https://chatgpt.com",
  },
];

export const widgetsEnabled = getLocalStorage("widgets.enabled", true);
export const widgetsExpanded = getLocalStorage("widgets.expanded", false);
export const widgetsListSetting = getLocalStorage<WidgetEntry[]>("widgets.list", defaultWidgets);
export const activeWidgetIdSetting = getLocalStorage<string | null>("widgets.active", defaultWidgets[0]?.id ?? null);

/** Increment to ask an open web widget panel to reload after sign-in. */
export const widgetReloadNonce = writable<Record<string, number>>({});

export function reloadWebWidget(id: string) {
  widgetReloadNonce.update(map => ({ ...map, [id]: (map[id] ?? 0) + 1 }));
}

export function getWidgetWebSettings(entry: WidgetEntry): Required<WidgetWebSettings> {
  return {
    refreshMinutes: entry.settings?.refreshMinutes ?? 0,
    mobileVersion: entry.settings?.mobileVersion ?? false,
    customWidthPx: entry.settings?.customWidthPx ?? null,
    freezeWhenHidden: entry.settings?.freezeWhenHidden ?? false,
  };
}

export function updateWidgetSettings(id: string, patch: Partial<WidgetWebSettings>) {
  let list = normalizeWidgetList(widgetsListSetting.value);
  widgetsListSetting.value = list.map(entry => {
    if (entry.id !== id) {
      return entry;
    }
    let current = getWidgetWebSettings(entry);
    return {
      ...entry,
      settings: { ...current, ...entry.settings, ...patch },
    };
  });
}

export function resetWidgetSettings(id: string) {
  let list = normalizeWidgetList(widgetsListSetting.value);
  widgetsListSetting.value = list.map(entry => {
    if (entry.id !== id) {
      return entry;
    }
    let { settings: _removed, ...rest } = entry;
    return rest;
  });
  reloadWebWidget(id);
}

export function updateWebWidget(id: string, name: string, url: string) {
  let list = normalizeWidgetList(widgetsListSetting.value);
  widgetsListSetting.value = list.map(entry => {
    if (entry.id !== id) {
      return entry;
    }
    return { ...entry, name: name.trim(), url: url.trim() };
  });
  reloadWebWidget(id);
}

export function normalizeWidgetList(list: WidgetEntry[] | null | undefined): WidgetEntry[] {
  let items = (list ?? []).map(entry => ({
    ...entry,
    kind: entry.kind ?? (entry.url ? "web" as const : "calendar" as const),
  }));
  if (!items.some(w => w.kind === "calendar")) {
    items = [calendarWidget, ...items];
  }
  return items.length ? items : defaultWidgets;
}

export function selectWidget(id: string) {
  activeWidgetIdSetting.value = id;
  widgetsExpanded.value = true;
}

export function toggleWidgetPanel() {
  widgetsExpanded.value = !widgetsExpanded.value;
}

export function addWebWidget(name: string, url: string): WidgetEntry {
  let list = normalizeWidgetList(widgetsListSetting.value);
  let entry: WidgetEntry = {
    id: crypto.randomUUID(),
    name: name.trim(),
    kind: "web",
    url: url.trim(),
  };
  widgetsListSetting.value = [...list, entry];
  selectWidget(entry.id);
  return entry;
}

export function removeWidget(id: string) {
  if (id === calendarWidget.id) {
    return;
  }
  closeWidgetPopout("widget-" + id);
  let list = normalizeWidgetList(widgetsListSetting.value).filter(w => w.id !== id);
  widgetsListSetting.value = list.length ? list : defaultWidgets;
  if (activeWidgetIdSetting.value === id) {
    activeWidgetIdSetting.value = list[0]?.id ?? calendarWidget.id;
  }
}

export function isBuiltInWidget(entry: WidgetEntry): boolean {
  return entry.kind === "calendar";
}

export function migrateWidgetListIfNeeded(): void {
  let current = widgetsListSetting.value;
  let normalized = normalizeWidgetList(current);
  if (
    current.length !== normalized.length
    || normalized.some((entry, index) => entry.id !== current[index]?.id || entry.kind !== current[index]?.kind)
  ) {
    widgetsListSetting.value = normalized;
  }
}

import { getLocalStorage } from "../../Util/LocalStorage";
import { writable } from "svelte/store";
import { gt } from "../../../l10n/l10n";

/** Built-in Outlook-style quick filters / sorts for the message list. */
export type QuickFilterId =
  | "unread"
  | "starred"
  | "important"
  | "attachments"
  | "fromMe"
  | "toMe"
  | "replied"
  | "newest"
  | "oldest"
  | "bySender"
  | "bySubject";

export type MailListSort = "date-desc" | "date-asc" | "sender" | "subject";

export interface QuickFilterDef {
  id: QuickFilterId;
  kind: "filter" | "sort";
  label: () => string;
  /** For sort chips */
  sort?: MailListSort;
}

export const allQuickFilters: QuickFilterDef[] = [
  { id: "unread", kind: "filter", label: () => gt`Unread` },
  { id: "starred", kind: "filter", label: () => gt`Flagged` },
  { id: "important", kind: "filter", label: () => gt`Important` },
  { id: "attachments", kind: "filter", label: () => gt`Has attachments` },
  { id: "toMe", kind: "filter", label: () => gt`To me` },
  { id: "fromMe", kind: "filter", label: () => gt`From me` },
  { id: "replied", kind: "filter", label: () => gt`Replied` },
  { id: "newest", kind: "sort", label: () => gt`Newest`, sort: "date-desc" },
  { id: "oldest", kind: "sort", label: () => gt`Oldest`, sort: "date-asc" },
  { id: "bySender", kind: "sort", label: () => gt`By sender`, sort: "sender" },
  { id: "bySubject", kind: "sort", label: () => gt`By subject`, sort: "subject" },
];

const defaultVisible: QuickFilterId[] = [
  "important",
  "attachments",
  "toMe",
  "unread",
  "newest",
];

const visibleSetting = getLocalStorage<QuickFilterId[]>(
  "mail.quickFilters.visible",
  defaultVisible,
);
const visibleLayoutVersion = getLocalStorage<number>("mail.quickFilters.layoutVersion", 0);
if ((visibleLayoutVersion.value ?? 0) < 4) {
  visibleSetting.value = [...defaultVisible];
  visibleLayoutVersion.value = 4;
}

const sortSetting = getLocalStorage<MailListSort>("mail.listSort", "date-desc");

/** Reactive sort used by message lists */
export const mailListSort = writable<MailListSort>(sortSetting.value ?? "date-desc");
mailListSort.subscribe(v => {
  if (v && sortSetting.value !== v) {
    sortSetting.value = v;
  }
});

export function getVisibleQuickFilters(): QuickFilterId[] {
  let ids = visibleSetting.value ?? defaultVisible;
  // Migrate old short lists to the richer default once
  if (ids.length <= 3 && ids.every(id => ["unread", "starred", "attachments"].includes(id))) {
    ids = defaultVisible;
    visibleSetting.value = ids;
  }
  // Keep the built-in controls in the same order as the product layout. The
  // old version persisted Unread first; there is no user-facing reorder control,
  // so normalize that legacy order while preserving any extra custom filters.
  let ordered = [
    ...defaultVisible.filter(id => ids.includes(id)),
    ...ids.filter(id => !defaultVisible.includes(id)),
  ];
  if (ordered.some((id, index) => id != ids[index])) {
    ids = ordered;
    visibleSetting.value = ids;
  }
  let known = new Set(allQuickFilters.map(f => f.id));
  return ids.filter(id => known.has(id));
}

export function setVisibleQuickFilters(ids: QuickFilterId[]) {
  visibleSetting.value = ids;
}

export function addQuickFilter(id: QuickFilterId) {
  let ids = getVisibleQuickFilters();
  if (!ids.includes(id)) {
    setVisibleQuickFilters([...ids, id]);
  }
}

export function removeQuickFilter(id: QuickFilterId) {
  setVisibleQuickFilters(getVisibleQuickFilters().filter(x => x != id));
}

export function resetQuickFilters() {
  setVisibleQuickFilters([...defaultVisible]);
}

import { writable } from "svelte/store";
import { getLocalStorage } from "../../Util/LocalStorage";

export type RibbonGroupId = "new" | "delete" | "reply" | "organize" | "status" | "more";
export type RibbonSize = "compact" | "normal" | "large";
export type RibbonPlacement = "start" | "center" | "end";

export interface RibbonPreferences {
  order: RibbonGroupId[];
  hidden: RibbonGroupId[];
  size: RibbonSize;
  placement: RibbonPlacement;
}

export const ribbonGroupLabels: Record<RibbonGroupId, string> = {
  new: "New item",
  delete: "Delete",
  reply: "Reply",
  organize: "Organize",
  status: "Message status",
  more: "More",
};

const defaultPreferences: RibbonPreferences = {
  order: ["new", "delete", "reply", "organize", "status", "more"],
  hidden: [],
  size: "normal",
  placement: "start",
};

const setting = getLocalStorage<unknown>("mail.ribbon.preferences.v1", defaultPreferences);

function isGroupId(value: unknown): value is RibbonGroupId {
  return value == "new" || value == "delete" || value == "reply" ||
    value == "organize" || value == "status" || value == "more";
}

function isSize(value: unknown): value is RibbonSize {
  return value == "compact" || value == "normal" || value == "large";
}

function isPlacement(value: unknown): value is RibbonPlacement {
  return value == "start" || value == "center" || value == "end";
}

function readPreferences(): RibbonPreferences {
  const value = setting.value;
  const input = value && typeof value == "object" ? value as Partial<RibbonPreferences> : {};
  const order = Array.isArray(input.order) ? input.order.filter(isGroupId) : [];
  const hidden = Array.isArray(input.hidden) ? input.hidden.filter(isGroupId) : [];
  return {
    order: [...new Set([...order, ...defaultPreferences.order])],
    hidden: [...new Set(hidden)],
    size: isSize(input.size) ? input.size : defaultPreferences.size,
    placement: isPlacement(input.placement) ? input.placement : defaultPreferences.placement,
  };
}

export const ribbonPreferences = writable(readPreferences());

function writePreferences(next: RibbonPreferences): void {
  setting.value = next;
  ribbonPreferences.set(next);
}

export function setRibbonSize(size: RibbonSize): void {
  writePreferences({ ...readPreferences(), size });
}

export function setRibbonPlacement(placement: RibbonPlacement): void {
  writePreferences({ ...readPreferences(), placement });
}

export function moveRibbonGroup(
  id: RibbonGroupId,
  direction: "up" | "down",
  availableGroups?: RibbonGroupId[],
): void {
  const preferences = readPreferences();
  const visibleOrder = (availableGroups ?? preferences.order)
    .filter(group => !preferences.hidden.includes(group))
    .filter(group => preferences.order.includes(group));
  const visibleIndex = visibleOrder.indexOf(id);
  const targetVisibleIndex = visibleIndex + (direction == "up" ? -1 : 1);
  if (visibleIndex < 0 || targetVisibleIndex < 0 || targetVisibleIndex >= visibleOrder.length) {
    return;
  }
  const order = preferences.order.slice();
  const sourceIndex = order.indexOf(id);
  const targetIndex = order.indexOf(visibleOrder[targetVisibleIndex]);
  [order[sourceIndex], order[targetIndex]] = [order[targetIndex], order[sourceIndex]];
  writePreferences({ ...preferences, order });
}

export function moveRibbonGroupBefore(id: RibbonGroupId, beforeId: RibbonGroupId): void {
  const preferences = readPreferences();
  const sourceIndex = preferences.order.indexOf(id);
  const targetIndex = preferences.order.indexOf(beforeId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex == targetIndex) {
    return;
  }
  const order = preferences.order.slice();
  const [moved] = order.splice(sourceIndex, 1);
  order.splice(order.indexOf(beforeId), 0, moved);
  writePreferences({ ...preferences, order });
}

export function setRibbonGroupHidden(id: RibbonGroupId, hidden: boolean): void {
  const preferences = readPreferences();
  const nextHidden = hidden
    ? [...new Set([...preferences.hidden, id])]
    : preferences.hidden.filter(item => item != id);
  writePreferences({ ...preferences, hidden: nextHidden });
}

export function resetRibbonPreferences(): void {
  writePreferences({
    order: [...defaultPreferences.order],
    hidden: [],
    size: defaultPreferences.size,
    placement: defaultPreferences.placement,
  });
}

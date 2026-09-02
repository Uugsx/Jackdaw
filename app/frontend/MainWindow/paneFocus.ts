import { get, writable } from "svelte/store";

/** Какая часть главного окна последней получила клик мыши. */
export type PaneFocus = "mail" | "widgets";

export const paneFocus = writable<PaneFocus>("mail");

export function focusMailPane() {
  paneFocus.set("mail");
}

export function focusWidgetPane() {
  paneFocus.set("widgets");
}

export function isMailPaneFocused(): boolean {
  return get(paneFocus) == "mail";
}

export function isWidgetPaneFocused(): boolean {
  return get(paneFocus) == "widgets";
}

export function updatePaneFocusFromPointer(event: PointerEvent | MouseEvent) {
  if (!(event.target instanceof Element)) {
    return;
  }
  if (event.target.closest(".widget-sidebar")) {
    focusWidgetPane();
  } else if (event.target.closest(".content-shell")) {
    focusMailPane();
  }
}

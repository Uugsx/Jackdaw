import type { Tag } from "../../../logic/Abstract/Tag";

export const kTagDragMIME = "application/x-jackdaw-tag";

let draggedTag: Tag | null = null;

export function startTagDrag(tag: Tag): void {
  draggedTag = tag;
}

export function getDraggedTag(): Tag | null {
  return draggedTag;
}

export function clearTagDrag(tag?: Tag): void {
  if (!tag || draggedTag === tag) {
    draggedTag = null;
  }
}

export function isTagDrag(event: DragEvent): boolean {
  return !!getDraggedTag() &&
    Array.from(event.dataTransfer?.types ?? []).includes(kTagDragMIME);
}

export function getTagDropMode(event: DragEvent): "before" | "after" {
  let bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  let relativeY = bounds.height ? (event.clientY - bounds.top) / bounds.height : 0.5;
  return relativeY < 0.5 ? "before" : "after";
}

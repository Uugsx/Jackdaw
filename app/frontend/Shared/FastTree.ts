import type { Collection } from "svelte-collections";

export interface TreeItem<T> {
  /** null = root item (there can be multiple root items) */
  parent: T;
  children: Collection<T>;
  /** Whether child items are visible in the tree. */
  expanded?: boolean;
}

/** @returns 0 = root, 1 = first level children, 2 = grand children etc. */
export function getIndentionLevelFor<T extends TreeItem<T>>(item: T): number {
  let indentionLevel = -1;
  let cur = item;
  while (cur) {
    indentionLevel++;
    cur = cur.parent;
  }
  return indentionLevel;
}

/** Whether `item` is a root folder or nested under one of `roots`. */
export function containsTreeItem<T extends TreeItem<T>>(roots: Collection<T>, item: T | null): boolean {
  if (!item) {
    return false;
  }
  for (let root of roots) {
    if (item === root) {
      return true;
    }
    let cur: T | null = item.parent as T;
    while (cur) {
      if (cur === root) {
        return true;
      }
      cur = cur.parent as T;
    }
  }
  return false;
}

/** Adds a property decorator to a property outside the class.
 * Useful, if you're dynamically adding properties to the JS object and
 * want the decorator for those properties.
 * Use this sparingly. */
export function addPropertyDecorator<T>(obj: T, propertyName: string, decorator: (obj: T, propertyName: string) => void) {
  let descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
  if (descriptor.set) { // TODO multiple decorators
    return;
  }
  decorator(obj, propertyName);
}

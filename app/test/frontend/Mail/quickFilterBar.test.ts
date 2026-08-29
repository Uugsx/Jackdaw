// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { tick, mount, unmount } from "svelte";
import { ArrayColl } from "svelte-collections";

let QuickFilterBar: any;
let quickSearch: any;
let mounted: ReturnType<typeof mount>[] = [];
let localStorageValues = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
  },
});

beforeAll(async () => {
  await import("../../../logic/app");
  QuickFilterBar = (
    await import("../../../frontend/Mail/LeftPane/QuickFilterBar.svelte")
  ).default;
  quickSearch = (await import("../../../frontend/Mail/Selected")).quickSearch;
});

afterEach(() => {
  for (let instance of mounted) {
    unmount(instance);
  }
  mounted = [];
  quickSearch.reset();
  quickSearch.folder = null;
  localStorageValues.clear();
  document.body.replaceChildren();
});

describe("QuickFilterBar", () => {
  test("marks the unread filter as active after it is clicked", async () => {
    let folder = {
      id: "INBOX",
      messages: new ArrayColl(),
      countUnread: 0,
      countTotal: 0,
      countNewArrived: 0,
      subscribe(
        observer: (folder: any, property: string | null, oldValue: any) => void,
      ) {
        observer(this, null, null);
        return () => {};
      },
    } as any;
    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(
      mount(QuickFilterBar, {
        target,
        props: { folder, searchMessages: null },
      }),
    );

    let unreadButton = target.querySelector("button.pill") as HTMLButtonElement;
    expect(unreadButton.classList.contains("active")).toBe(false);
    expect(unreadButton.getAttribute("aria-pressed")).toBe("false");

    unreadButton.click();
    await tick();

    expect(unreadButton.classList.contains("active")).toBe(true);
    expect(unreadButton.getAttribute("aria-pressed")).toBe("true");

    unreadButton.click();
    await tick();

    expect(unreadButton.classList.contains("active")).toBe(false);
    expect(unreadButton.getAttribute("aria-pressed")).toBe("false");
  });
});

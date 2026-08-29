// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { mount, unmount } from "svelte";
import { ArrayColl } from "svelte-collections";

let VerticalMessageList: any;
let localStorageValues = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
  },
});

let mounted: ReturnType<typeof mount>[] = [];

afterEach(() => {
  for (let instance of mounted) {
    unmount(instance);
  }
  mounted = [];
  document.body.replaceChildren();
  localStorageValues.clear();
});

beforeAll(async () => {
  // Load the shared app module first, to work around the existing
  // mail/encryption import cycle when Vitest loads the Svelte components.
  await import("../../../logic/app");
  VerticalMessageList = (await import("../../../frontend/Mail/Vertical/VerticalMessageList.svelte")).default;
});

describe("mail list empty state", () => {
  test("shows the empty-filter-result state", () => {
    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(mount(VerticalMessageList, {
      target,
      props: {
        messages: new ArrayColl(),
        selectedMessages: new ArrayColl(),
        emptyDueToFilter: true,
      },
    }));

    expect(target.textContent).toContain("No messages match these filters");
    expect(target.textContent).toContain("Clear filters to see all messages in this folder.");
    expect(target.textContent).not.toContain("This folder is empty");
  });

  test("shows the empty-folder state when no filter is active", () => {
    let target = document.createElement("div");
    document.body.append(target);
    mounted.push(mount(VerticalMessageList, {
      target,
      props: {
        messages: new ArrayColl(),
        selectedMessages: new ArrayColl(),
      },
    }));

    expect(target.textContent).toContain("This folder is empty");
    expect(target.textContent).toContain("Write a new email or get mail from the server.");
  });
});

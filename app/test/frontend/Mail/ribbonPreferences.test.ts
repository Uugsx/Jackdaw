// @vitest-environment happy-dom
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { get } from "svelte/store";

let moveRibbonGroup: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").moveRibbonGroup;
let moveRibbonGroupBefore: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").moveRibbonGroupBefore;
let resetRibbonPreferences: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").resetRibbonPreferences;
let ribbonPreferences: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").ribbonPreferences;
let setRibbonGroupHidden: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").setRibbonGroupHidden;
let setRibbonPlacement: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").setRibbonPlacement;
let setRibbonSize: typeof import("../../../frontend/Mail/3pane/ribbonPreferences").setRibbonSize;

const localStorageValues = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
    clear: () => localStorageValues.clear(),
  },
});

beforeAll(async () => {
  const preferences = await import("../../../frontend/Mail/3pane/ribbonPreferences");
  moveRibbonGroup = preferences.moveRibbonGroup;
  moveRibbonGroupBefore = preferences.moveRibbonGroupBefore;
  resetRibbonPreferences = preferences.resetRibbonPreferences;
  ribbonPreferences = preferences.ribbonPreferences;
  setRibbonGroupHidden = preferences.setRibbonGroupHidden;
  setRibbonPlacement = preferences.setRibbonPlacement;
  setRibbonSize = preferences.setRibbonSize;
});

describe("ribbonPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
    resetRibbonPreferences();
  });

  test("updates the shared store and persists the selected size", () => {
    setRibbonSize("large");

    expect(get(ribbonPreferences).size).toBe("large");
    expect(JSON.parse(localStorage.getItem("mail.ribbon.preferences.v1")!).size).toBe("large");
  });

  test("moves and hides groups through the same reactive preferences", () => {
    moveRibbonGroup("more", "up");
    setRibbonGroupHidden("status", true);

    expect(get(ribbonPreferences).order).toEqual([
      "new",
      "delete",
      "reply",
      "organize",
      "more",
      "status",
    ]);
    expect(get(ribbonPreferences).hidden).toEqual(["status"]);
  });

  test("changes the placement of the whole ribbon and persists it", () => {
    setRibbonPlacement("center");

    expect(get(ribbonPreferences).placement).toBe("center");
    expect(JSON.parse(localStorage.getItem("mail.ribbon.preferences.v1")!).placement).toBe("center");
  });

  test("moves a group directly before another group", () => {
    moveRibbonGroupBefore("status", "delete");

    expect(get(ribbonPreferences).order).toEqual([
      "new",
      "status",
      "delete",
      "reply",
      "organize",
      "more",
    ]);
  });

  test("skips hidden groups when moving a visible group", () => {
    setRibbonGroupHidden("delete", true);
    moveRibbonGroup("organize", "up");

    expect(get(ribbonPreferences).order).toEqual([
      "new",
      "delete",
      "organize",
      "reply",
      "status",
      "more",
    ]);
  });
});

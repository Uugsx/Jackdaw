// @vitest-environment happy-dom

import { afterEach, describe, expect, test } from "vitest";
import { applyColors } from "../../../frontend/Settings/Global/AppThemeColors";

describe("цвета темы приложения", () => {
  afterEach(() => {
    applyColors({});
  });

  test("применяет пользовательские цвета и очищает их", () => {
    applyColors({
      "main-bg": "#123456",
      "main-fg": "#ffffff",
    });

    expect(document.documentElement.style.getPropertyValue("--main-bg")).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--main-fg")).toBe("#ffffff");

    applyColors({});

    expect(document.documentElement.style.getPropertyValue("--main-bg")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--main-fg")).toBe("");
  });

  test("переопределяет цвета desktop-оболочки окна", () => {
    let windowRoot = document.createElement("div");
    windowRoot.className = "main-window";
    document.body.append(windowRoot);

    applyColors({ "main-bg": "#28b464" });

    expect(windowRoot.style.getPropertyValue("--main-bg")).toBe("#28b464");

    applyColors({});
    expect(windowRoot.style.getPropertyValue("--main-bg")).toBe("");
    windowRoot.remove();
  });
});

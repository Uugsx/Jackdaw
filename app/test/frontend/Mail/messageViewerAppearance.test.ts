import { describe, expect, test } from "vitest";
import { normalizeMessageViewerBackground } from "../../../frontend/Mail/Message/messageViewerAppearance";

describe("фон просмотровщика сообщений", () => {
  test("по умолчанию используется фон темы", () => {
    expect(normalizeMessageViewerBackground(undefined)).toBe("theme");
    expect(normalizeMessageViewerBackground("legacy-value")).toBe("theme");
  });

  test("сохраняет поддерживаемые варианты", () => {
    expect(normalizeMessageViewerBackground("white")).toBe("white");
    expect(normalizeMessageViewerBackground("theme")).toBe("theme");
    expect(normalizeMessageViewerBackground("dark")).toBe("dark");
  });
});

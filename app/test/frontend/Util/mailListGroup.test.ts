import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getMailDayGroupLabel, getMailListGroupKey } from "../../../frontend/Util/date";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  },
});

/** Thursday, 3 Sep 2026 — matches the screenshots the user shared. */
const today = new Date(2026, 8, 3, 15, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(today);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getMailListGroupKey", () => {
  test("today has no section header", () => {
    expect(getMailListGroupKey(new Date(2026, 8, 3, 10, 0))).toBe("today");
    expect(getMailDayGroupLabel(new Date(2026, 8, 3, 10, 0))).toBe("");
  });

  test("yesterday", () => {
    expect(getMailListGroupKey(new Date(2026, 8, 2, 17, 0))).toBe("yesterday");
    expect(getMailDayGroupLabel(new Date(2026, 8, 2, 17, 0))).toBe("Yesterday");
  });

  test("earlier days this week get their own weekday section", () => {
    expect(getMailListGroupKey(new Date(2026, 8, 1, 9, 0))).toMatch(/^weekday:/);
    let label = getMailDayGroupLabel(new Date(2026, 8, 1, 9, 0));
    expect(label.length).toBeGreaterThan(0);
    expect(label).not.toBe("Yesterday");
    expect(label).not.toBe("Last week");
  });

  test("previous calendar week shares one section", () => {
    // 3 Sep 2026 is Thu; this week starts Mon 31 Aug.
    expect(getMailListGroupKey(new Date(2026, 7, 31, 9, 0))).toMatch(/^weekday:/);
    expect(getMailListGroupKey(new Date(2026, 7, 28, 9, 0))).toBe("last-week");
    expect(getMailListGroupKey(new Date(2026, 7, 24, 9, 0))).toBe("last-week");
    expect(getMailDayGroupLabel(new Date(2026, 7, 28, 9, 0))).toBe("Last week");
  });

  test("previous calendar month before last week", () => {
    expect(getMailListGroupKey(new Date(2026, 7, 15, 9, 0))).toBe("last-month");
    expect(getMailDayGroupLabel(new Date(2026, 7, 15, 9, 0))).toBe("Last month");
  });

  test("earlier months this year group by month name", () => {
    expect(getMailListGroupKey(new Date(2026, 5, 10, 9, 0))).toBe("month:2026-5");
    expect(getMailDayGroupLabel(new Date(2026, 5, 10, 9, 0))).toMatch(/June/i);
  });

  test("previous calendar year", () => {
    expect(getMailListGroupKey(new Date(2025, 11, 20, 9, 0))).toBe("last-year");
    expect(getMailDayGroupLabel(new Date(2025, 11, 20, 9, 0))).toBe("Last year");
  });

  test("older years show the year number", () => {
    expect(getMailListGroupKey(new Date(2024, 3, 1, 9, 0))).toBe("year:2024");
    expect(getMailDayGroupLabel(new Date(2024, 3, 1, 9, 0))).toBe("2024");
  });
});

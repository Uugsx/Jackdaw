// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import {
  adaptEmailHtmlForDarkMode,
  adaptInlineStyle,
  adaptTextColor,
  parseCssColor,
} from "../../../frontend/Mail/Message/emailDarkMode";

describe("emailDarkMode", () => {
  test("navy становится светло-синим, не белым", () => {
    let adapted = adaptTextColor("#000080");
    expect(adapted).not.toBe("#e5e7eb");
    let rgb = parseCssColor(adapted!);
    expect(rgb!.b).toBeGreaterThan(rgb!.r);
  });

  test("оранжевый остаётся оранжевым, но светлее", () => {
    let adapted = adaptTextColor("#cc6600");
    expect(adapted).toMatch(/^#/);
    let rgb = parseCssColor(adapted!);
    expect(rgb!.r).toBeGreaterThan(rgb!.b);
  });

  test("светлый текст не меняется", () => {
    expect(adaptTextColor("#f0f0f0")).toBeNull();
  });

  test("белый фон в inline style убирается", () => {
    expect(adaptInlineStyle("background-color: #ffffff; color: navy"))
      .toContain("background-color: transparent");
  });

  test("html с font color адаптирует оттенки", () => {
    let html = `<html><body><font color="#000080">Data</font><font color="#cc6600">Error</font></body></html>`;
    let out = adaptEmailHtmlForDarkMode(html);
    expect(out).not.toContain('color="#000080"');
    expect(out).not.toContain('color="#cc6600"');
    expect(out).toMatch(/color="#[0-9a-f]{6}"/i);
  });

  test("style-блоки адаптируют navy и orange", () => {
    let html = `<html><head><style>.data { color: #000080; } .err { color: #cc6600; }</style></head><body><p class="data">Data</p></body></html>`;
    let out = adaptEmailHtmlForDarkMode(html);
    expect(out).not.toContain("#000080");
    expect(out).not.toContain("#cc6600");
  });
});

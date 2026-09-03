import { expect, test } from "vitest";
import {
  clampMessageZoom,
  kMessageZoomDefault,
  kMessageZoomMax,
  kMessageZoomMin,
  messageZoomHeadStyle,
  messageZoomKeyDirection,
  stepMessageZoom,
} from "../../../frontend/Mail/Message/messageZoom";

test("ограничивает масштаб письма шагами по 10%", () => {
  expect(clampMessageZoom(137)).toBe(140);
  expect(clampMessageZoom(44)).toBe(50);
  expect(clampMessageZoom(250)).toBe(kMessageZoomMax);
});

test("шагает масштаб вверх и вниз", () => {
  expect(stepMessageZoom(100, 1)).toBe(110);
  expect(stepMessageZoom(100, -1)).toBe(90);
  expect(stepMessageZoom(kMessageZoomMin, -1)).toBe(kMessageZoomMin);
  expect(stepMessageZoom(kMessageZoomMax, 1)).toBe(kMessageZoomMax);
});

test("значение по умолчанию — 100%", () => {
  expect(kMessageZoomDefault).toBe(100);
});

test("распознаёт горячие клавиши масштаба", () => {
  expect(messageZoomKeyDirection({ key: "+", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false } as KeyboardEvent)).toBe(1);
  expect(messageZoomKeyDirection({ key: "-", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false } as KeyboardEvent)).toBe(-1);
  expect(messageZoomKeyDirection({ key: "0", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false } as KeyboardEvent)).toBe(0);
  expect(messageZoomKeyDirection({ key: "a", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false } as KeyboardEvent)).toBeNull();
});

test("добавляет CSS масштаба только при отличии от 100%", () => {
  expect(messageZoomHeadStyle(100)).toBe("");
  expect(messageZoomHeadStyle(120)).toContain("zoom: 1.2");
  expect(messageZoomHeadStyle(120)).toContain("calc(100% / 1.2)");
  expect(messageZoomHeadStyle(120)).toContain("overflow-wrap: anywhere");
});

import { getLocalStorage } from "../../Util/LocalStorage";

export const kMessageZoomMin = 50;
export const kMessageZoomMax = 200;
export const kMessageZoomStep = 10;
export const kMessageZoomDefault = 100;

export function getMessageZoomSetting() {
  return getLocalStorage("mail.read.zoom", kMessageZoomDefault);
}

export function clampMessageZoom(value: number): number {
  return Math.min(kMessageZoomMax, Math.max(kMessageZoomMin, Math.round(value / kMessageZoomStep) * kMessageZoomStep));
}

export function stepMessageZoom(current: number, direction: 1 | -1): number {
  return clampMessageZoom(current + direction * kMessageZoomStep);
}

export function isMessageZoomWheelEvent(event: WheelEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

export function isMessageZoomKeyEvent(event: KeyboardEvent): boolean {
  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }
  if (event.altKey || event.shiftKey) {
    return false;
  }
  return event.key == "=" || event.key == "+" || event.key == "-" || event.key == "0";
}

export function messageZoomKeyDirection(event: KeyboardEvent): 1 | -1 | 0 | null {
  if (!isMessageZoomKeyEvent(event)) {
    return null;
  }
  if (event.key == "0") {
    return 0;
  }
  return event.key == "-" ? -1 : 1;
}

export function messageZoomHeadStyle(zoom: number): string {
  if (zoom == kMessageZoomDefault) {
    return "";
  }
  return `<style>html { zoom: ${zoom / 100}; }</style>`;
}

export function isMacPlatform(): boolean {
  return typeof navigator != "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform);
}

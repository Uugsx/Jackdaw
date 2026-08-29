import { writable, get } from "svelte/store";
import type { EMail } from "../../../logic/Mail/EMail";
import { WriteMailJackdawApp, mailApp } from "../MailJackdawApp";
import { getLocalStorage } from "../../Util/LocalStorage";
import { appGlobal } from "../../../logic/app";
import { webMail } from "../../../logic/build";

export type ComposePresentation = "fullscreen" | "window";

export interface FloatingComposeEntry {
  id: string;
  app: WriteMailJackdawApp;
  mail: EMail;
  zIndex: number;
  minimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StoredFloatingLayout {
  mailId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
}

const DEFAULT_WIDTH = 920;
const DEFAULT_HEIGHT = 640;
const VIEWPORT_MARGIN = 12;

const layoutsStorage = getLocalStorage<StoredFloatingLayout[]>("mail.compose.floating.layouts", []);

export const floatingComposes = writable<FloatingComposeEntry[]>([]);

let nextZ = 1200;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function getComposePresentation(): ComposePresentation {
  if (appGlobal.isMobile || webMail) {
    return "fullscreen";
  }
  let value = getLocalStorage("mail.compose.presentation", "fullscreen").value;
  return value === "window" ? "window" : "fullscreen";
}

export function shouldOpenComposeInWindow(): boolean {
  return getComposePresentation() === "window";
}

function clampLayout(
  layout: Pick<FloatingComposeEntry, "x" | "y" | "width" | "height" | "minimized">,
): Pick<FloatingComposeEntry, "x" | "y" | "width" | "height"> {
  if (typeof window === "undefined") {
    return layout;
  }
  let width = Math.max(520, Math.min(layout.width, window.innerWidth - VIEWPORT_MARGIN * 2));
  let height = Math.max(360, Math.min(layout.height, window.innerHeight - VIEWPORT_MARGIN * 2));
  let maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
  let maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - (layout.minimized ? 36 : height) - VIEWPORT_MARGIN);
  return {
    width,
    height,
    x: Math.min(maxX, Math.max(VIEWPORT_MARGIN, layout.x)),
    y: Math.min(maxY, Math.max(VIEWPORT_MARGIN, layout.y)),
  };
}

function storedLayoutForMail(mail: EMail): StoredFloatingLayout | undefined {
  return layoutsStorage.value.find(entry => entry.mailId === mail.id);
}

function defaultLayout(offset: number): Pick<FloatingComposeEntry, "x" | "y" | "width" | "height"> {
  return clampLayout({
    x: 96 + offset * 28,
    y: 72 + offset * 28,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minimized: false,
  });
}

function schedulePersistLayouts(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveTimer = null;
    layoutsStorage.value = get(floatingComposes).map(entry => ({
      mailId: entry.mail.id,
      x: entry.x,
      y: entry.y,
      width: entry.width,
      height: entry.height,
      minimized: entry.minimized,
    }));
  }, 120);
}

export function openFloatingCompose(app: WriteMailJackdawApp, mail: EMail): FloatingComposeEntry {
  let existing = get(floatingComposes).find(entry => entry.mail === mail);
  if (existing) {
    focusFloatingCompose(mail);
    return existing;
  }
  let offset = get(floatingComposes).length;
  let stored = storedLayoutForMail(mail);
  let geometry = stored
    ? clampLayout({
        x: stored.x,
        y: stored.y,
        width: stored.width,
        height: stored.height,
        minimized: stored.minimized,
      })
    : defaultLayout(offset);
  let entry: FloatingComposeEntry = {
    id: crypto.randomUUID(),
    app,
    mail,
    zIndex: ++nextZ,
    minimized: stored?.minimized ?? false,
    ...geometry,
  };
  floatingComposes.update(list => [...list, entry]);
  schedulePersistLayouts();
  return entry;
}

export function focusFloatingCompose(mail: EMail): void {
  floatingComposes.update(list => list.map(entry => {
    if (entry.mail !== mail) {
      return entry;
    }
    return { ...entry, zIndex: ++nextZ, minimized: false };
  }));
  schedulePersistLayouts();
}

export function closeFloatingCompose(mail: EMail): void {
  let entry = get(floatingComposes).find(e => e.mail === mail);
  if (entry) {
    mailApp.subApps.remove(entry.app);
  }
  floatingComposes.update(list => list.filter(e => e.mail !== mail));
  layoutsStorage.value = layoutsStorage.value.filter(stored => stored.mailId !== mail.id);
}

export function updateFloatingCompose(
  id: string,
  patch: Partial<Pick<FloatingComposeEntry, "x" | "y" | "width" | "height" | "minimized">>,
): void {
  floatingComposes.update(list => list.map(entry => {
    if (entry.id !== id) {
      return entry;
    }
    let merged = { ...entry, ...patch };
    let clamped = clampLayout(merged);
    return { ...merged, ...clamped };
  }));
  schedulePersistLayouts();
}

export function getFloatingComposeForMail(mail: EMail): FloatingComposeEntry | undefined {
  return get(floatingComposes).find(entry => entry.mail === mail);
}

export function isFloatingComposeMinimized(mail: EMail): boolean {
  return getFloatingComposeForMail(mail)?.minimized ?? false;
}

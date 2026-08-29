import { appGlobal } from "../app";
import { openExternalURL } from "./os-integration";

/** Opens Jackdaw sign-in window with the same cookie jar as the widget webview. */
export async function openWidgetSignIn(sessionID: string, url: string, title: string): Promise<void> {
  // #if [WEBMAIL || MOBILE]
  await openExternalURL(url);
  // #else
  await appGlobal.remoteApp.openWidgetSignIn(sessionID, url, title);
  // #endif
}

/** Opens a persistent Jackdaw window for sites that refuse to embed in the panel. */
export async function openWidgetPopout(sessionID: string, url: string, title: string): Promise<void> {
  // #if [WEBMAIL || MOBILE]
  await openExternalURL(url);
  // #else
  await appGlobal.remoteApp.openWidgetPopout(sessionID, url, title);
  // #endif
}

export async function focusWidgetPopout(sessionID: string): Promise<boolean> {
  // #if [WEBMAIL || MOBILE]
  return false;
  // #else
  return appGlobal.remoteApp.focusWidgetPopout(sessionID);
  // #endif
}

export async function closeWidgetPopout(sessionID: string): Promise<void> {
  // #if [WEBMAIL || MOBILE]
  // #else
  appGlobal.remoteApp.closeWidgetPopout(sessionID);
  // #endif
}

export async function widgetSessionHasCookies(sessionID: string, url: string): Promise<boolean> {
  // #if [WEBMAIL || MOBILE]
  return false;
  // #else
  return appGlobal.remoteApp.widgetSessionHasCookies(sessionID, url);
  // #endif
}

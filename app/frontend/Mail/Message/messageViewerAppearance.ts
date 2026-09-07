import { getLocalStorage } from "../../Util/LocalStorage";

export type MessageViewerBackground = "white" | "theme" | "dark";

const kMessageViewerBackgroundSetting = "mail.read.background";

/** Общая настройка фона панели чтения и содержимого письма. */
export function getMessageViewerBackgroundSetting() {
  return getLocalStorage<MessageViewerBackground>(kMessageViewerBackgroundSetting, "theme");
}

/** Безопасное значение для старых или вручную изменённых настроек. */
export function normalizeMessageViewerBackground(value: unknown): MessageViewerBackground {
  if (value === "white" || value === "dark") {
    return value;
  }
  return "theme";
}

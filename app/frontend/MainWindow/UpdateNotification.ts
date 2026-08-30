import { appGlobal } from "../../logic/app";
import { webMail } from "../../logic/build";
import { ButtonData, Notification, NotificationSeverity, notifications } from "./Notification";
import { openAboutForUpdate } from "../Settings/About/updateNavigation";
import { gt } from "../../l10n/l10n";

type UpdatePhase = "idle" | "checking" | "available" | "downloading" | "downloaded" | "uptodate" | "unsupported";

let updateNotification: Notification | null = null;
let notifiedVersion: string | null = null;
let unsub: (() => void) | undefined;

const kActivePhases: UpdatePhase[] = ["available", "downloading", "downloaded"];

export function startUpdateNotificationWatcher(): void {
  if (webMail || unsub) {
    return;
  }
  let status = appGlobal.remoteApp?.updateStatus;
  if (!status?.subscribe) {
    return;
  }
  syncUpdateNotification(status);
  unsub = status.subscribe((obj: typeof status) => syncUpdateNotification(obj));
}

export function stopUpdateNotificationWatcher(): void {
  unsub?.();
  unsub = undefined;
  clearUpdateNotification();
}

function clearUpdateNotification() {
  if (updateNotification) {
    notifications.remove(updateNotification);
    updateNotification = null;
  }
}

function syncUpdateNotification(obj: {
  phase?: UpdatePhase;
  version?: string | null;
  readyToInstall?: boolean;
  progress?: number;
}) {
  let phase = obj.phase ?? "idle";
  let version = obj.version ?? null;

  if (phase === "unsupported" || phase === "uptodate" || phase === "checking" || phase === "idle") {
    if (phase === "uptodate" || phase === "idle") {
      notifiedVersion = null;
    }
    clearUpdateNotification();
    return;
  }

  if (!kActivePhases.includes(phase) && !obj.readyToInstall) {
    return;
  }

  if (version && version === notifiedVersion) {
    return;
  }

  if (updateNotification) {
    if (!notifications.find(n => n === updateNotification)) {
      notifiedVersion = version ?? notifiedVersion;
      updateNotification = null;
    } else {
      if (phase === "downloading" && version) {
        updateNotification.message = gt`Downloading update ${version}… ${obj.progress ?? 0}%`;
      }
      return;
    }
  }

  notifiedVersion = version;
  let message = version
    ? gt`Update available: ${version}`
    : gt`Update available`;
  if (phase === "downloading") {
    message = version
      ? gt`Downloading update ${version}… ${obj.progress ?? 0}%`
      : gt`Downloading update…`;
  } else if (phase === "downloaded" || obj.readyToInstall) {
    message = version
      ? gt`Update ready: ${version}`
      : gt`Update ready`;
  }

  updateNotification = new Notification(message, NotificationSeverity.Info);
  updateNotification.buttons.add(new ButtonData(gt`Install`, async () => {
    openAboutForUpdate();
  }));
  notifications.add(updateNotification);
}

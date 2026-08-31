import { appGlobal } from "../../logic/app";
import { webMail } from "../../logic/build";
import { ButtonData, Notification, NotificationSeverity, notifications } from "./Notification";
import { openAboutForUpdate } from "../Settings/About/updateNavigation";
import {
  updateAvailableMessage,
  updateDownloadingMessage,
  updateInstallButtonLabel,
  updateInstalledSuccessMessage,
  updateReadyMessage,
} from "../Settings/About/updateMessages";

type UpdatePhase = "idle" | "checking" | "available" | "downloading" | "downloaded" | "uptodate" | "unsupported";

let updateNotification: Notification | null = null;
let notifiedVersion: string | null = null;
let postUpdateNotified = false;
let unsub: (() => void) | undefined;

const kPostUpdateDismissMs = 12_000;

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
  syncPostUpdateSuccess(status);
  unsub = status.subscribe((obj: typeof status) => {
    syncUpdateNotification(obj);
    syncPostUpdateSuccess(obj);
  });
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

function syncPostUpdateSuccess(obj: { justInstalledVersion?: string | null }) {
  let version = obj.justInstalledVersion;
  if (!version || postUpdateNotified || webMail) {
    return;
  }
  postUpdateNotified = true;
  let noti = new Notification(updateInstalledSuccessMessage(version), NotificationSeverity.Info);
  notifications.add(noti);
  setTimeout(() => notifications.remove(noti), kPostUpdateDismissMs);
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
        updateNotification.message = updateDownloadingMessage(version, obj.progress ?? 0);
      }
      return;
    }
  }

  notifiedVersion = version;
  let message = updateAvailableMessage(version ?? "");
  if (phase === "downloading") {
    message = updateDownloadingMessage(version, obj.progress ?? 0);
  } else if (phase === "downloaded" || obj.readyToInstall) {
    message = updateReadyMessage(version);
  }

  updateNotification = new Notification(message, NotificationSeverity.Info);
  updateNotification.buttons.add(new ButtonData(updateInstallButtonLabel(), async () => {
    openAboutForUpdate();
  }));
  notifications.add(updateNotification);
}

import { gt } from "../../../l10n/l10n";

export type UpdateErrorCode =
  | "ota-not-configured"
  | "ota-no-token"
  | "ota-metadata"
  | "ota-server";

const kBackendErrorPatterns: { pattern: RegExp; code: UpdateErrorCode }[] = [
  { pattern: /missing OTA config|not configured in this build/i, code: "ota-not-configured" },
  { pattern: /missing the update token|update token/i, code: "ota-no-token" },
  { pattern: /Could not read update metadata|Cannot find .*yml/i, code: "ota-metadata" },
  { pattern: /Could not reach the update server|Install the latest build/i, code: "ota-server" },
  { pattern: /Install the release build from GitHub/i, code: "ota-not-configured" },
];

export function messageForUpdateErrorCode(code: UpdateErrorCode, installer: string): string {
  switch (code) {
  case "ota-not-configured":
    return gt`This install is missing OTA config. Download and run the ${installer} from GitHub Releases.`;
  case "ota-no-token":
    return gt`This install is missing the update token. Download and run the ${installer} from GitHub Releases.`;
  case "ota-metadata":
    return gt`Could not read update metadata from GitHub Releases. Install the latest build from GitHub Releases.`;
  case "ota-server":
    return gt`Could not reach the update server. Install the latest build from GitHub Releases.`;
  }
}

export function messageForUpdateError(raw: string | null | undefined, installer: string): string | undefined {
  if (!raw) {
    return undefined;
  }
  for (let entry of kBackendErrorPatterns) {
    if (entry.pattern.test(raw)) {
      return messageForUpdateErrorCode(entry.code, installer);
    }
  }
  return undefined;
}

export function updateUnsupportedMessage(): string {
  return gt`Automatic updates are not configured in this build.`;
}

export function updateAvailableMessage(version: string): string {
  return version
    ? gt`Update available: ${version}`
    : gt`Update available`;
}

export function updateDownloadingMessage(version: string | null, progress: number): string {
  return version
    ? gt`Downloading update ${version}… ${progress}%`
    : gt`Downloading update…`;
}

export function updateReadyMessage(version: string | null): string {
  return version
    ? gt`Update ready: ${version}`
    : gt`Update ready`;
}

export function updateInstallButtonLabel(): string {
  return gt`Install`;
}

export function updateInstalledSuccessMessage(version: string): string {
  return gt`Jackdaw was updated successfully. You're now running version ${version}.`;
}

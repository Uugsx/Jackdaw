<vbox class="update">
  {#if phase === "checking"}
    <div class="status">{$t`Checking for updates…`}</div>
    <div class="progress" role="progressbar" aria-busy="true">
      <div class="progress-fill indeterminate"></div>
    </div>
    {#if checkTimedOut}
      <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
    {/if}
  {:else if phase === "downloading"}
    <div class="status">
      {$t`Downloading update`}{version ? ` ${version}` : ""}… {progress}%
    </div>
    <div class="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" style:width="{progress}%"></div>
    </div>
  {:else if phase === "downloaded" || readyToInstall}
    <div class="status">{$t`Update ready`}{version ? `: ${version}` : ""}</div>
    {#if isMac}
      <p class="hint">
        {$t`The app will close, install the update, and reopen automatically.`}
      </p>
    {:else}
      <p class="hint">{$t`The update will also install automatically when you quit the app.`}</p>
    {/if}
    <hbox class="actions">
      {#if !isMac}
        <Button label={installingUpdate ? $t`Installing update…` : $t`Install update`} onClick={installUpdate}
          disabled={installingUpdate} />
      {:else if installingUpdate}
        <div class="status">{$t`Installing update…`}</div>
      {/if}
      {#if isMac}
        <Button label={$t`Download .dmg`} onClick={openManualDownload} errorCallback={showError} />
      {/if}
    </hbox>
  {:else if phase === "available"}
    <div class="status">{$t`Update found`}{version ? `: ${version}` : ""}. {$t`Downloading…`}</div>
    <div class="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" class:indeterminate={progress <= 0} style:width="{progress > 0 ? Math.max(progress, 2) : undefined}%"></div>
    </div>
    {#if isMac}
      <Button label={$t`Download .dmg manually`} onClick={openManualDownload} errorCallback={showError} />
    {/if}
  {:else if phase === "unsupported"}
    <div class="status">
      {errorEx?.message ?? updateUnsupportedMessage()}
    </div>
    <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
  {:else if phase === "uptodate"}
    <div class="status">{$t`This is the latest version`}</div>
    <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
  {:else}
    <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
  {/if}

  {#if errorEx && phase !== "unsupported"}
    <ErrorMessageInline ex={errorEx} />
  {/if}
</vbox>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { appGlobal } from "../../../logic/app";
  import ErrorMessageInline from "../../Shared/ErrorMessageInline.svelte";
  import Button from "../../Shared/Button.svelte";
  import {
    messageForUpdateError,
    messageForUpdateErrorCode,
    updateUnsupportedMessage,
  } from "./updateMessages";
  import { consumeAboutUpdateFlow } from "./updateNavigation";
  import { t } from "../../../l10n/l10n";

  type UpdatePhase = "idle" | "checking" | "available" | "downloading" | "downloaded" | "uptodate" | "unsupported";

  const kPollIntervalMs = 500;

  let phase: UpdatePhase = "idle";
  let progress = 0;
  let version: string | null = null;
  let readyToInstall = false;
  let installingUpdate = false;
  let errorEx: Error | undefined;
  let unsub: (() => void) | undefined;
  let checkTimedOut = false;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let isMac = false;

  onMount(async () => {
    try {
      isMac = await appGlobal.remoteApp.platform?.() === "darwin";
    } catch {
      isMac = false;
    }
    let status = appGlobal.remoteApp?.updateStatus;
    if (status?.subscribe) {
      unsub = status.subscribe((obj: typeof status) => syncFromBackend(obj));
      syncFromBackend(status);
    }
    await refreshStatus();
    let fromNotification = consumeAboutUpdateFlow();
    if (fromNotification) {
      if (phase === "idle" || phase === "uptodate" || phase === "unsupported") {
        await checkForUpdate(true);
      } else if (phase === "downloaded" || readyToInstall) {
        await installUpdate();
      }
    } else if (phase === "idle") {
      checkForUpdate(false);
    } else if (phase === "checking") {
      startCheckingWatchdog();
    } else if (phase === "available" || phase === "downloading") {
      startDownloadWatchdog();
    }
  });
  async function refreshStatus() {
    let status = await appGlobal.remoteApp.getUpdateStatus?.();
    if (status) {
      syncFromBackend(status);
      if (status.phase === "unsupported") {
        let installer = isMac ? ".dmg" : "setup.exe";
        let message = localizeUpdateStatusError(status, installer);
        if (message) {
          errorEx = new Error(message);
        }
      }
    }
  }

  function localizeUpdateStatusError(status: {
    errorCode?: string | null;
    error?: string | null;
    otaConfigured?: boolean;
    otaTokenPresent?: boolean;
  }, installer: string): string | undefined {
    if (status.errorCode) {
      return messageForUpdateErrorCode(status.errorCode as import("./updateMessages").UpdateErrorCode, installer);
    }
    if (!status.otaConfigured) {
      return messageForUpdateErrorCode("ota-not-configured", installer);
    }
    if (!status.otaTokenPresent) {
      return messageForUpdateErrorCode("ota-no-token", installer);
    }
    if (status.error) {
      return messageForUpdateError(status.error, installer) ?? status.error;
    }
    return updateUnsupportedMessage();
  }

  function clearWatchdog() {
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = undefined;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
    checkTimedOut = false;
  }

  function startDownloadWatchdog() {
    clearWatchdog();
    pollTimer = setInterval(() => {
      refreshStatus().catch(showError);
    }, kPollIntervalMs);
  }

  function startCheckingWatchdog() {
    clearWatchdog();
    pollTimer = setInterval(() => {
      refreshStatus().catch(showError);
    }, kPollIntervalMs);
    watchdog = setTimeout(() => {
      checkTimedOut = true;
    }, 50_000);
  }

  function syncWatchdogForPhase() {
    if (phase === "checking") {
      startCheckingWatchdog();
    } else if (phase === "available" || phase === "downloading") {
      startDownloadWatchdog();
    } else if (phase === "downloaded" || phase === "uptodate" || phase === "unsupported" || phase === "idle") {
      clearWatchdog();
    }
  }

  function syncFromBackend(obj: {
    phase?: UpdatePhase;
    progress?: number;
    version?: string | null;
    readyToInstall?: boolean;
    error?: string | null;
  }) {
    if (obj.phase != null) {
      phase = obj.phase;
      if (phase === "downloading" || phase === "available") {
        installingUpdate = false;
      }
      if (isMac && phase === "downloaded") {
        installingUpdate = true;
      }
    }
    if (obj.progress != null) {
      progress = obj.progress;
    }
    if (obj.version !== undefined) {
      version = obj.version;
    }
    if (obj.readyToInstall != null) {
      readyToInstall = obj.readyToInstall;
    }
    if (obj.error) {
      errorEx = new Error(
        messageForUpdateError(obj.error, isMac ? ".dmg" : "setup.exe") ?? obj.error,
      );
    } else if (obj.error === null) {
      errorEx = undefined;
    }
    syncWatchdogForPhase();
  }

  onDestroy(() => {
    unsub?.();
    clearWatchdog();
  });

  async function checkForUpdate(force: boolean) {
    if (force) {
      clearWatchdog();
    }
    errorEx = undefined;
    try {
      await appGlobal.remoteApp.checkForUpdate(force);
      await refreshStatus();
    } catch (ex) {
      errorEx = ex as Error;
      await refreshStatus();
    }
  }

  async function installUpdate() {
    installingUpdate = true;
    errorEx = undefined;
    try {
      await appGlobal.remoteApp.installUpdate();
    } catch (ex) {
      installingUpdate = false;
      errorEx = ex as Error;
    }
  }

  async function openManualDownload() {
    errorEx = undefined;
    try {
      await appGlobal.remoteApp.openPendingReleaseDownload?.();
    } catch (ex) {
      errorEx = ex as Error;
    }
  }

  function showError(ex: Error) {
    errorEx = ex;
  }
</script>

<style>
  .update {
    align-items: start;
    gap: 8px;
    min-width: min(100%, 24em);
  }
  .status {
    line-height: 1.45;
  }
  .hint {
    margin: 0;
    max-width: 28em;
    line-height: 1.45;
    font-size: 14px;
    color: color-mix(in srgb, var(--fg) 72%, transparent);
  }
  .actions {
    gap: 8px;
    flex-wrap: wrap;
  }
  .progress {
    width: min(100%, 20em);
    height: 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--fg) 12%, transparent);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: inherit;
    background: var(--icon-primary, var(--accent, #2563eb));
    transition: width 0.2s ease;
  }
  .progress-fill.indeterminate {
    width: 35%;
    animation: update-progress-slide 1.1s ease-in-out infinite;
  }
  @keyframes update-progress-slide {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(320%); }
  }
</style>

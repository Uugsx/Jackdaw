<vbox class="update">
  {#if phase === "checking"}
    <div class="status">{$t`Checking for updates…`}</div>
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
    <p class="hint">{$t`The update will also install automatically when you quit the app.`}</p>
    <Button label={installingUpdate ? $t`Installing update…` : $t`Install update`} onClick={installUpdate}
      disabled={installingUpdate} />
  {:else if phase === "available"}
    <div class="status">{$t`Update found`}{version ? `: ${version}` : ""}. {$t`Downloading…`}</div>
    <div class="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" style:width="{Math.max(progress, 2)}%"></div>
    </div>
  {:else if phase === "unsupported"}
    <div class="status">
      {errorEx?.message || $t`Automatic updates are not configured in this build.`}
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
  import { t } from "../../../l10n/l10n";

  type UpdatePhase = "idle" | "checking" | "available" | "downloading" | "downloaded" | "uptodate" | "unsupported";

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

  async function refreshStatus() {
    let status = await appGlobal.remoteApp.getUpdateStatus?.();
    if (status) {
      syncFromBackend(status);
      if (status.phase === "unsupported") {
        if (!status.otaConfigured) {
          errorEx = new Error(
            "This install is missing OTA config. Download and run the setup.exe from GitHub Releases.",
          );
        } else if (!status.otaTokenPresent) {
          errorEx = new Error(
            "This install is missing the update token. Download and run the setup.exe from GitHub Releases.",
          );
        }
      }
    }
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
    }, 2000);
  }

  function startCheckingWatchdog() {
    clearWatchdog();
    pollTimer = setInterval(() => {
      refreshStatus().catch(showError);
    }, 2000);
    watchdog = setTimeout(() => {
      checkTimedOut = true;
    }, 50_000);
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
      errorEx = new Error(obj.error);
    } else if (obj.error === null) {
      errorEx = undefined;
    }
    if (phase === "downloaded" || phase === "uptodate" || phase === "unsupported" || phase === "idle") {
      clearWatchdog();
    }
  }

  onMount(async () => {
    let status = appGlobal.remoteApp?.updateStatus;
    if (status?.subscribe) {
      unsub = status.subscribe((obj: typeof status) => syncFromBackend(obj));
      syncFromBackend(status);
    }
    await refreshStatus();
    if (phase === "idle") {
      checkForUpdate(false);
    } else if (phase === "checking") {
      startCheckingWatchdog();
      checkForUpdate(true);
    } else if (phase === "available" || phase === "downloading") {
      startDownloadWatchdog();
    }
  });

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
</style>

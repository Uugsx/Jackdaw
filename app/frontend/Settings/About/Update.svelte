<vbox class="update">
  {#if checking && phase === "idle"}
    <div class="status">{$t`Checking for updates…`}</div>
  {:else if phase === "checking"}
    <div class="status">{$t`Checking for updates…`}</div>
  {:else if phase === "downloading"}
    <div class="status">
      {$t`Downloading update`}{version ? ` ${version}` : ""}… {progress}%
    </div>
    <div class="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div class="progress-fill" style:width="{progress}%"></div>
    </div>
  {:else if phase === "downloaded" || readyToInstall}
    <div class="status">{$t`Update ready`}{version ? `: ${version}` : ""}</div>
    <Button label={installingUpdate ? $t`Installing update…` : $t`Install update`} onClick={installUpdate}
      disabled={installingUpdate} />
  {:else if phase === "available"}
    <div class="status">{$t`Update found`}{version ? `: ${version}` : ""}. {$t`Downloading…`}</div>
  {:else if phase === "unsupported"}
    <div class="status">{$t`Automatic updates are not configured in this build.`}</div>
    <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
  {:else if phase === "uptodate"}
    <div class="status">{$t`This is the latest version`}</div>
    <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
  {:else}
    <Button label={$t`Check for update`} onClick={() => checkForUpdate(true)} errorCallback={showError} />
  {/if}

  {#if errorEx}
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
  let checking = true;
  let installingUpdate = false;
  let errorEx: Error | undefined;
  let unsub: (() => void) | undefined;

  function syncFromBackend(obj: {
    phase?: UpdatePhase;
    progress?: number;
    version?: string | null;
    readyToInstall?: boolean;
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
  }

  onMount(() => {
    let status = appGlobal.remoteApp?.updateStatus;
    if (status?.subscribe) {
      unsub = status.subscribe((obj: typeof status) => syncFromBackend(obj));
      syncFromBackend(status);
    }
    checkForUpdate(false);
  });

  onDestroy(() => {
    unsub?.();
  });

  async function checkForUpdate(force: boolean) {
    checking = true;
    errorEx = undefined;
    try {
      await appGlobal.remoteApp.checkForUpdate(force);
      syncFromBackend(appGlobal.remoteApp.updateStatus ?? {});
    } catch (ex) {
      errorEx = ex as Error;
    } finally {
      checking = false;
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

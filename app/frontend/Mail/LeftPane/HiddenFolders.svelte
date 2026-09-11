{#if hiddenEntries.length}
  <details class="hidden-folders">
    <summary>
      <span class="summary-label">
        <EyeOffIcon size="14px" aria-hidden="true" />
        <span>{$t`Hidden folders`}</span>
      </span>
      <span class="count">{hiddenEntries.length}</span>
    </summary>
    <div class="hidden-folder-list">
      {#each hiddenEntries as entry (entry.ref.accountId + ":" + entry.ref.folderId + ":" + entry.ref.folderPath)}
        <div class="hidden-folder-row">
          <span class="hidden-folder-label" title={getFolderLabel(entry)}>{getFolderLabel(entry)}</span>
          <button
            type="button"
            class="restore-button"
            title={$t`Show folder`}
            aria-label={$t`Show folder`}
            on:click={() => restoreHiddenFolder(entry.ref)}>
            <EyeIcon size="14px" aria-hidden="true" />
          </button>
        </div>
      {/each}
    </div>
  </details>
{/if}

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import type { Folder } from "../../../logic/Mail/Folder";
  import type { Collection } from "svelte-collections";
  import EyeIcon from "lucide-svelte/icons/eye";
  import EyeOffIcon from "lucide-svelte/icons/eye-off";
  import { t } from "../../../l10n/l10n";
  import {
    findHiddenFolder,
    hiddenFoldersEpoch,
    hiddenFoldersSetting,
    hiddenRefLabel,
    restoreHiddenFolder,
    type HiddenFolderRef,
  } from "./hiddenFolders";

  export let accounts: Collection<MailAccount>;

  let hiddenEntries: Array<{ ref: HiddenFolderRef; folder: Folder | null }> = [];

  $: {
    $accounts;
    $hiddenFoldersEpoch;
    hiddenEntries = ($hiddenFoldersSetting.value ?? []).map(ref => ({
      ref,
      folder: findHiddenFolder(accounts, ref),
    }));
  }

  function getFolderLabel(entry: { ref: HiddenFolderRef; folder: Folder | null }): string {
    return entry.folder
      ? `${entry.folder.account.name} / ${entry.folder.fullPath}`
      : hiddenRefLabel(entry.ref, accounts);
  }
</script>

<style>
  .hidden-folders {
    flex: 0 0 auto;
    margin: 0 8px 6px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--border-radius);
    color: var(--leftbar-fg);
    background: color-mix(in srgb, var(--leftbar-bg) 88%, var(--leftbar-fg));
  }

  .hidden-folders summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 30px;
    padding: 4px 8px;
    box-sizing: border-box;
    cursor: pointer;
    list-style: none;
    font-size: 12px;
    font-weight: 500;
  }

  .hidden-folders summary::-webkit-details-marker {
    display: none;
  }

  .hidden-folders summary::before {
    flex: 0 0 auto;
    color: color-mix(in srgb, var(--leftbar-fg) 60%, transparent);
    content: "›";
    font-size: 18px;
    line-height: 1;
    transform: rotate(0deg);
    transition: transform 120ms ease;
  }

  .hidden-folders[open] summary::before {
    transform: rotate(90deg);
  }

  .summary-label {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    min-width: 0;
    gap: 7px;
  }

  .summary-label span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .count {
    flex: 0 0 auto;
    color: color-mix(in srgb, var(--leftbar-fg) 58%, transparent);
    font-variant-numeric: tabular-nums;
  }

  .hidden-folder-list {
    display: grid;
    gap: 2px;
    padding: 0 4px 4px;
  }

  .hidden-folder-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 4px;
    min-width: 0;
    padding: 2px 4px 2px 26px;
    border-radius: calc(var(--border-radius) - 2px);
  }

  .hidden-folder-row:hover {
    background: var(--hover-bg);
  }

  .hidden-folder-label {
    min-width: 0;
    overflow: hidden;
    color: color-mix(in srgb, var(--leftbar-fg) 72%, transparent);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .restore-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 3px;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--leftbar-fg);
    background: transparent;
    cursor: pointer;
  }

  .restore-button:hover {
    background: var(--hover-bg);
  }

  .restore-button:focus-visible,
  .hidden-folders summary:focus-visible {
    outline: 2px solid var(--input-focus);
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    .hidden-folders summary::before {
      transition: none;
    }
  }
</style>

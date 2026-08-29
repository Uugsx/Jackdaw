<button type="button" class="quick-folder" class:selected={selected}
  aria-pressed={selected}
  on:click={() => dispatch("select", folder)}>
  <FolderIcon {folder} size="14px" />
  <span class="label">{folderLabel}</span>
  <span class="count-cell">
    {#if count}
      <span class="count mail-folder-count">{count}</span>
    {/if}
  </span>
</button>

<script lang="ts">
  import { SpecialFolder, type Folder } from "../../../logic/Mail/Folder";
  import { specialFolderNames } from "../../../logic/Mail/Folder";
  import FolderIcon from "./FolderIcon.svelte";
  import { createEventDispatcher } from "svelte";

  export let folder: Folder;
  export let selected = false;

  const dispatch = createEventDispatcher<{ select: Folder }>();
  $: _folder = $folder;
  $: folderLabel = folder.specialFolder == SpecialFolder.Normal
    ? folder.name
    : specialFolderNames[folder.specialFolder] ?? folder.name;
  $: count = folder.countUnread || folder.countNewArrived;
</script>

<style>
  .quick-folder {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 30px;
    padding: 5px 8px;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    background: transparent;
    color: var(--leftbar-fg);
    font: inherit;
    font-size: 12px;
    text-align: start;
    cursor: default;
  }
  .quick-folder:hover:not(.selected) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .quick-folder.selected {
    background: var(--selected-bg);
    color: var(--selected-fg);
    border-color: color-mix(in srgb, var(--icon-primary) 38%, transparent);
  }
  .quick-folder.selected:hover {
    background: var(--selected-hover-bg);
    color: var(--selected-hover-fg);
  }
  .quick-folder :global(svg) {
    flex-shrink: 0;
    stroke-width: 1.6px;
  }
  .label {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count-cell {
    flex: 0 0 3.5rem;
    min-width: 3.5rem;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .quick-folder.selected :global(.mail-folder-count),
  .quick-folder.selected:hover :global(.mail-folder-count) {
    background: color-mix(in srgb, currentColor 14%, transparent);
    color: inherit;
  }
</style>

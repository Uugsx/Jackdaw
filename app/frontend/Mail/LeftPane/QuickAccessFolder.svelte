<button type="button" class="quick-folder" class:selected={selected}
  aria-pressed={selected}
  on:click={() => dispatch("select", folder)}
  on:contextmenu={removableFromFavorites ? contextMenu.onContextMenu : undefined}>
  <FolderIcon {folder} size="14px" />
  <span class="label">{displayLabel}</span>
  <span class="count-cell">
    {#if count}
      <span class="count mail-folder-count">{count}</span>
    {/if}
  </span>
</button>

{#if removableFromFavorites}
  <ContextMenu bind:this={contextMenu}>
    <MenuItem
      onClick={() => removeFavoriteFolder(folder)}
      label={$t`Remove from favorites`}
      icon={StarIcon} />
  </ContextMenu>
{/if}

<script lang="ts">
  import { SpecialFolder, type Folder } from "../../../logic/Mail/Folder";
  import { specialFolderNames } from "../../../logic/Mail/Folder";
  import FolderIcon from "./FolderIcon.svelte";
  import ContextMenu from "../../Shared/Menu/ContextMenu.svelte";
  import MenuItem from "../../Shared/Menu/MenuItem.svelte";
  import StarIcon from "lucide-svelte/icons/star";
  import { createEventDispatcher } from "svelte";
  import { t } from "../../../l10n/l10n";
  import { removeFavoriteFolder } from "./favoriteFolders";

  export let folder: Folder;
  export let selected = false;
  export let showAccountLabel = false;
  export let accountLabel = "";
  export let removableFromFavorites = false;

  const dispatch = createEventDispatcher<{ select: Folder }>();
  let contextMenu: ContextMenu;

  $: _folder = $folder;
  $: folderLabel = folder.specialFolder == SpecialFolder.Normal
    ? folder.name
    : specialFolderNames[folder.specialFolder] ?? folder.name;
  $: displayLabel = showAccountLabel && accountLabel
    ? `${folderLabel} — ${accountLabel}`
    : folderLabel;
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

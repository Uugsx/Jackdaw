{#if favoriteEntries.length || quickFolders.length}
  <nav class="quick-access" aria-label={$t`Favorites`}>
    {#each favoriteEntries as { ref, folder } (ref.accountId + ":" + ref.folderId)}
      {#if folder}
        <QuickAccessFolder
          {folder}
          selected={selectedFolder === folder}
          showAccountLabel={true}
          removableFromFavorites={true}
          accountLabel={folder.account?.name}
          on:select={onSelectFolder} />
      {:else}
        <span class="quick-folder pending" title={ref.folderPath}>{favoriteRefLabel(ref, accounts)}</span>
      {/if}
    {/each}
    {#each defaultQuickFolders as folder (folder.id || folder.specialFolder || folder.fullPath)}
      {#if !isUserFavorite(folder, favoriteRefs)}
        <QuickAccessFolder
          {folder}
          selected={selectedFolder === folder}
          showAccountLabel={false}
          removableFromFavorites={false}
          accountLabel={folder.account?.name}
          on:select={onSelectFolder} />
      {/if}
    {/each}
  </nav>
{/if}

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import type { Folder } from "../../../logic/Mail/Folder";
  import QuickAccessFolder from "./QuickAccessFolder.svelte";
  import { createEventDispatcher } from "svelte";
  import { t } from "../../../l10n/l10n";
  import type { Collection } from "svelte-collections";
  import {
    favoriteFoldersSetting,
    favoriteFoldersEpoch,
    findFavoriteFolder,
    favoriteRefLabel,
    isFavoriteFolderRef,
    type FavoriteFolderRef,
  } from "./favoriteFolders";
  import { getDefaultQuickAccessFolders } from "./quickAccessUtils";

  export let accounts: Collection<MailAccount>;
  export let account: MailAccount;
  export let selectedFolder: Folder;

  const dispatch = createEventDispatcher<{ select: Folder }>();
  let favoriteEntries: Array<{ ref: FavoriteFolderRef; folder: Folder | null }> = [];

  $: favoriteRefs = $favoriteFoldersSetting.value ?? [];
  $: {
    $accounts;
    $favoriteFoldersEpoch;
    favoriteEntries = favoriteRefs.map(ref => ({
      ref,
      folder: findFavoriteFolder(accounts, ref),
    }));
  }
  $: userFavorites = favoriteEntries.map(entry => entry.folder).filter((f): f is Folder => !!f);
  $: defaultQuickFolders = getDefaultQuickAccessFolders(account);
  $: quickFolders = [...userFavorites, ...defaultQuickFolders.filter(f => !isUserFavorite(f, favoriteRefs))];

  function isUserFavorite(folder: Folder, refs: FavoriteFolderRef[]): boolean {
    return isFavoriteFolderRef(folder, refs);
  }

  function onSelectFolder(event: CustomEvent<Folder>) {
    selectedFolder = event.detail;
    dispatch("select", event.detail);
  }
</script>

<style>
  .quick-access {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 0 0 auto;
    padding: 2px 8px 8px;
  }
  .quick-folder.pending {
    display: block;
    padding: 5px 8px 5px 30px;
    font-size: 12px;
    color: color-mix(in srgb, var(--leftbar-fg) 55%, transparent);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

{#if quickFolders.length}
  <nav class="quick-access" aria-label={$t`Favorites`}>
    {#each quickFolders as folder (folder.id || folder.specialFolder || folder.fullPath)}
      <QuickAccessFolder
        {folder}
        selected={selectedFolder === folder}
        showAccountLabel={isUserFavorite(folder, favoriteRefs)}
        removableFromFavorites={isUserFavorite(folder, favoriteRefs)}
        accountLabel={folder.account?.name}
        on:select={onSelectFolder} />
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
    isFavoriteFolderRef,
    resolveFavoriteFolders,
    type FavoriteFolderRef,
  } from "./favoriteFolders";
  import { folderQuickAccessKey, getDefaultQuickAccessFolders } from "./quickAccessUtils";

  export let accounts: Collection<MailAccount>;
  export let account: MailAccount;
  export let selectedFolder: Folder;

  const dispatch = createEventDispatcher<{ select: Folder }>();

  /** Recompute when the account finishes loading its folder hierarchy. */
  $: _account = $account;
  $: _accounts = accounts;
  $: favoriteRefs = $favoriteFoldersSetting.value ?? [];
  $: userFavorites = resolveFavoriteFolders(accounts, favoriteRefs);
  $: defaultQuick = getDefaultQuickAccessFolders(account);
  $: quickFolders = mergeQuickAccessFolders(userFavorites, defaultQuick);

  function mergeQuickAccessFolders(favorites: Folder[], defaults: Folder[]): Folder[] {
    let seen = new Set<string>();
    let merged: Folder[] = [];
    for (let folder of favorites) {
      let key = folderQuickAccessKey(folder);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(folder);
    }
    for (let folder of defaults) {
      let key = folderQuickAccessKey(folder);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(folder);
    }
    return merged;
  }

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
</style>

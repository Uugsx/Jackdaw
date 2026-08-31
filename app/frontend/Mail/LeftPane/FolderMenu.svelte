<MenuItem
  onClick={getNewMessages}
  label={$t`Get mail`}
  icon={DownloadIcon} />
<MenuItem
  onClick={downloadAll}
  label={$t`Download all messages`}
  icon={DownloadAllIcon} />
<hbox class="menuitem markasread">
  <MenuItem
    onClick={markAllRead}
    label={$t`Mark all messages as read`}
    iconSize="12px"
    icon={CircleIcon} />
</hbox>
<hbox class="menuitem markasread">
  <MenuItem
    onClick={markAllUnread}
    label={$t`Mark all messages as unread`}
    iconSize="12px"
    icon={CircleDotIcon} />
</hbox>
{#if folder.specialFolder == SpecialFolder.Trash || folder.specialFolder == SpecialFolder.Spam}
  <MenuItem
    onClick={clearFolder}
    label={$t`Delete all messages`}
    classes="danger"
    icon={DeleteIcon} />
{:else if folder.specialFolder != SpecialFolder.Drafts && folder.specialFolder != SpecialFolder.Outbox}
  <MenuItem
    onClick={clearFolder}
    label={$t`Clear folder`}
    classes="danger"
    icon={TrashIcon} />
{/if}
{#if !folder.disableSubfolders()}
  <MenuDivider />
  <MenuItem
    onClick={requestCreateFolder}
    label={$t`New Folder`}
    icon={NewFolderIcon} />
{/if}
{#if !folder.disableRename()}
  <MenuItem
    onClick={requestRenameFolder}
    label={$t`Rename folder`}
    icon={RenameIcon} />
{/if}
{#if !folder.disableDelete()}
  <MenuItem
    onClick={deleteFolder}
    label={$t`Delete folder`}
    classes="danger"
    icon={DeleteIcon} />
{/if}
{#if folder.specialFolder == SpecialFolder.Normal && folder.id}
  <MenuDivider />
  <MenuItem
    onClick={() => moveSibling("up")}
    label={$t`Move up`}
    icon={MoveUpIcon}
    disabled={!folder.canMoveSibling("up")} />
  <MenuItem
    onClick={() => moveSibling("down")}
    label={$t`Move down`}
    icon={MoveDownIcon}
    disabled={!folder.canMoveSibling("down")} />
{/if}
<MenuDivider />
<MenuItem
  onClick={() => toggleFavoriteFolder(folder)}
  label={isFavorite ? $t`Remove from favorites` : $t`Show in favorites`}
  icon={StarIcon} />
<MenuItem
  onClick={openFolderSettings}
  label={$t`Folder properties`}
  icon={FolderSettingsIcon} />
<!--
<MenuDivider />
<MenuLabel>
  <grid class="msg-counts">
    <hbox class="count">{$folder.countNewArrived}</hbox>
    <hbox>{$t`new`}</hbox>
    <hbox class="count">{$folder.countUnread}</hbox>
    <hbox>{$t`unread`}</hbox>
    <hbox class="count">{$folder.countTotal}</hbox>
    <hbox>{$t`total`}</hbox>
  </grid>
</MenuLabel>
-->

<script lang="ts">
  import { type Folder, SpecialFolder } from "../../../logic/Mail/Folder";
  import { selectedFolder } from "../Selected";
  import MenuItem from "../../Shared/Menu/MenuItem.svelte";
  import MenuLabel from "../../Shared/Menu/MenuLabel.svelte";
  import MenuDivider from "../../Shared/Menu/MenuDivider.svelte";
  import { openFolderProperties } from '../FolderPropertiesPage.svelte';
  import DownloadIcon from "lucide-svelte/icons/download";
  import DownloadAllIcon from "lucide-svelte/icons/hard-drive-download";
  import CircleIcon from "lucide-svelte/icons/circle";
  import CircleDotIcon from "lucide-svelte/icons/circle-dot";
  import DeleteIcon from "lucide-svelte/icons/trash-2";
  import TrashIcon from "lucide-svelte/icons/trash";
  import NewFolderIcon from "lucide-svelte/icons/folder-plus";
  import RenameIcon from "lucide-svelte/icons/pencil";
  import FolderSettingsIcon from "lucide-svelte/icons/folder-cog";
  import MoveUpIcon from "lucide-svelte/icons/arrow-up";
  import MoveDownIcon from "lucide-svelte/icons/arrow-down";
  import StarIcon from "lucide-svelte/icons/star";
  import { createEventDispatcher, getContext } from "svelte";
  import { t, gt } from "../../../l10n/l10n";
  import {
    favoriteFoldersSetting,
    isFavoriteFolderRef,
    toggleFavoriteFolder,
  } from "./favoriteFolders";

  export let folder: Folder;
  const dispatch = createEventDispatcher<{
    requestCreateFolder: void;
    requestRenameFolder: void;
  }>();
  let treeRefresh = getContext("treeRefresh") as (() => void) | undefined;

  $: favoriteRefs = $favoriteFoldersSetting.value ?? [];
  $: isFavorite = isFavoriteFolderRef(folder, favoriteRefs);

  async function getNewMessages() {
    let account = folder.account;
    if (!account.isLoggedIn) {
      await account.login(true);
    }
    await folder.fetchNewMailQuick();
  }

  async function downloadAll() {
    await folder.listMessages();
    await folder.downloadAllMessages();
  }

  async function markAllRead() {
    await folder.markAllRead();
  }

  async function markAllUnread() {
    await folder.markAllUnread();
  }

  async function clearFolder() {
    if (!confirm(clearFolderConfirmText(folder))) {
      return;
    }
    await folder.clearFolder();
  }

  function clearFolderConfirmText(folder: Folder): string {
    if (folder.specialFolder == SpecialFolder.Trash || folder.specialFolder == SpecialFolder.Spam) {
      return gt`Permanently delete all messages in “${folder.name}”? This cannot be undone.`;
    }
    return gt`Move all messages in “${folder.name}” to Trash?`;
  }

  function requestCreateFolder() {
    dispatch("requestCreateFolder");
  }

  function requestRenameFolder() {
    dispatch("requestRenameFolder");
  }

  async function moveSibling(direction: "up" | "down") {
    await folder.moveSibling(direction);
    treeRefresh?.();
  }

  async function deleteFolder() {
    if (!confirm(gt`Delete folder “${folder.name}” and all messages in it? This cannot be undone.`)) {
      return;
    }
    let next = folder.parent ?? folder.account.inbox;
    await folder.deleteIt();
    if ($selectedFolder == folder) {
      $selectedFolder = next;
    }
  }

  function openFolderSettings() {
    $selectedFolder = folder;
    $openFolderProperties = true;
  }
</script>

<style>
  /* .msg-counts {
    opacity: 50%;
    grid-template-columns: max-content max-content;
    column-gap: 8px;
  }
  .count {
    justify-self: end;
  }*/
  .menuitem.markasread :global(.icon) {
    margin-inline-start: 2px;
    margin-inline-end: 2px;
  }
</style>

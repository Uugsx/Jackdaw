<!-- Appears above the msg list; height matches the account row so lists line up -->
<hbox class="folder-header font-small">
  {#if searchMessages}
    <hbox class="folder-name">{$t`Search results`}</hbox>
  {:else if folder}
    <hbox class="folder-name" title={folder.name}>{folder.name}</hbox>
  {/if}
  <hbox flex />
  {#if account && !$account.isLoggedIn}
    <Button plain
      label={$t`Login`}
      icon={DisconnectedIcon}
      onClick={login}
      iconSize="16px" />
  {:else if folder}
    <FolderMsgCount {folder} {searchMessages} />
  {/if}
</hbox>

<script lang="ts">
  import type { Folder } from '../../../logic/Mail/Folder';
  import type { EMail } from '../../../logic/Mail/EMail';
  import FolderMsgCount from './FolderMsgCount.svelte';
  import Button from '../../Shared/Button.svelte';
  import DisconnectedIcon from "lucide-svelte/icons/unplug";
  import { t } from '../../../l10n/l10n';
  import type { ArrayColl } from 'svelte-collections';

  export let folder: Folder;
  export let searchMessages: ArrayColl<EMail> | null; /** in */

  $: account = folder?.account;

  async function login() {
    await account.login(true);
  }
</script>

<style>
  .folder-header {
    align-items: center;
    min-height: 40px;
    padding-block: 8px;
    padding-inline: 14px;
    box-sizing: border-box;
    color: var(--main-fg);
    background-color: var(--main-bg);
    border-block-end: 1px solid var(--border);
  }
  .folder-header :global(button) {
    margin-inline-end: 8px;
  }
  .folder-name {
    font-weight: 600;
    letter-spacing: -0.01em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

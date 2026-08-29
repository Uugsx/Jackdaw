<vbox class="account-group">
  <AccountListItem
    {account}
    {selected}
    accountActive={folderSelected}
    {expanded}
    on:select={forwardSelect}
    on:toggleExpand={forwardToggleExpand}
    />
  {#if expanded}
    <vbox class="folders">
      <FolderList
        folders={account.rootFolders}
        embedded
        selectedFolder={selectedFolder}
        selectedFolders={selectedFolders}
        on:selectFolder={onSelectFolder}
        >
        <svelte:fragment slot="buttons" let:folder>
          <slot name="folder-buttons" {folder} />
        </svelte:fragment>
      </FolderList>
    </vbox>
  {/if}
</vbox>

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import type { Folder } from "../../../logic/Mail/Folder";
  import AccountListItem from "./AccountListItem.svelte";
  import FolderList from "./FolderList.svelte";
  import { ArrayColl } from "svelte-collections";
  import { createEventDispatcher } from "svelte";

  export let account: MailAccount;
  export let selected = false;
  export let folderSelected = false;
  export let expanded = false;
  export let selectedFolder: Folder;
  let selectedFolders = new ArrayColl<Folder>();

  const dispatch = createEventDispatcher<{ select: MailAccount; toggleExpand: MailAccount; selectFolder: Folder }>();

  function forwardSelect(event: CustomEvent<MailAccount>) {
    dispatch("select", event.detail);
  }

  function forwardToggleExpand(event: CustomEvent<MailAccount>) {
    dispatch("toggleExpand", event.detail);
  }

  function onSelectFolder(event: CustomEvent<Folder>) {
    dispatch("selectFolder", event.detail);
  }
</script>

<style>
  .account-group {
    flex: 0 0 auto;
  }
  .folders {
    padding-block-end: 4px;
  }
</style>

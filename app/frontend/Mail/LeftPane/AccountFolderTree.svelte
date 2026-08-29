<vbox class="account-folder-tree" flex>
  <hbox class="header">
    <hbox class="header-label font-smallest">{$t`Accounts`}</hbox>
    <hbox flex />
    <slot name="top-right" />
  </hbox>
  <vbox class="scroll" flex>
    {#each $accounts.each as account, index (account.id)}
      {#if index > 0}
        <hr class="account-separator" aria-hidden="true" />
      {/if}
      <AccountFolderGroup
        {account}
        selected={selectedAccount === account}
        folderSelected={selectedFolder?.account === account && !!selectedFolder}
        expanded={!!$expandedAccountsStore[account.id]}
        selectedFolder={selectedFolder}
        on:select={onSelectAccount}
        on:toggleExpand={onToggleExpand}
        on:selectFolder={onSelectFolder}
        >
        <svelte:fragment slot="folder-buttons" let:folder>
          <slot name="folder-buttons" {folder} />
        </svelte:fragment>
      </AccountFolderGroup>
    {/each}
  </vbox>
</vbox>

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import type { Folder } from "../../../logic/Mail/Folder";
  import AccountFolderGroup from "./AccountFolderGroup.svelte";
  import type { Collection, ArrayColl } from "svelte-collections";
  import { t } from "../../../l10n/l10n";
  import { expandedAccountsStore, ensureAccountExpanded, setAccountExpanded, toggleAccountExpanded } from "../mailSidebarState";

  export let accounts: Collection<MailAccount>;
  export let selectedAccount: MailAccount;
  export let selectedFolder: Folder;
  export let selectedFolders: ArrayColl<Folder>;

  function onSelectAccount(event: CustomEvent<MailAccount>) {
    selectedAccount = event.detail;
    setAccountExpanded(event.detail, true);
    let inbox = event.detail.inbox;
    if (inbox) {
      selectedFolder = inbox;
    }
  }

  function onToggleExpand(event: CustomEvent<MailAccount>) {
    let account = event.detail;
    toggleAccountExpanded(account);
  }

  function onSelectFolder(event: CustomEvent<Folder>) {
    let folder = event.detail;
    selectedFolder = folder;
    if (folder?.account) {
      selectedAccount = folder.account;
      ensureAccountExpanded(folder.account);
    }
  }

  $: if (selectedAccount) {
    ensureAccountExpanded(selectedAccount);
  }
</script>

<style>
  .account-folder-tree {
    min-height: 0;
    overflow: hidden;
  }
  .scroll {
    overflow-y: auto;
    min-height: 0;
    flex: 1 0 0;
  }
  .header {
    display: none;
  }
  .account-separator {
    border: none;
    border-block-start: 1px solid var(--border);
    margin: 4px 12px;
    opacity: 0.85;
  }
</style>

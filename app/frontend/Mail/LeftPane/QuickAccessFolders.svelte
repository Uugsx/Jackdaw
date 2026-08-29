{#if quickFolders.length}
  <nav class="quick-access" aria-label={$t`Quick access`}>
    {#each quickFolders as folder (folder.id || folder.specialFolder || folder.fullPath)}
      <QuickAccessFolder
        {folder}
        selected={selectedFolder === folder}
        on:select={onSelectFolder} />
    {/each}
  </nav>
{/if}

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import type { Folder } from "../../../logic/Mail/Folder";
  import { SpecialFolder } from "../../../logic/Mail/Folder";
  import QuickAccessFolder from "./QuickAccessFolder.svelte";
  import { createEventDispatcher } from "svelte";
  import { t } from "../../../l10n/l10n";

  export let account: MailAccount;
  export let selectedFolder: Folder;

  const dispatch = createEventDispatcher<{ select: Folder }>();
  const preferredSpecialFolders = [
    SpecialFolder.Inbox,
    SpecialFolder.Sent,
    SpecialFolder.Drafts,
    SpecialFolder.All,
    SpecialFolder.Spam,
    SpecialFolder.Trash,
    SpecialFolder.Archive,
  ];

  /**
   * Saved OWA hierarchies can contain the right folders without retaining the
   * special-use marker. Prefer the marker, then use the stable system-folder
   * names as a fallback so quick access never becomes an empty heading.
   */
  const fallbackNames: Partial<Record<SpecialFolder, string[]>> = {
    [SpecialFolder.Inbox]: ["inbox", "входящие"],
    [SpecialFolder.Sent]: ["sent", "sent items", "отправленные"],
    [SpecialFolder.Drafts]: ["drafts", "черновики"],
    [SpecialFolder.All]: ["all mail", "all messages", "все сообщения"],
    [SpecialFolder.Spam]: ["spam", "junk", "нежелательная почта", "спам"],
    [SpecialFolder.Trash]: ["trash", "deleted items", "удаленные", "корзина"],
    [SpecialFolder.Archive]: ["archive", "архив"],
  };

  function normalizeFolderName(name: string): string {
    return name.trim().toLocaleLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
  }

  function findFolder(account: MailAccount, specialFolder: SpecialFolder): Folder | null {
    let marked = account.findSpecialFolder(specialFolder);
    if (marked) {
      return marked;
    }
    let names = fallbackNames[specialFolder] ?? [];
    return account.getAllFolders().find(folder => names.includes(normalizeFolderName(folder.name))) ?? null;
  }

  /** Recompute when the account finishes loading its folder hierarchy. */
  $: _account = $account;
  $: quickFolders = preferredSpecialFolders
    .map(specialFolder => findFolder(account, specialFolder))
    .filter((folder): folder is Folder => !!folder)
    .filter((folder, index, folders) => folders.indexOf(folder) == index);

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

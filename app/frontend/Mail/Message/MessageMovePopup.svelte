<vbox class="message-popup">
  <hbox class="top buttons">
    <Button plain
      label={$t`Delete`}
      onClick={onDelete}
      icon={DeleteIcon}
      />
    {#if messages.first?.folder?.specialFolder == SpecialFolder.Trash || messages.first?.folder?.specialFolder == SpecialFolder.Spam}
      <Button plain
        label={$t`Restore`}
        tooltip={$t`Move this message back to the Inbox`}
        onClick={onRestore}
        icon={UndoIcon}
        />
    {/if}
    <Button plain
      label={$messages.first.isSpam ? $t`Not spam` : $t`Spam`}
      tooltip={$messages.first.isSpam ? $t`Treat this email as *not* spam` : $t`Treat this email as spam: Move it to the Spam folder, and train the spam filter`}
      onClick={toggleSpam}
      icon={$messages.first.isSpam ? NotSpamIcon : SpamIcon}
      />
    <Button plain
      label={$t`Archive`}
      tooltip={$t`Move this email to the archive folder`}
      onClick={onArchive}
      icon={ArchiveIcon}
      iconOnly
      />
    <slot name="buttons" {messages} />
    <Button plain
      label={$t`Close`}
      onClick={onClose}
      iconOnly
      icon={CloseIcon}
      />
  </hbox>
  {#if !showAccounts}
    <vbox class="tags">
      <hbox class="header font-smallest">{$t`Categories`}</hbox>
      {#if usableTagCombinations($tagCombinations.contents).length}
        <hbox class="combination-list">
          {#each usableTagCombinations($tagCombinations.contents) as combination (combination.id)}
            <button
              type="button"
              class="combination-btn"
              title={$t`Apply category combination`}
              on:click={() => catchErrors(() => applyCombinationAll(combination))}
              >
              <span class="combination-name">{combination.name}</span>
              <hbox class="combo-dots">
                {#each resolveCombinationTags(combination) as tag (tag.name)}
                  <span class="tag-dot" style="--tag-color: {tag.color}" />
                {/each}
              </hbox>
            </button>
          {/each}
        </hbox>
      {/if}
      <hbox class="tag-list">
        {#each sortedTagList($availableTags.contents) as tag (tag.name)}
          <TagBubble {tag}
            selected={checkedTags.has(tag.name)}
            on:click={() => catchErrors(() => toggleTagAll(tag))} />
        {/each}
      </hbox>
    </vbox>
  {/if}
  {#if showAccounts}
    <vbox class="accounts">
      <AccountList accounts={appGlobal.emailAccounts} bind:selectedAccount />
    </vbox>
  {/if}
  <vbox class="folders">
    <FolderList folders={selectedAccount.rootFolders} bind:selectedFolder bind:selectedFolders>
      <svelte:fragment slot="buttons" let:folder>
        {#if folder != sourceFolder}
          <Button plain
            label={$t`Copy`}
            tooltip={$t`Copy this email to folder ${folder.name}`}
            onClick={() => onCopyTo(folder)}
            icon={CopyIcon}
            iconOnly
            />
          <Button plain
            label={$t`Move`}
            tooltip={$t`Move this email to folder ${folder.name}`}
            onClick={() => onMoveTo(folder)}
            icon={MoveIcon}
            />
        {/if}
      </svelte:fragment>
      <svelte:fragment slot="header">
        <hbox class="folders-header" flex>
          {$t`Folder`}
          <hbox flex />
          <Button
            label={$t`Move to other mail account`}
            icon={AccountsIcon}
            iconOnly
            plain
            selected={showAccounts}
            onClick={() => showAccounts = !showAccounts}
           />
        </hbox>
      </svelte:fragment>
    </FolderList>
  </vbox>
</vbox>

<script lang="ts">
  import type { EMail } from "../../../logic/Mail/EMail";
  import { SpecialFolder, type Folder } from "../../../logic/Mail/Folder";
  import { selectedMessage, selectedMessages } from "../Selected";
  import { openEMailMessage } from "../open";
  import { availableTags, sortedTagList, type Tag } from "../../../logic/Abstract/Tag";
  import {
    applyTagCombinationToEmails,
    resolveCombinationTags,
    sortedTagCombinations,
    tagCombinations,
    usableTagCombinations,
    type TagCombination,
  } from "../../../logic/Abstract/TagCombination";
  import { appGlobal } from "../../../logic/app";
  import TagBubble from "../../Shared/Tag/TagBubble.svelte";
  import AccountList from "../LeftPane/AccountList.svelte";
  import FolderList from "../LeftPane/FolderList.svelte";
  import Button from "../../Shared/Button.svelte";
  import DeleteIcon from "lucide-svelte/icons/trash-2";
  import UndoIcon from "lucide-svelte/icons/undo-2";
  import SpamIcon from "lucide-svelte/icons/shield-x";
  import NotSpamIcon from "lucide-svelte/icons/shield-off";
  import ArchiveIcon from "lucide-svelte/icons/archive";
  import MoveIcon from "lucide-svelte/icons/folder-input";
  import CopyIcon from "lucide-svelte/icons/mails";
  import AccountsIcon from "lucide-svelte/icons/share";
  import CloseIcon from "lucide-svelte/icons/x";
  import { ArrayColl, Collection } from "svelte-collections";
  import { catchErrors } from "../../Util/error";
  import { t } from "../../../l10n/l10n";
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher<{ close: void }>();

  /** Attention
   * Always pass in a copy of the array, not the live `selectedMessages` array from the UI.
   * If the user deletes or moves messages, they will be removed from the UI
   * instantly, which changes the current selection, so the wrong emails get deleted. */
  export let messages: Collection<EMail>;

  let sourceFolder = messages.first.folder;
  let selectedFolder = sourceFolder;
  let selectedFolders = new ArrayColl<Folder>();
  let selectedAccount = sourceFolder.account;
  let selectedMessageIndex = sourceFolder.messages.getKeyForValue(messages.first);
  let wasSelected = $selectedMessage == messages.first; // just safety measure
  let showAccounts = false;
  let tagsEpoch = 0;

  function onClose() {
    dispatch("close");
  }

  /* A bare `tagsEpoch;` inside a function body is not a template dependency -
   * the compiler has to see it in a `$:` statement. */
  $: checkedTags = collectCheckedTags(tagsEpoch, $availableTags);

  function collectCheckedTags(_epoch: number, tags: Collection<Tag>): Set<string> {
    return new Set(tags.contents.filter(tag => majorityHasTag(tag)).map(tag => tag.name));
  }

  function majorityHasTag(tag: Tag): boolean {
    let list = messages.contents;
    if (!list.length) {
      return false;
    }
    return list.filter(m => m.tags.contains(tag)).length / list.length > 0.5;
  }

  async function applyCombinationAll(combination: TagCombination) {
    await applyTagCombinationToEmails(messages.contents, combination);
    tagsEpoch++;
  }

  async function toggleTagAll(tag: Tag) {
    let remove = majorityHasTag(tag);
    for (let message of messages) {
      if (remove) {
        if (message.tags.contains(tag)) {
          await message.removeTag(tag);
        }
      } else if (!message.tags.contains(tag)) {
        await message.addTag(tag);
      }
    }
    tagsEpoch++;
  }

  async function onDelete() {
    onClose();
    for (let message of messages) {
      await message.deleteMessage();
    }
    goToNextMessage();
  }
  async function onRestore() {
    onClose();
    let last: EMail | null = null;
    for (let message of messages) {
      await message.restoreFromTrash();
      last = message;
    }
    if (last) {
      await openEMailMessage(last);
    }
  }
  async function toggleSpam() {
    let spam = !messages.first.isSpam;
    onClose();
    for (let message of messages) {
      await message.treatSpam(spam);
    }
    goToNextMessage();
  }

  async function onArchive() {
    onClose();
    for (let message of messages) {
      await message.moveToArchive();
    }
    goToNextMessage();
  }
  async function onMoveTo(folder: Folder) {
    onClose();
    await folder.moveMessagesHere(messages);
    goToNextMessage();
  }
  async function onCopyTo(folder: Folder) {
    onClose();
    await folder.copyMessagesHere(messages);
  }

  function goToNextMessage() {
    if (!wasSelected) {
      return;
    }
    $selectedMessage =
      sourceFolder.messages.getIndex(selectedMessageIndex) ??
      sourceFolder.messages.first ??
      sourceFolder.account.inbox.messages.first ??
      null;
    $selectedMessages.replaceAll($selectedMessage ? [$selectedMessage] : []);
  }
</script>

<style>
  .message-popup {
    background-color: var(--leftbar-bg);
    color: var(--leftbar-fg);
  }
  .message-popup :global(.header) {
    display: flex !important;
    height: unset !important;
  }
  .header {
    color: grey;
  }
  .header,
  .message-popup :global(grid > .header) {
    margin-block-start: 0px;
    margin-block-end: 4px;
  }
  .tags {
    margin: 10px;
    max-width: 300px;
  }
  .tag-list {
    flex-wrap: wrap;
    gap: 4px;
  }
  .combination-list {
    flex-wrap: wrap;
    gap: 6px;
    margin-block-end: 8px;
  }
  .combination-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--main-bg);
    color: var(--main-fg);
    cursor: pointer;
  }
  .combination-btn:hover,
  .combination-btn:focus-visible {
    background: color-mix(in srgb, var(--fg) 8%, transparent);
    outline: none;
  }
  .combination-name {
    font-size: 0.85em;
    max-width: 10em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .combo-dots {
    gap: 3px;
    align-items: center;
  }
  .tag-dot {
    width: 8px;
    height: 8px;
    border-radius: 1000px;
    background-color: var(--tag-color);
    flex-shrink: 0;
  }
  .accounts {
    height: 10em;
  }
  .accounts :global(.account-list) {
    flex: 1;
  }
  .folders {
    height: 22em;
  }
  .buttons {
    border-top: 1px solid var(--border);
  }
  .buttons > :global(button:not(:first-child)) {
    border-left: 1px solid var(--border);
  }
  .buttons > :global(button) {
    padding: 8px 16px;
    border-radius: 0px;
  }
  /* TODO fix colors on hover
  .buttons > :global(.selected button:hover:not(.disabled)) {
    background-color: unset;
    color: green;
  }*/
</style>

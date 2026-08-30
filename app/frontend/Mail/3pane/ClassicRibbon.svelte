<!-- Outlook-style Home ribbon — classic 3-pane layout only -->
<hbox class="classic-ribbon font-smallest">
  {#if showNew}
    <vbox class="group new-group">
      <button type="button" class="ribbon-btn primary" disabled={!account}
        title={$t`Write new email`}
        on:click={() => catchErrors(newMail)}>
        <MailPlusIcon size="22px" />
        <span>{$t`New email`}</span>
      </button>
    </vbox>

    <hbox class="divider" aria-hidden="true" />
  {/if}

  <vbox class="group">
    {#if folder?.specialFolder == SpecialFolder.Trash || folder?.specialFolder == SpecialFolder.Spam}
      <button type="button" class="ribbon-btn primary" disabled={!hasSelection}
        title={$t`Restore`}
        on:click={() => catchErrors(restoreSelected)}>
        <UndoIcon size="20px" />
        <span>{$t`Restore`}</span>
      </button>
    {/if}
    <button type="button" class="ribbon-btn danger" disabled={!hasSelection}
      title={$t`Delete`}
      on:click={() => catchErrors(deleteSelected)}>
      <TrashIcon size="20px" />
      <span>{$t`Delete`}</span>
    </button>
  </vbox>

  <hbox class="divider" aria-hidden="true" />

  <vbox class="group row">
    <button type="button" class="ribbon-btn" disabled={!message}
      title={$t`Reply to author`}
      on:click={() => catchErrors(reply)}>
      <ReplyIcon size="20px" />
      <span>{$t`Reply`}</span>
    </button>
    <button type="button" class="ribbon-btn" disabled={!canReplyAll}
      title={$t`Reply to all`}
      on:click={() => catchErrors(replyAll)}>
      <ReplyAllIcon size="20px" />
      <span>{$t`Reply all`}</span>
    </button>
    <button type="button" class="ribbon-btn" disabled={!message}
      title={$t`Forward`}
      on:click={() => catchErrors(forward)}>
      <ForwardIcon size="20px" />
      <span>{$t`Forward`}</span>
    </button>
  </vbox>

  <hbox class="divider" aria-hidden="true" />

  <vbox class="group row">
    <button type="button" class="ribbon-btn" disabled={!hasSelection}
      bind:this={moveAnchor}
      title={$t`Move`}
      on:click|stopPropagation={() => catchErrors(toggleMove)}>
      <FolderInputIcon size="20px" />
      <span>{$t`Move`}</span>
    </button>
    <button type="button" class="ribbon-btn" disabled={!hasSelection}
      title={$t`Archive`}
      on:click={() => catchErrors(archiveSelected)}>
      <ArchiveIcon size="20px" />
      <span>{$t`Archive`}</span>
    </button>
    <button type="button" class="ribbon-btn" disabled={!hasSelection}
      title={messageSpam ? $t`Mark as not spam` : $t`Mark as spam`}
      on:click={() => catchErrors(toggleSpam)}>
      <svelte:component this={messageSpam ? NotSpamIcon : SpamIcon} size="20px" />
      <span>{messageSpam ? $t`Not spam` : $t`Junk`}</span>
    </button>
  </vbox>

  <hbox class="divider" aria-hidden="true" />

  <vbox class="group row">
    <button type="button" class="ribbon-btn" disabled={!hasSelection}
      title={messageRead ? $t`Mark as unread` : $t`Mark as read`}
      on:click={() => catchErrors(toggleRead)}>
      <MailIcon size="20px" />
      <span>{messageRead ? $t`Unread` : $t`Mark as read`}</span>
    </button>
    <button type="button" class="ribbon-btn" class:on={messageStarred} disabled={!hasSelection}
      title={$t`Flagged`}
      on:click={() => catchErrors(toggleStar)}>
      <FlagIcon size="20px" />
      <span>{$t`Flag`}</span>
    </button>
    <button type="button" class="ribbon-btn" class:on={messageImportant} disabled={!hasSelection}
      title={$t`Important`}
      on:click={() => catchErrors(toggleImportant)}>
      <ImportantIcon size="20px" />
      <span>{$t`Important`}</span>
    </button>
    {#if $availableTags.hasItems}
      <button type="button" class="ribbon-btn" disabled={!hasSelection}
        bind:this={catAnchor}
        title={$t`Set categories`}
        on:click|stopPropagation={onCategoriesClick}>
        <TagsIcon size="20px" />
        <span>{$t`Categories`}</span>
      </button>
      {#if catAnchor}
        <Menu bind:isMenuOpen={catMenuOpen} anchor={catAnchor} placement="bottom-start">
          <MenuItem
            onClick={clearTags}
            label={$t`Clear all`}
            disabled={!anySelectedHasTags}
            closeOnClick={false} />
          <MenuDivider />
          {#if usableTagCombinations($tagCombinations.contents).length}
            {#each usableTagCombinations($tagCombinations.contents) as combination (combination.id)}
              <MenuItem
                label={combination.name}
                onClick={() => applyCombination(combination)}
                closeOnClick={false}>
                <hbox slot="icon" class="combo-dots">
                  {#each resolveCombinationTags(combination) as tag (tag.name)}
                    <span class="tag-dot" style="--tag-color: {tag.color}" />
                  {/each}
                </hbox>
              </MenuItem>
            {/each}
            <MenuDivider />
          {/if}
          {#each sortedTagList($availableTags.contents) as tag (tag.name)}
            <MenuItem
              label={tag.name}
              selected={majorityHasTag(tag)}
              onClick={() => toggleTag(tag)}
              closeOnClick={false}>
              <hbox slot="icon" class="tag-dot" style="--tag-color: {tag.color}" />
            </MenuItem>
          {/each}
        </Menu>
      {/if}
    {/if}
  </vbox>

  <hbox class="divider" aria-hidden="true" />

  <vbox class="group">
      <ButtonMenu label={$t`More`}>
      {#if message}
        <MessageMenu {message} {printE} onMove={toggleMove} />
        <MenuDivider />
      {/if}
      <MenuItem
        onClick={getMail}
        label={$t`Get mail`}
        icon={RefreshIcon}
        disabled={!folder} />
    </ButtonMenu>
  </vbox>

</hbox>

<Print {message} bind:this={printE} />

{#if moveAnchor}
  <Popup bind:popupOpen={moveOpen} popupAnchor={moveAnchor} placement="bottom-start" boundaryElSel="body">
    {#if moveMessages.hasItems}
      <MessageMovePopup messages={moveMessages} on:close={() => moveOpen = false} />
    {/if}
  </Popup>
{/if}

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import { SpecialFolder, type Folder } from "../../../logic/Mail/Folder";
  import type { EMail } from "../../../logic/Mail/EMail";
  import { availableTags, sortedTagList, type Tag } from "../../../logic/Abstract/Tag";
  import {
    applyTagCombinationToEmails,
    resolveCombinationTags,
    sortedTagCombinations,
    tagCombinations,
    usableTagCombinations,
    type TagCombination,
  } from "../../../logic/Abstract/TagCombination";
  import { mailApp } from "../MailJackdawApp";
  import MessageMovePopup from "../Message/MessageMovePopup.svelte";
  import { openEMailMessage } from "../open";
  import Popup from "../../Shared/Popup.svelte";
  import Menu from "../../Shared/Menu/Menu.svelte";
  import MenuItem from "../../Shared/Menu/MenuItem.svelte";
  import MenuDivider from "../../Shared/Menu/MenuDivider.svelte";
  import ButtonMenu from "../../Shared/Menu/ButtonMenu.svelte";
  import MessageMenu from "../Message/MessageMenu.svelte";
  import Print from "../Message/MessagePrint.svelte";
  import MailPlusIcon from "lucide-svelte/icons/mail-plus";
  import TrashIcon from "lucide-svelte/icons/trash-2";
  import UndoIcon from "lucide-svelte/icons/undo-2";
  import ReplyIcon from "lucide-svelte/icons/reply";
  import ReplyAllIcon from "lucide-svelte/icons/reply-all";
  import ForwardIcon from "lucide-svelte/icons/forward";
  import FolderInputIcon from "lucide-svelte/icons/folder-input";
  import ArchiveIcon from "lucide-svelte/icons/archive";
  import SpamIcon from "lucide-svelte/icons/shield-x";
  import NotSpamIcon from "lucide-svelte/icons/shield-off";
  import MailIcon from "lucide-svelte/icons/mail";
  import FlagIcon from "lucide-svelte/icons/flag";
  import ImportantIcon from "lucide-svelte/icons/circle-alert";
  import TagsIcon from "lucide-svelte/icons/tags";
  import RefreshIcon from "lucide-svelte/icons/refresh-cw";
  import { ArrayColl } from "svelte-collections";
  import { catchErrors } from "../../Util/error";
  import { deleteMessagesFromUI } from "../mailDeleteUndo";
  import { assert } from "../../../logic/util/util";
  import { get } from "svelte/store";
  import { selectedMessages as selectedMessagesStore } from "../Selected";
  import { t, gt } from "../../../l10n/l10n";
  import { computeCanReplyAll, subscribeCanReplyAll } from "../canReplyAll";

  export let account: MailAccount;
  export let folder: Folder;
  export let message: EMail;
  export let selectedMessages: ArrayColl<EMail>;
  export let showNew = true;

  let printE: Print;

  // `get()` reads a store without subscribing, so it must not be the only way
  // a reactive statement sees the selection - the buttons would then keep a
  // stale enabled state after a selection change. It stays in the click
  // handlers below, where a point-in-time snapshot is what we want.
  $: hasSelection = !!(message || selectedMessages?.hasItems || $selectedMessagesStore?.hasItems);
  let replyAllRev = 0;
  let replyAllUnsub: (() => void) | null = null;
  $: {
    replyAllUnsub?.();
    replyAllUnsub = subscribeCanReplyAll(message, () => replyAllRev++);
  }
  $: canReplyAll = (replyAllRev, computeCanReplyAll(message));
  // Bump after mutations so labels refresh without $message store sub (null-safe)
  let flagsEpoch = 0;
  $: messageSpam = flagsEpoch >= 0 && message?.isSpam;
  $: messageRead = flagsEpoch >= 0 && message?.isRead;
  $: messageStarred = flagsEpoch >= 0 && message?.isStarred;
  $: messageImportant = flagsEpoch >= 0 && message?.isImportant;
  $: anySelectedHasTags = flagsEpoch >= 0 && !!(
    ($selectedMessagesStore?.contents?.some(m => m.tags?.hasItems)) ||
    message?.tags?.hasItems
  );

  let moveAnchor: HTMLElement;
  let moveOpen = false;
  let moveMessages = new ArrayColl<EMail>();
  let catAnchor: HTMLElement;
  let catMenuOpen = false;

  function newMail() {
    assert(account, gt`Please select a mail account first`);
    mailApp.writeMail(account.newEMailFrom());
  }

  /**
   * Snapshot at click time from the shared store (same ArrayColl FastList mutates).
   */
  function selectionSnapshot(): ArrayColl<EMail> {
    let selected = get(selectedMessagesStore) ?? selectedMessages;
    if (selected?.hasItems) {
      return new ArrayColl(selected.contents.slice());
    }
    if (message) {
      return new ArrayColl([message]);
    }
    return new ArrayColl<EMail>();
  }

  async function forEachSelected(fn: (m: EMail) => Promise<void>) {
    for (let m of selectionSnapshot().contents) {
      await fn(m);
    }
  }

  async function deleteSelected() {
    await deleteMessagesFromUI(selectionSnapshot().contents);
  }

  async function restoreSelected() {
    let list = selectionSnapshot().contents;
    let last: EMail | null = null;
    for (let m of list) {
      await m.restoreFromTrash();
      last = m;
    }
    if (last) {
      await openEMailMessage(last);
    }
  }

  async function archiveSelected() {
    await forEachSelected(m => m.moveToArchive());
  }

  async function reply() {
    await message.loadForDisplay();
    mailApp.writeMail(message.compose.replyToAuthor());
  }

  async function replyAll() {
    await message.loadForDisplay();
    mailApp.writeMail(message.compose.replyAll());
  }

  async function forward() {
    await message.loadForDisplay();
    let setting = (await import("../../Util/LocalStorage")).getLocalStorage("mail.send.forward", "inline").value;
    let fwd = setting == "attachment"
      ? await message.compose.forwardAsAttachment()
      : await message.compose.forwardInline();
    mailApp.writeMail(fwd);
  }

  function toggleMove() {
    moveMessages = selectionSnapshot();
    setTimeout(() => { moveOpen = !moveOpen; }, 0);
  }

  async function toggleSpam() {
    let list = selectionSnapshot().contents;
    let toSpam = !list[0]?.isSpam;
    for (let m of list) {
      await m.treatSpam(toSpam);
    }
    flagsEpoch++;
  }

  async function toggleRead() {
    let list = selectionSnapshot().contents;
    let toRead = !list[0]?.isRead;
    for (let m of list) {
      await m.markRead(toRead);
    }
    flagsEpoch++;
  }

  async function toggleStar() {
    let list = selectionSnapshot().contents;
    let toStar = !list[0]?.isStarred;
    for (let m of list) {
      await m.markStarred(toStar);
    }
    flagsEpoch++;
  }

  async function toggleImportant() {
    let list = selectionSnapshot().contents;
    let toImportant = !list[0]?.isImportant;
    for (let m of list) {
      await m.markImportant(toImportant);
    }
    flagsEpoch++;
  }

  function onCategoriesClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setTimeout(() => { catMenuOpen = !catMenuOpen; }, 0);
  }

  function majorityHasTag(tag: Tag): boolean {
    let list = selectionSnapshot().contents;
    if (!list.length) {
      return false;
    }
    return list.filter(m => m.tags?.contains(tag)).length / list.length > 0.5;
  }

  async function applyCombination(combination: TagCombination) {
    await applyTagCombinationToEmails(selectionSnapshot().contents, combination);
    flagsEpoch++;
  }

  async function toggleTag(tag: Tag) {
    let list = selectionSnapshot().contents;
    let remove = majorityHasTag(tag);
    for (let m of list) {
      if (remove) {
        if (m.tags.contains(tag)) {
          await m.removeTag(tag);
        }
      } else if (!m.tags.contains(tag)) {
        await m.addTag(tag);
      }
    }
    flagsEpoch++;
  }

  async function clearTags() {
    for (let m of selectionSnapshot().contents) {
      await m.clearTags();
    }
    flagsEpoch++;
  }

  async function getMail() {
    assert(folder, gt`Please select a folder first`);
    let acc = folder.account;
    if (!acc.isLoggedIn) {
      await acc.login(true);
    }
    await folder.fetchNewMailQuick();
  }
</script>

<style>
  .classic-ribbon {
    align-items: center;
    gap: 2px;
    padding: 0;
    background: transparent;
    border: none;
    flex-shrink: 0;
    overflow: visible;
  }
  .group {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding-inline: 0;
  }
  .group.row {
    flex-direction: row;
    align-items: center;
  }
  .divider {
    width: 1px;
    height: 24px;
    align-self: center;
    margin-inline: 2px;
    background-color: var(--border);
    flex-shrink: 0;
  }
  .ribbon-btn {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    min-width: 32px;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--main-fg);
    font: inherit;
    font-size: 0;
    line-height: 0;
    cursor: default;
    flex-shrink: 0;
  }
  .ribbon-btn :global(svg) {
    display: block;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
  .ribbon-btn span {
    display: none;
  }
  .ribbon-btn:hover:not(:disabled) {
    background-color: var(--hover-bg);
    color: var(--hover-fg);
  }
  .ribbon-btn:disabled {
    opacity: 0.35;
  }
  .ribbon-btn.primary:not(:disabled) {
    color: var(--toolbar-control-fg);
  }
  .ribbon-btn.danger:not(:disabled) {
    color: var(--danger-fg);
  }
  .ribbon-btn.on :global(svg) {
    fill: var(--icon-primary);
    color: var(--icon-primary);
  }
  .tag-dot {
    width: 10px;
    height: 10px;
    border-radius: 1000px;
    background-color: var(--tag-color);
  }
  .combo-dots {
    gap: 3px;
    align-items: center;
  }
  .classic-ribbon :global(.menu) {
    align-items: center;
  }
  .classic-ribbon :global(.menu-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: 8px;
    color: var(--main-fg);
  }
  .classic-ribbon :global(.menu-button:hover:not(.disabled)) {
    background-color: var(--hover-bg);
    color: var(--hover-fg);
  }
</style>

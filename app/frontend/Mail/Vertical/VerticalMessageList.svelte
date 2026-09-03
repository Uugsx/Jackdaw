<vbox flex class="message-list"
  on:keydown={event => catchErrors(() => onKeyOnList(event))}
  tabindex={0}
  >
  {#if $folderSyncing && $listRows.isEmpty}
    <vbox class="empty-list">
      <Spinner size="36px" />
      <hbox class="subtitle">{$t`Loading messages`}</hbox>
    </vbox>
  {:else if $listRows.isEmpty}
    <vbox class="empty-list">
      {#if emptyDueToFilter}
        <hbox class="title">{$t`No messages match these filters`}</hbox>
        <hbox class="subtitle">{$t`Clear filters to see all messages in this folder.`}</hbox>
      {:else}
        <hbox class="title">{$t`This folder is empty`}</hbox>
        <hbox class="subtitle">{$t`Write a new email or get mail from the server.`}</hbox>
      {/if}
    </vbox>
  {:else}
  <FastList items={listRows}
    bind:selectedItem={selectedRow}
    bind:selectedItems={selectedRows}
    isSelectable={mailListRowSelectable}
    bind:isAtTop
    on:selected={onRowSelected}
    on:init={onListInit}
    columns="auto">
    <svelte:fragment slot="header">
    </svelte:fragment>
    <svelte:fragment slot="row" let:item>
      {#if item.kind == "day"}
        <MailListDaySeparator label={item.label} />
      {:else if item.kind == "message"}
        <VerticalMessageListItem message={item.message} on:click />
      {/if}
    </svelte:fragment>
  </FastList>
  {/if}
  {#if $folderSyncing && !$listRows.isEmpty}
    <vbox class="sync-overlay">
      <Spinner size="28px" />
    </vbox>
  {/if}
</vbox>

<script lang="ts">
  import type { EMail } from "../../../logic/Mail/EMail";
  import { onKeyOnList } from "../Message/MessageKeyboard";
  import { mailListSort } from "../LeftPane/quickFilters";
  import FastList from "../../Shared/FastList.svelte";
  import VerticalMessageListItem from "./VerticalMessageListItem.svelte";
  import MailListDaySeparator from "./MailListDaySeparator.svelte";
  import {
    MailListRows, findMailListRowForMessage, mailListRowSelectable,
    type MailListMessageRow, type MailListRow,
  } from "../mailListRows";
  import { listVisibleMessages, folderSyncing } from "../Selected";
  import Spinner from "../../Shared/Spinner.svelte";
  import { catchErrors } from "../../Util/error";
  import { ArrayColl, type Collection } from "svelte-collections";
  import { onDestroy } from "svelte";
  import { t } from "../../../l10n/l10n";

  export let messages: Collection<EMail>;
  export let selectedMessage: EMail;
  export let selectedMessages: ArrayColl<EMail>;
  /** From FastList. out only */
  export let isAtTop: boolean = false;
  export let emptyDueToFilter = false;

  let selectedRow: MailListRow | null = null;
  let selectedRows = new ArrayColl<MailListRow>();

  const rowsModel = new MailListRows();
  const listRows = rowsModel.rows;
  onDestroy(() => rowsModel.dispose());

  $: rowsModel.setSource(messages, $mailListSort);
  $: listVisibleMessages.set(messages);
  $: syncSelectedRow(selectedMessage, $listRows);
  $: syncSelectedMessages($selectedRows);
  $: syncRowsFromMessages(selectedMessages, $listRows);

  function selectedMessageRows(rows: ArrayColl<MailListRow>): EMail[] {
    return rows.contents
      .filter((row): row is MailListMessageRow => !!row && row.kind == "message")
      .map(row => row.message);
  }

  function syncRowsFromMessages(msgs: ArrayColl<EMail>, rows: Collection<MailListRow>) {
    let current = selectedMessageRows(selectedRows);
    if (arraysEqual(msgs.contents, current)) {
      return;
    }
    let emailRows = msgs.contents
      .map(message => findMailListRowForMessage(rows, message))
      .filter((row): row is MailListMessageRow => !!row && row.kind == "message");
    selectedRows.replaceAll(emailRows);
    selectedRow = emailRows[0] ?? null;
  }
  function syncSelectedRow(message: EMail, rows: Collection<MailListRow>) {
    let row = findMailListRowForMessage(rows, message);
    if (row && row !== selectedRow) {
      selectedRow = row;
      if (!selectedRows.contains(row)) {
        selectedRows.replaceAll([row]);
      }
    }
  }

  function syncSelectedMessages(rows: ArrayColl<MailListRow>) {
    let emails = selectedMessageRows(rows);
    if (!arraysEqual(emails, selectedMessages.contents)) {
      selectedMessages.replaceAll(emails);
    }
    if (emails[0] && emails[0] !== selectedMessage) {
      selectedMessage = emails[0];
    }
  }

  function arraysEqual<T>(a: T[], b: T[]): boolean {
    return a.length == b.length && a.every((item, i) => item == b[i]);
  }

  function onRowSelected(ev: CustomEvent<MailListRow>) {
    let row = ev.detail;
    if (row?.kind == "message") {
      selectedMessage = row.message;
    }
  }

  function onListInit(ev: CustomEvent<{ scrollToIndex: (index: number) => void, scrollToItem: (item: MailListRow) => void }>) {
    let row = findMailListRowForMessage(listRows, selectedMessage);
    if (row) {
      ev.detail.scrollToItem(row);
    }
  }
</script>

<style>
  .message-list {
    position: relative;
  }
  .sync-overlay {
    position: absolute;
    inset: 0;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--main-bg) 70%, transparent);
    pointer-events: none;
    z-index: 1;
  }
  .message-list :global(.fast-list) {
    padding-inline-start: 0;
  }
  .message-list :global(.header) {
    display: none;
  }
  .message-list :global(.header hbox) {
    vertical-align: middle;
    border: none;
    color: grey;
  }
  .message-list :global(.header) {
    height: 32px;
  }
  .message-list :global(.row.odd:not(.selected):not(:hover) .message) {
    background-color: var(--leftbar-bg);
    color: var(--leftbar-fg);
  }
  .message-list :global(.row:has(.mail-list-day-separator)) {
    cursor: default;
  }
  .message-list :global(.row:has(.mail-list-day-separator).odd .mail-list-day-separator),
  .message-list :global(.row:has(.mail-list-day-separator):hover .mail-list-day-separator) {
    background-color: transparent;
  }
  .empty-list {
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 2em;
    text-align: center;
    opacity: 0.75;
  }
  .empty-list .title {
    font-weight: 600;
  }
</style>

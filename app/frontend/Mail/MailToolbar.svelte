<hbox class="mail-toolbar">
  <hbox class="search-wrap">
    <SearchField bind:searchTerm={$globalSearchTerm} variant="toolbar" />
    <button type="button" class="search-filters-btn"
      class:active={filtersOpen}
      title={$t`Search filters`}
      aria-haspopup="dialog"
      aria-expanded={filtersOpen}
      bind:this={filtersAnchor}
      on:click|stopPropagation={() => filtersOpen = !filtersOpen}>
      <SlidersIcon size="16px" />
    </button>
  </hbox>
  <WriteButton account={selectedAccount} toolbar />
  <QuickFilterBar folder={selectedFolder} bind:searchMessages={filterSearchMessages} />
  <HorizontalScroll edgeButtons bind:this={ribbonScroll} class="ribbon-scroll">
    <ClassicRibbon
      account={selectedAccount}
      folder={selectedFolder}
      message={selectedMessage}
      {selectedMessages}
      showNew={false} />
  </HorizontalScroll>
</hbox>

{#if filtersAnchor}
  <Popup bind:popupOpen={filtersOpen} popupAnchor={filtersAnchor}
    placement="bottom-start" boundaryElSel="body">
    <vbox class="search-filters-popup">
      <hbox class="search-filters-title font-small">{$t`Search filters`}</hbox>
      <SearchCriteria search={globalSearch} showSearchTerm={false} />
      <hbox class="search-filters-actions">
        <Button label={$t`Clear`} plain onClick={clearAdvancedSearch} />
        <hbox flex />
        <Button label={$t`Apply`} classes="primary" onClick={applyAdvancedSearch} />
      </hbox>
    </vbox>
  </Popup>
{/if}

<script lang="ts">
  import type { MailAccount } from "../../logic/Mail/MailAccount";
  import type { Folder } from "../../logic/Mail/Folder";
  import type { EMail } from "../../logic/Mail/EMail";
  import { newSearchEMail } from "../../logic/Mail/Store/setStorage";
  import SearchField from "../Shared/SearchField.svelte";
  import WriteButton from "./LeftPane/WriteButton.svelte";
  import QuickFilterBar from "./LeftPane/QuickFilterBar.svelte";
  import ClassicRibbon from "./3pane/ClassicRibbon.svelte";
  import SearchCriteria from "./Search/SearchCriteria.svelte";
  import Popup from "../Shared/Popup.svelte";
  import Button from "../Shared/Button.svelte";
  import { globalSearchTerm } from "../AppsBar/selectedApp";
  import { selectedMessage as selectedMessageStore } from "./Selected";
  import { ArrayColl } from "svelte-collections";
  import { catchErrors, showError } from "../Util/error";
  import { t } from "../../l10n/l10n";
  import SlidersIcon from "lucide-svelte/icons/sliders-horizontal";
  import HorizontalScroll from "../Shared/HorizontalScroll.svelte";
  import debounce from "lodash/debounce";

  export let selectedAccount: MailAccount;
  export let selectedFolder: Folder;
  export let selectedMessage: EMail;
  export let selectedMessages: ArrayColl<EMail>;
  export let searchMessages: ArrayColl<EMail> | null;

  let filterSearchMessages: ArrayColl<EMail> | null = null;
  let globalSearchResults: ArrayColl<EMail> | null = null;
  let advancedSearchMessages: ArrayColl<EMail> | null = null;
  let globalSearch = newSearchEMail();
  let filtersOpen = false;
  let filtersAnchor: HTMLButtonElement;
  let usingAdvancedSearch = false;
  let ribbonScroll: HorizontalScroll;

  $: searchMessages = usingAdvancedSearch
    ? advancedSearchMessages
    : $globalSearchTerm
      ? globalSearchResults
      : filterSearchMessages;

  $: $globalSearchTerm, onGlobalSearchTermChanged();
  function onGlobalSearchTermChanged() {
    usingAdvancedSearch = false;
    if ($globalSearchTerm) {
      runGlobalSearchDebounced();
    } else {
      globalSearchResults = null;
    }
  }

  const runGlobalSearchDebounced = debounce(() => catchErrors(runGlobalSearch), 300);

  async function runGlobalSearch() {
    if (!$globalSearchTerm) {
      globalSearchResults = null;
      return;
    }
    globalSearch = newSearchEMail();
    globalSearch.bodyText = $globalSearchTerm;
    try {
      globalSearchResults = await globalSearch.startSearch(200);
      $selectedMessageStore = globalSearchResults?.first ?? null;
    } catch (ex) {
      showError(ex);
    }
  }

  function clearAdvancedSearch() {
    globalSearch = newSearchEMail();
    advancedSearchMessages = null;
    usingAdvancedSearch = false;
    filtersOpen = false;
  }

  async function applyAdvancedSearch() {
    try {
      advancedSearchMessages = await globalSearch.startSearch(200);
      usingAdvancedSearch = true;
      $globalSearchTerm = globalSearch.bodyText ?? null;
      $selectedMessageStore = advancedSearchMessages?.first ?? null;
      filtersOpen = false;
    } catch (ex) {
      showError(ex);
    }
  }
</script>

<style>
  .mail-toolbar {
    align-items: center;
    gap: 8px;
    min-height: 56px;
    padding: 10px 16px 8px;
    box-sizing: border-box;
    background: var(--headerbar-bg);
    border-block-end: 1px solid var(--glass-border-subtle);
    box-shadow: var(--glass-highlight);
    min-width: 0;
  }
  .search-wrap {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 1 220px;
    min-width: 140px;
  }
  .search-wrap :global(.search) {
    width: 100%;
    height: 34px;
    box-sizing: border-box;
  }
  .search-wrap :global(input[type="search"]) {
    font-size: 13px;
    box-sizing: border-box;
  }
  .search-filters-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border: 1px solid var(--toolbar-control-border);
    border-radius: var(--border-radius);
    background: var(--toolbar-control-bg);
    color: var(--toolbar-control-fg);
    cursor: default;
  }
  .search-filters-btn:hover,
  .search-filters-btn.active {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .search-filters-popup {
    min-width: 18em;
    max-width: 24em;
    padding: 12px 14px;
    gap: 10px;
    background: var(--main-bg);
    color: var(--main-fg);
  }
  .search-filters-title {
    font-weight: 600;
  }
  .search-filters-actions {
    align-items: center;
    gap: 8px;
    margin-block-start: 4px;
  }
  .mail-toolbar :global(.compose-toolbar),
  .mail-toolbar :global(.create) {
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    padding: 7px;
    box-sizing: border-box;
    border-radius: var(--border-radius);
    background-color: var(--toolbar-control-bg);
    color: var(--toolbar-control-fg);
    border: 1px solid var(--toolbar-control-border);
  }
  .mail-toolbar :global(.compose-toolbar.filled:not(:hover):not(.disabled)),
  .mail-toolbar :global(.create.filled:not(:hover):not(.disabled)) {
    background-color: var(--toolbar-control-bg);
    color: var(--toolbar-control-fg);
    border: 1px solid var(--toolbar-control-border);
    padding: 7px;
  }
  .mail-toolbar :global(.compose-toolbar:hover:not(.disabled)),
  .mail-toolbar :global(.create:hover:not(.disabled)) {
    background-color: var(--hover-bg);
    color: var(--hover-fg);
  }
  .mail-toolbar :global(.quick-filters-scroll) {
    flex: 1 1 auto;
    min-width: 0;
  }
  .mail-toolbar :global(.quick-filters) {
    flex: 0 0 auto;
    min-width: 0;
    min-height: 34px;
    padding: 0;
    gap: 6px;
    border: none;
    background-color: transparent;
    flex-wrap: nowrap;
  }
  .mail-toolbar :global(.quick-filters .pill) {
    flex: 0 0 auto;
    min-height: 32px;
    padding: 5px 10px;
    border-color: var(--toolbar-control-border);
    background-color: var(--toolbar-control-bg);
    font-size: 11px;
  }
  .mail-toolbar :global(.quick-filters .pill.active) {
    background-color: var(--selected-bg);
    border-color: transparent;
    color: var(--selected-fg);
  }
  .mail-toolbar :global(.ribbon-scroll) {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
  }
  .mail-toolbar :global(.classic-ribbon) {
    flex: 0 0 auto;
  }
</style>

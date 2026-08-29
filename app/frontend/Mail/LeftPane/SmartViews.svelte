<vbox class="smart-views">
  <hbox class="smart-views-header">
    <hbox class="section-title">{$t`Smart Views`}</hbox>
    <hbox flex />
    <button type="button" class="collapse-button"
      aria-label={expanded ? $t`Collapse smart views` : $t`Expand smart views`}
      aria-expanded={expanded}
      on:click={() => expanded = !expanded}>
      <svelte:component this={expanded ? ChevronUpIcon : ChevronDownIcon} size="14px" />
    </button>
  </hbox>

  {#if expanded}
    {#each views as view (view.id)}
      <button type="button" class="smart-view"
        class:active={isActive(view.id, $quickSearch)}
        aria-pressed={isActive(view.id, $quickSearch)}
        disabled={!folder}
        on:click={() => catchErrors(() => activate(view.id))}>
        <svelte:component this={view.icon} size="14px" />
        <span>{view.label()}</span>
        <hbox flex />
        {#if isActive(view.id, $quickSearch)}
          <CheckIcon size="13px" />
        {/if}
      </button>
    {/each}
  {/if}
</vbox>

<script lang="ts">
  import type { Folder } from "../../../logic/Mail/Folder";
  import type { EMail } from "../../../logic/Mail/EMail";
  import { quickSearch, selectedMessage } from "../Selected";
  import type { SearchEMail } from "../../../logic/Mail/Store/SearchEMail";
  import { ArrayColl } from "svelte-collections";
  import { catchErrors } from "../../Util/error";
  import { t } from "../../../l10n/l10n";
  import MailIcon from "lucide-svelte/icons/mail";
  import FlagIcon from "lucide-svelte/icons/flag";
  import AttachmentIcon from "lucide-svelte/icons/paperclip";
  import CheckIcon from "lucide-svelte/icons/check";
  import ChevronUpIcon from "lucide-svelte/icons/chevron-up";
  import ChevronDownIcon from "lucide-svelte/icons/chevron-down";

  type SmartViewId = "unread" | "starred" | "attachments";
  type SmartView = {
    id: SmartViewId;
    label: () => string;
    icon: typeof MailIcon;
  };

  export let folder: Folder;
  export let searchMessages: ArrayColl<EMail> | null;
  export let expanded = true;

  const views: SmartView[] = [
    { id: "unread", label: () => $t`Unread`, icon: MailIcon },
    { id: "starred", label: () => $t`Flagged`, icon: FlagIcon },
    { id: "attachments", label: () => $t`Attachments`, icon: AttachmentIcon },
  ];

  function isActive(id: SmartViewId, search: SearchEMail): boolean {
    if (id == "unread") {
      return search.isRead === false &&
        search.isStarred === null &&
        search.isImportant === null &&
        search.hasAttachment === null &&
        search.isOutgoing === null &&
        search.isReplied === null &&
        !search.bodyText;
    }
    if (id == "starred") {
      return search.isStarred === true &&
        search.isRead === null &&
        search.isImportant === null &&
        search.hasAttachment === null &&
        search.isOutgoing === null &&
        search.isReplied === null &&
        !search.bodyText;
    }
    return search.hasAttachment === true &&
      search.isRead === null &&
      search.isStarred === null &&
      search.isImportant === null &&
      search.isOutgoing === null &&
      search.isReplied === null &&
      !search.bodyText;
  }

  async function activate(id: SmartViewId) {
    if (!folder) {
      return;
    }
    if (isActive(id, $quickSearch)) {
      quickSearch.reset();
      quickSearch.folder = folder;
      $selectedMessage = null;
      searchMessages = null;
      return;
    }
    quickSearch.reset();
    quickSearch.folder = folder;
    if (id == "unread") {
      quickSearch.isRead = false;
    } else if (id == "starred") {
      quickSearch.isStarred = true;
    } else {
      quickSearch.hasAttachment = true;
    }
    $selectedMessage = null;
    searchMessages = new ArrayColl<EMail>();
    let result = await quickSearch.startSearch();
    searchMessages = result;
    $selectedMessage = result?.first;
  }
</script>

<style>
  .smart-views {
    flex: 0 0 auto;
    padding: 2px 8px 8px;
    color: var(--leftbar-fg);
  }
  .smart-views-header {
    align-items: center;
    min-height: 24px;
    padding: 0 8px;
  }
  .section-title {
    color: color-mix(in srgb, var(--leftbar-fg) 58%, transparent);
    font-size: 10px;
    font-weight: 650;
    letter-spacing: 0.01em;
  }
  .collapse-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 4px;
    border: none;
    border-radius: var(--border-radius);
    background: transparent;
    color: var(--leftbar-fg);
    cursor: default;
  }
  .collapse-button:hover {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .smart-view {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 30px;
    padding: 5px 8px;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    background: transparent;
    color: var(--leftbar-fg);
    font: inherit;
    font-size: 12px;
    text-align: start;
    cursor: default;
  }
  .smart-view:hover:not(:disabled):not(.active) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .smart-view.active {
    background: var(--selected-bg);
    color: var(--selected-fg);
    border-color: color-mix(in srgb, var(--icon-primary) 38%, transparent);
  }
  .smart-view.active:hover:not(:disabled) {
    background: var(--selected-hover-bg);
    color: var(--selected-hover-fg);
  }
  .smart-view:disabled {
    opacity: 0.45;
  }
</style>

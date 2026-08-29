{#if haveText}
  <ButtonMenu bind:isMenuOpen>
    <RoundButton
      slot="control"
      label={$t`Close and optionally save`}
      icon={CloseIcon}
      classes={buttonClasses}
      filled={false}
      iconSize={iconSize}
      padding={buttonPadding}
      onClick={onMenuToggle}
      />
    <MenuItem
      label={$t`Save`}
      icon={SaveIcon}
      onClick={onSave}
      />
    <MenuItem
      label={$t`Discard`}
      icon={TrashIcon}
      onClick={onDelete}
      />
  </ButtonMenu>
{:else}
  <RoundButton
    label={$t`Discard`}
    icon={CloseIcon}
    classes={buttonClasses}
    filled={false}
    iconSize={iconSize}
    padding={buttonPadding}
    onClick={onDelete}
    />
{/if}

<script lang="ts">
  import type { EMail } from "../../../logic/Mail/EMail";
  import RoundButton from "../../Shared/RoundButton.svelte";
  import CloseIcon from "lucide-svelte/icons/x";
  import TrashIcon from "lucide-svelte/icons/trash-2";
  import SaveIcon from "lucide-svelte/icons/save";
  import { t } from "../../../l10n/l10n";
  import ButtonMenu from "../../Shared/Menu/ButtonMenu.svelte";
  import MenuItem from "../../Shared/Menu/MenuItem.svelte";
  import { createEventDispatcher } from 'svelte';
  const dispatchEvent = createEventDispatcher<{ close: void }>();

  export let mail: EMail;
  /** Icon-only chrome button matching mail toolbar style */
  export let chrome = false;
  /** Compact icon in floating window title bar */
  export let compact = false;
  /** Sync editor content before saving from close menu */
  export let beforeSave: (() => void | Promise<void>) | null = null;

  $: buttonClasses = chrome
    ? compact ? "plain toolbar-chrome qat" : "plain toolbar-chrome"
    : "plain";
  $: iconSize = chrome ? "16px" : undefined;
  $: buttonPadding = chrome ? "6px" : undefined;

  let isMenuOpen = false;
  function onMenuToggle(event: Event) {
    isMenuOpen = !isMenuOpen;
    checkDirty();
  }

  let haveText = true;
  async function onSave() {
    if (beforeSave) {
      await beforeSave();
    }
    await mail.compose.saveAsDraft();
    dispatchEvent("close");
  }
  async function onDelete() {
    dispatchEvent("close");
    await mail.compose.deleteDrafts();
  }

  function checkDirty() {
    // If there's no meaningful body text beyond the quote, close without offering save
    let text = notQuote().body.textContent ?? "";
    text = text.replace(/\s+/g, "").trim();
    // Ignore short attribution / signature crumbs before a quote
    if (text.length < 20) {
      isMenuOpen = false;
      dispatchEvent("close");
    }
  }

  function notQuote(): Document {
    let doc = new DOMParser().parseFromString(mail.html, "text/html");
    for (let blockquote of doc.body.querySelectorAll("blockquote")) {
      blockquote.remove();
    }
    return doc;
  }
</script>

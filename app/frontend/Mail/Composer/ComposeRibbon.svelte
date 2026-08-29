{#if editor}
  <vbox class="compose-ribbon font-smallest">
    <hbox class="ribbon-tabs">
      <button type="button" class="ribbon-tab" class:active={activeTab === "message"}
        on:click={() => activeTab = "message"}>
        {$t`Message`}
      </button>
      <button type="button" class="ribbon-tab" class:active={activeTab === "options"}
        on:click={() => activeTab = "options"}>
        {$t`Options`}
      </button>
    </hbox>

    {#if activeTab === "message"}
      <hbox class="ribbon-row">
        <vbox class="group">
          <hbox class="group-row send-row">
            <button type="button" class="ribbon-btn primary large send-main"
              title={sendDisabledTooltip ?? $t`Send`}
              disabled={!!sendDisabledTooltip || sending}
              on:click={() => dispatch("send")}>
              <SendIcon size="20px" />
              <span>{$t`Send`}</span>
            </button>
            <button type="button" class="ribbon-btn primary send-menu-btn"
              title={$t`Send options`}
              bind:this={sendMenuAnchor}
              disabled={!!sendDisabledTooltip || sending}
              on:click={() => sendMenuOpen = true}>
              <ChevronDownIcon size="14px" />
            </button>
          </hbox>
          <span class="group-label">{$t`Send`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn" title={$t`Paste`}
              on:click={() => pasteContent("default")}>
              <ClipboardPasteIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn paste-menu-btn" title={$t`Paste special`}
              bind:this={pasteMenuAnchor}
              on:click={() => pasteMenuOpen = true}>
              <ChevronDownIcon size="14px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Cut`}
              on:click={onCut}>
              <ScissorsIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Copy`}
              on:click={onCopy}>
              <CopyIcon size="18px" />
            </button>
          </hbox>
          <span class="group-label">{$t`Clipboard`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group basic-text-group">
          <hbox class="group-row font-row">
            <select class="ribbon-select font-family" title={$t`Font`}
              value={selectedFontFamily}
              on:change={onFontFamilyChange}>
              {#each composeFontFamilies as font}
                <option value={font.value}>{font.label()}</option>
              {/each}
            </select>
            <select class="ribbon-select font-size" title={$t`Font size`}
              value={selectedFontSize}
              on:change={onFontSizeChange}>
              <option value="">{$t`Size`}</option>
              {#each composeFontSizes as size}
                <option value={size}>{size}</option>
              {/each}
            </select>
          </hbox>
          <hbox class="group-row">
            <button type="button" class="ribbon-btn" title={$t`Bold`}
              class:on={editor.isActive("bold")}
              on:click={() => editor.chain().focus().toggleBold().run()}>
              <BoldIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Italic`}
              class:on={editor.isActive("italic")}
              on:click={() => editor.chain().focus().toggleItalic().run()}>
              <ItalicIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Underline`}
              class:on={editor.isActive("underline")}
              on:click={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Strike-through`}
              class:on={editor.isActive("strike")}
              on:click={() => editor.chain().focus().toggleStrike().run()}>
              <StrikethroughIcon size="18px" />
            </button>
            <span class="color-swatch-wrap" title={$t`Font color`}>
              <input type="color" class="color-swatch" bind:value={textColor}
                on:input={onTextColorChange} />
            </span>
            {#each composeHighlightColors as color}
              <button type="button" class="ribbon-btn highlight-swatch"
                class:on={editor.isActive("highlight", { color })}
                title={$t`Text highlight color`}
                style:--swatch-color={color}
                on:click={() => editor.chain().focus().toggleHighlight({ color }).run()} />
            {/each}
          </hbox>
          <span class="group-label">{$t`Basic Text`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn" title={$t`Bulleted list`}
              class:on={editor.isActive("bulletList")}
              on:click={() => editor.chain().focus().toggleBulletList().run()}>
              <ListIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Ordered list`}
              class:on={editor.isActive("orderedList")}
              on:click={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrderedIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Quote of the original email`}
              class:on={editor.isActive("blockquote")}
              on:click={() => editor.chain().focus().toggleBlockquote().run()}>
              <QuoteIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Align left`}
              class:on={editor.isActive({ textAlign: "left" })}
              on:click={() => editor.chain().focus().setTextAlign("left").run()}>
              <AlignLeftIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Align center`}
              class:on={editor.isActive({ textAlign: "center" })}
              on:click={() => editor.chain().focus().setTextAlign("center").run()}>
              <AlignCenterIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Align right`}
              class:on={editor.isActive({ textAlign: "right" })}
              on:click={() => editor.chain().focus().setTextAlign("right").run()}>
              <AlignRightIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Justify`}
              class:on={editor.isActive({ textAlign: "justify" })}
              on:click={() => editor.chain().focus().setTextAlign("justify").run()}>
              <AlignJustifyIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Increase indent`}
              on:click={() => editor.chain().focus().indent().run()}>
              <IndentIncreaseIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Decrease indent`}
              on:click={() => editor.chain().focus().unindent().run()}>
              <IndentDecreaseIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Clear formatting`}
              on:click={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
              <RemoveFormattingIcon size="18px" />
            </button>
          </hbox>
          <span class="group-label">{$t`Paragraph`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn" title={$t`Link to webpage`}
              class:on={editor.isActive("link")}
              on:click={onLinkOpen}>
              <LinkIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Insert image`}
              on:click={pickImageFile}>
              <ImageIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Table`}
              on:click={insertTable}>
              <TableIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Attachments`}
              on:click={() => dispatch("addAttachment")}>
              <PaperclipIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Signature`}
              on:click={() => dispatch("insertSignature")}>
              <SignatureIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Actions`}
              disabled={!!hasSML}
              on:click={() => dispatch("openActions")}>
              <ListChecksIcon size="18px" />
            </button>
          </hbox>
          <span class="group-label">{$t`Insert`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn danger" title={$t`Important`}
              class:on={importanceLevel === "high"}
              on:click={() => dispatch("toggleHighImportance")}>
              <CircleAlertIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn low-importance" title={$t`Low importance`}
              class:on={importanceLevel === "low"}
              on:click={() => dispatch("toggleLowImportance")}>
              <ArrowDownIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Flagged`}
              class:on={isFlagged}
              on:click={() => dispatch("toggleFlag")}>
              <FlagIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Emoji`}
              class:on={showEmojis}
              on:click={() => dispatch("toggleEmojis")}>
              <SmileIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Undo the last change`}
              disabled={!editor.can().chain().focus().undo().run()}
              on:click={() => editor.chain().focus().undo().run()}>
              <UndoIcon size="18px" />
            </button>
            <button type="button" class="ribbon-btn" title={$t`Redo the change that was undone before`}
              disabled={!editor.can().chain().focus().redo().run()}
              on:click={() => editor.chain().focus().redo().run()}>
              <RedoIcon size="18px" />
            </button>
          </hbox>
          <span class="group-label">{$t`Tags`}</span>
        </vbox>
      </hbox>
    {:else}
      <hbox class="ribbon-row options-row">
        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn option-chip on" disabled title={$t`HTML`}>
              HTML
            </button>
            <button type="button" class="ribbon-btn option-chip"
              class:on={spellcheckOn}
              title={$t`Spell check`}
              on:click={() => dispatch("toggleSpellcheck")}>
              <SpellCheckIcon size="16px" />
              <span>{$t`Spell check`}</span>
            </button>
          </hbox>
          <span class="group-label">{$t`Format`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn option-chip"
              class:on={requestReadReceipt}
              title={$t`Request read receipt`}
              on:click={() => dispatch("toggleReadReceipt")}>
              <MailCheckIcon size="16px" />
              <span>{$t`Request read receipt`}</span>
            </button>
            <button type="button" class="ribbon-btn option-chip"
              class:on={requestDeliveryReceipt}
              title={$t`Request delivery receipt`}
              on:click={() => dispatch("toggleDeliveryReceipt")}>
              <MailOpenIcon size="16px" />
              <span>{$t`Request delivery receipt`}</span>
            </button>
          </hbox>
          <span class="group-label">{$t`Tracking`}</span>
        </vbox>

        <hbox class="divider" aria-hidden="true" />

        <vbox class="group">
          <hbox class="group-row zoom-row">
            {#each zoomLevels as level}
              <button type="button" class="ribbon-btn option-chip"
                class:on={editorZoom === level}
                on:click={() => dispatch("setZoom", level)}>
                {level}%
              </button>
            {/each}
          </hbox>
          <span class="group-label">{$t`Zoom`}</span>
        </vbox>
      </hbox>
    {/if}

    {#if isEditingLink}
      <hbox class="link-row">
        <span class="link-label">{$t`Link to webpage`}</span>
        <input type="url" bind:value={linkTargetURL} class="link-input" />
        <button type="button" class="ribbon-btn" title={$t`OK`}
          on:click={onLinkOK}>
          <CheckIcon size="16px" />
        </button>
        <button type="button" class="ribbon-btn" title={$t`Remove link`}
          on:click={onLinkRemove}>
          <UnlinkIcon size="16px" />
        </button>
      </hbox>
    {/if}
  </vbox>

  <Menu bind:isMenuOpen={pasteMenuOpen} anchor={pasteMenuAnchor} boundaryElSel=".mail-composer-window">
    <MenuItem label={$t`Keep source formatting`} onClick={() => pasteContent("source")} />
    <MenuItem label={$t`Merge formatting`} onClick={() => pasteContent("merge")} />
    <MenuItem label={$t`Keep text only`} onClick={() => pasteContent("text")} />
  </Menu>

  {#if sendMenuAnchor}
    <Menu bind:isMenuOpen={sendMenuOpen} anchor={sendMenuAnchor} boundaryElSel=".mail-composer-window">
      <MenuItem label={$t`Save draft`} onClick={() => { sendMenuOpen = false; dispatch("saveDraft"); }} />
    </Menu>
  {/if}

  <input type="file"
    class="image-file-input"
    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
    bind:this={imageFileEl}
    on:change={onImageFileSelected} />
{/if}

<script lang="ts">
  import type { Editor } from "@tiptap/core";
  import { createEventDispatcher } from "svelte";
  import { blobToDataURL } from "../../../logic/util/util";
  import {
    composeFontFamilies,
    composeFontSizes,
    composeHighlightColors,
    currentFontFamily,
    currentFontSize,
    currentTextColor,
  } from "../../Shared/Editor/composeEditorExtensions";
  import { t } from "../../../l10n/l10n";
  import SendIcon from "lucide-svelte/icons/send";
  import ClipboardPasteIcon from "lucide-svelte/icons/clipboard-paste";
  import ScissorsIcon from "lucide-svelte/icons/scissors";
  import CopyIcon from "lucide-svelte/icons/copy";
  import BoldIcon from "lucide-svelte/icons/bold";
  import ItalicIcon from "lucide-svelte/icons/italic";
  import UnderlineIcon from "lucide-svelte/icons/underline";
  import StrikethroughIcon from "lucide-svelte/icons/strikethrough";
  import ListIcon from "lucide-svelte/icons/list";
  import ListOrderedIcon from "lucide-svelte/icons/list-ordered";
  import QuoteIcon from "lucide-svelte/icons/text-quote";
  import RemoveFormattingIcon from "lucide-svelte/icons/remove-formatting";
  import AlignLeftIcon from "lucide-svelte/icons/align-left";
  import AlignCenterIcon from "lucide-svelte/icons/align-center";
  import AlignRightIcon from "lucide-svelte/icons/align-right";
  import AlignJustifyIcon from "lucide-svelte/icons/align-justify";
  import IndentIncreaseIcon from "lucide-svelte/icons/indent-increase";
  import IndentDecreaseIcon from "lucide-svelte/icons/indent-decrease";
  import LinkIcon from "lucide-svelte/icons/link";
  import UnlinkIcon from "lucide-svelte/icons/unlink";
  import ImageIcon from "lucide-svelte/icons/image-plus";
  import TableIcon from "lucide-svelte/icons/table";
  import PaperclipIcon from "lucide-svelte/icons/paperclip";
  import SignatureIcon from "lucide-svelte/icons/signature";
  import CircleAlertIcon from "lucide-svelte/icons/circle-alert";
  import ArrowDownIcon from "lucide-svelte/icons/arrow-down";
  import SmileIcon from "lucide-svelte/icons/smile";
  import UndoIcon from "lucide-svelte/icons/undo";
  import RedoIcon from "lucide-svelte/icons/redo";
  import SpellCheckIcon from "lucide-svelte/icons/spell-check";
  import MailCheckIcon from "lucide-svelte/icons/mail-check";
  import MailOpenIcon from "lucide-svelte/icons/mail-open";
  import ChevronDownIcon from "lucide-svelte/icons/chevron-down";
  import CheckIcon from "lucide-svelte/icons/check";
  import ListChecksIcon from "lucide-svelte/icons/list-checks";
  import FlagIcon from "lucide-svelte/icons/flag";
  import Menu from "../../Shared/Menu/Menu.svelte";
  import MenuItem from "../../Shared/Menu/MenuItem.svelte";
  import type { MailImportanceLevel } from "../../../logic/Mail/EMail";

  export let editor: Editor;
  export let sendDisabledTooltip: string | null = null;
  export let sending = false;
  export let importanceLevel: MailImportanceLevel = "normal";
  export let requestReadReceipt = false;
  export let requestDeliveryReceipt = false;
  export let isFlagged = false;
  export let showEmojis = false;
  export let spellcheckOn = false;
  export let editorZoom = 100;
  export let hasSML = false;
  export let openLinkDialog = false;

  const dispatch = createEventDispatcher<{
    send: void;
    addAttachment: void;
    insertSignature: void;
    toggleHighImportance: void;
    toggleLowImportance: void;
    toggleReadReceipt: void;
    toggleDeliveryReceipt: void;
    toggleFlag: void;
    toggleEmojis: void;
    saveDraft: void;
    toggleSpellcheck: void;
    setZoom: number;
    openActions: void;
  }>();

  let activeTab: "message" | "options" = "message";
  const zoomLevels = [90, 100, 125];
  let pasteMenuOpen = false;
  let pasteMenuAnchor: HTMLButtonElement;
  let sendMenuOpen = false;
  let sendMenuAnchor: HTMLButtonElement;

  type PasteMode = "default" | "source" | "merge" | "text";

  let isEditingLink = false;
  let linkTargetURL = "";
  let imageFileEl: HTMLInputElement;
  let textColor = "#0B0F14";

  $: selectedFontFamily = editor ? currentFontFamily(editor) : "";
  $: selectedFontSize = editor ? currentFontSize(editor) : "";
  $: if (editor) {
    textColor = currentTextColor(editor);
  }
  $: if (openLinkDialog && editor) {
    openLinkDialog = false;
    onLinkOpen();
  }

  function onFontFamilyChange(event: Event) {
    let value = (event.currentTarget as HTMLSelectElement).value;
    if (value) {
      editor.chain().focus().setFontFamily(value).run();
    } else {
      editor.chain().focus().unsetFontFamily().run();
    }
  }

  function onFontSizeChange(event: Event) {
    let value = (event.currentTarget as HTMLSelectElement).value;
    if (value) {
      editor.chain().focus().setFontSize(`${value}px`).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
  }

  function onTextColorChange() {
    editor.chain().focus().setColor(textColor).run();
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function onCut() {
    editor?.chain().focus().run();
    document.execCommand("cut");
  }

  function onCopy() {
    editor?.chain().focus().run();
    document.execCommand("copy");
  }

  async function pasteContent(mode: PasteMode) {
    editor?.chain().focus().run();
    pasteMenuOpen = false;
    try {
      let items = await navigator.clipboard.read();
      let html = "";
      let text = "";
      for (let item of items) {
        if (!html && item.types.includes("text/html")) {
          html = await (await item.getType("text/html")).text();
        }
        if (!text && item.types.includes("text/plain")) {
          text = await (await item.getType("text/plain")).text();
        }
      }
      if (mode === "text") {
        if (text) {
          editor?.chain().focus().insertContent(text).run();
        }
        return;
      }
      if (mode === "merge" && html) {
        html = mergePasteFormatting(html);
      }
      if ((mode === "default" || mode === "source" || mode === "merge") && html) {
        editor?.chain().focus().insertContent(html).run();
        return;
      }
      if (text) {
        editor?.chain().focus().insertContent(text).run();
        return;
      }
    } catch {
      // Fall back to native paste when clipboard API is blocked.
    }
    document.execCommand("paste");
  }

  function mergePasteFormatting(html: string): string {
    let doc = new DOMParser().parseFromString(html, "text/html");
    doc.body.querySelectorAll("*").forEach(element => {
      element.removeAttribute("style");
      element.removeAttribute("class");
      element.removeAttribute("color");
      element.removeAttribute("face");
      element.removeAttribute("size");
    });
    doc.body.querySelectorAll("font").forEach(element => {
      let parent = element.parentNode;
      if (!parent) {
        return;
      }
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    });
    return doc.body.innerHTML;
  }

  function onLinkOpen() {
    isEditingLink = true;
    linkTargetURL = editor.getAttributes("link").href ?? "";
  }

  function onLinkOK() {
    if (linkTargetURL) {
      editor.chain().focus().setLink({ href: linkTargetURL }).run();
    }
    isEditingLink = false;
  }

  function onLinkRemove() {
    editor.chain().focus().unsetLink().run();
    isEditingLink = false;
  }

  function pickImageFile() {
    imageFileEl?.click();
  }

  async function onImageFileSelected() {
    try {
      let file = imageFileEl?.files?.[0];
      if (imageFileEl) {
        imageFileEl.value = "";
      }
      if (!file || !editor) {
        return;
      }
      let url = await blobToDataURL(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      // Image insert failed silently — user can retry.
    }
  }
</script>

<style>
  .compose-ribbon {
    gap: 0;
    border-block-end: 1px solid var(--border);
    background: var(--headerbar-bg);
    color: var(--headerbar-fg);
  }
  .ribbon-tabs {
    gap: 0;
    padding-inline: 8px;
    border-block-end: 1px solid var(--border);
  }
  .ribbon-tab {
    padding: 6px 14px 5px;
    border: none;
    border-block-end: 2px solid transparent;
    background: transparent;
    color: color-mix(in srgb, var(--headerbar-fg) 72%, transparent);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: default;
  }
  .ribbon-tab.active {
    color: var(--headerbar-fg);
    border-block-end-color: var(--icon-primary);
  }
  .ribbon-tab:hover:not(.active) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .ribbon-row {
    align-items: stretch;
    gap: 2px;
    padding: 6px 8px 4px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ribbon-row::-webkit-scrollbar {
    display: none;
  }
  .group {
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    min-width: 0;
    flex-shrink: 0;
  }
  .group-row {
    align-items: center;
    gap: 1px;
    min-height: 28px;
  }
  .basic-text-group .group-row:last-of-type {
    min-height: 28px;
  }
  .group-row.font-row {
    min-height: 24px;
    margin-block-end: 2px;
  }
  .ribbon-select {
    height: 24px;
    padding: 2px 6px;
    border: 1px solid var(--toolbar-control-border);
    border-radius: 6px;
    background: var(--toolbar-control-bg);
    color: var(--headerbar-fg);
    font: inherit;
    font-size: 11px;
  }
  .ribbon-select.font-family {
    min-width: 7.5em;
    max-width: 9em;
  }
  .ribbon-select.font-size {
    min-width: 3.5em;
    max-width: 4em;
  }
  .color-swatch-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
  }
  .color-swatch {
    width: 18px;
    height: 18px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    cursor: default;
  }
  .highlight-swatch {
    width: 18px;
    min-width: 18px;
    height: 18px;
    padding: 0;
    border-radius: 4px;
    background: var(--swatch-color);
    border: 1px solid color-mix(in srgb, var(--swatch-color) 70%, var(--border));
  }
  .highlight-swatch.on {
    outline: 2px solid var(--icon-primary);
    outline-offset: 1px;
  }
  .group-label {
    color: color-mix(in srgb, var(--headerbar-fg) 58%, transparent);
    font-size: 10px;
    line-height: 1.2;
    text-align: center;
    white-space: nowrap;
  }
  .divider {
    width: 1px;
    align-self: stretch;
    margin-inline: 4px;
    background: var(--border);
    flex-shrink: 0;
  }
  .ribbon-btn {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 28px;
    height: 28px;
    padding: 4px 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--headerbar-fg);
    font: inherit;
    font-size: 10px;
    line-height: 1;
    cursor: default;
    flex-shrink: 0;
  }
  .ribbon-btn :global(svg) {
    display: block;
    flex-shrink: 0;
  }
  .paste-menu-btn {
    min-width: 18px;
    padding-inline: 2px;
  }
  .send-row {
    align-items: stretch;
  }
  .send-main {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
    min-width: 56px;
  }
  .send-menu-btn {
    min-width: 20px;
    padding-inline: 2px;
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    margin-inline-start: -1px;
  }
  .ribbon-btn:hover:not(:disabled) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .ribbon-btn:disabled {
    opacity: 0.35;
  }
  .ribbon-btn.on :global(svg) {
    color: var(--icon-primary);
  }
  .ribbon-btn.danger.on :global(svg) {
    color: var(--danger-fg);
  }
  .ribbon-btn.low-importance.on :global(svg) {
    color: #2563eb;
  }
  .ribbon-btn.primary {
    color: var(--toolbar-control-fg);
  }
  .ribbon-btn.large {
    min-width: 56px;
    height: 56px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--inverted-bg);
    color: var(--inverted-fg);
  }
  .ribbon-btn.large:hover:not(:disabled) {
    background: color-mix(in srgb, var(--inverted-bg) 88%, white);
    color: var(--inverted-fg);
  }
  .ribbon-btn.large span {
    font-size: 11px;
    font-weight: 650;
  }
  .option-chip {
    flex-direction: row;
    gap: 4px;
    min-width: auto;
    height: 28px;
    padding-inline: 10px;
    border-color: var(--toolbar-control-border);
    background: var(--toolbar-control-bg);
  }
  .option-chip.on {
    background: var(--selected-bg);
    color: var(--selected-fg);
    border-color: transparent;
  }
  .options-row .group-row {
    min-height: 36px;
  }
  .zoom-row {
    gap: 4px;
  }
  .link-row {
    align-items: center;
    gap: 8px;
    padding: 6px 12px 8px;
    border-block-start: 1px solid var(--border);
  }
  .link-label {
    flex-shrink: 0;
    color: color-mix(in srgb, var(--headerbar-fg) 72%, transparent);
  }
  .link-input {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 28em;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--input-bg);
    color: var(--input-fg);
    font: inherit;
    font-size: 12px;
  }
  .image-file-input {
    display: none;
  }
</style>

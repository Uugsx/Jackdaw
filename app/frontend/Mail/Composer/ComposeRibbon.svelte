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
      <HorizontalScroll edgeButtons>
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
              on:mousedown={rememberEditorSelection}
              on:change={onFontFamilyChange}>
              {#each composeFontFamilies as font}
                <option value={font.value}>{font.label()}</option>
              {/each}
            </select>
            <select class="ribbon-select font-size" title={$t`Font size`}
              value={displayFontSize}
              on:mousedown={rememberEditorSelection}
              on:change={onFontSizeChange}>
              {#if selectedFontSize && !composeFontSizes.includes(selectedFontSize)}
                <option value={selectedFontSize}>{formatFontSizeLabel(selectedFontSize)}</option>
              {/if}
              {#each composeFontSizes as size}
                <option value={size}>{formatFontSizeLabel(size)}</option>
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
            <button type="button" class="ribbon-btn color-tool"
              class:on={!!selectedTextColor}
              bind:this={textColorMenuAnchor}
              title={$t`Font color`}
              on:mousedown={rememberEditorSelection}
              on:click|stopPropagation={toggleTextColorMenu}>
              <span class="font-color-glyph">A</span>
              <span class="color-tool-bar" style:background={textColorBar} />
            </button>
            <button type="button" class="ribbon-btn color-tool"
              class:on={editor.isActive("highlight")}
              bind:this={highlightMenuAnchor}
              title={$t`Text highlight color`}
              on:mousedown={rememberEditorSelection}
              on:click|stopPropagation={toggleHighlightMenu}>
              <HighlighterIcon size="18px" />
              <span class="color-tool-bar" style:background={highlightBarColor} />
            </button>
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
      </HorizontalScroll>
    {:else}
      <HorizontalScroll edgeButtons>
      <hbox class="ribbon-row options-row">
        <vbox class="group">
          <hbox class="group-row">
            <button type="button" class="ribbon-btn option-chip"
              class:on={sendAsHtml}
              title={sendAsHtml ? $t`Send as HTML and Plaintext` : $t`Send as Plaintext only`}
              on:click={toggleSendFormat}>
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
      </HorizontalScroll>
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

  {#if textColorMenuAnchor}
    <Menu bind:isMenuOpen={textColorMenuOpen} anchor={textColorMenuAnchor}
      boundaryElSel="body" placement="bottom-start" disableReferenceHide={true}>
      <vbox class="color-picker-popup">
        <button type="button" class="color-picker-action"
          on:click={() => applyTextColor(null)}>
          {$t`Automatic`}
        </button>
        <div class="color-grid">
          {#each composeTextColors as color}
            <button type="button" class="color-cell" style:background={color}
              class:selected={selectedTextColor === color}
              title={color}
              on:click={() => applyTextColor(color)} />
          {/each}
        </div>
      </vbox>
    </Menu>
  {/if}

  {#if highlightMenuAnchor}
    <Menu bind:isMenuOpen={highlightMenuOpen} anchor={highlightMenuAnchor}
      boundaryElSel="body" placement="bottom-start" disableReferenceHide={true}>
      <vbox class="color-picker-popup">
        <label class="color-picker-toggle">
          <input type="checkbox" bind:checked={highlightHighContrastOnly} />
          {$t`High contrast only`}
        </label>
        <button type="button" class="color-picker-action"
          on:click={() => applyHighlight(null)}>
          {$t`No color`}
        </button>
        <div class="color-grid">
          {#each visibleHighlightColors as color}
            <button type="button" class="color-cell" style:background={color}
              class:selected={editor?.isActive("highlight", { color })}
              title={color}
              on:click={() => applyHighlight(color)} />
          {/each}
        </div>
      </vbox>
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
    composeHighlightColorsHighContrast,
    composeTextColors,
    composeDefaultFontSize,
    composeDefaultHighlightColor,
    currentFontFamily,
    currentFontSize,
    highlightPreviewColor,
    formatFontSizeLabel,
    fontSizeToCSS,
    normalizeFontSizeValue,
  } from "../../Shared/Editor/composeEditorExtensions";
  import { onDestroy } from "svelte";
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
  import HighlighterIcon from "lucide-svelte/icons/highlighter";
  import CheckIcon from "lucide-svelte/icons/check";
  import ListChecksIcon from "lucide-svelte/icons/list-checks";
  import FlagIcon from "lucide-svelte/icons/flag";
  import Menu from "../../Shared/Menu/Menu.svelte";
  import MenuItem from "../../Shared/Menu/MenuItem.svelte";
  import HorizontalScroll from "../../Shared/HorizontalScroll.svelte";
  import { getLocalStorage } from "../../Util/LocalStorage";
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
  let formatSetting = getLocalStorage("mail.send.format", "html");
  $: sendAsHtml = formatSetting.value === "html";
  function toggleSendFormat() {
    formatSetting.value = sendAsHtml ? "plaintext" : "html";
  }
  let pasteMenuOpen = false;
  let pasteMenuAnchor: HTMLButtonElement;
  let sendMenuOpen = false;
  let sendMenuAnchor: HTMLButtonElement;
  let textColorMenuOpen = false;
  let textColorMenuAnchor: HTMLButtonElement;
  let highlightMenuOpen = false;
  let highlightMenuAnchor: HTMLButtonElement;
  let highlightHighContrastOnly = false;

  type PasteMode = "default" | "source" | "merge" | "text";

  let isEditingLink = false;
  let linkTargetURL = "";
  let imageFileEl: HTMLInputElement;
  let styleTick = 0;
  let styleListenerCleanup: (() => void) | null = null;
  let subscribedEditor: Editor | null = null;

  $: if (editor && editor !== subscribedEditor) {
    styleListenerCleanup?.();
    subscribedEditor = editor;
    let bump = () => styleTick++;
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    styleListenerCleanup = () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  } else if (!editor) {
    styleListenerCleanup?.();
    styleListenerCleanup = null;
    subscribedEditor = null;
  }

  onDestroy(() => {
    styleListenerCleanup?.();
    styleListenerCleanup = null;
    subscribedEditor = null;
  });

  $: selectedFontFamily = editor ? (styleTick, currentFontFamily(editor)) : "";
  $: selectedFontSize = editor ? (styleTick, currentFontSize(editor)) : "";
  $: displayFontSize = selectedFontSize || normalizeFontSizeValue(composeDefaultFontSize);
  $: selectedTextColor = editor ? (styleTick, editor.getAttributes("textStyle").color ?? "") : "";
  $: textColorBar = selectedTextColor || "var(--headerbar-fg)";
  $: highlightBarColor = editor ? (styleTick, highlightPreviewColor(editor)) : composeDefaultHighlightColor;
  $: visibleHighlightColors = highlightHighContrastOnly
    ? composeHighlightColorsHighContrast
    : composeHighlightColors;
  $: if (openLinkDialog && editor) {
    openLinkDialog = false;
    onLinkOpen();
  }

  let savedSelection: { from: number; to: number } | null = null;

  function rememberEditorSelection() {
    if (!editor) {
      return;
    }
    let { from, to } = editor.state.selection;
    savedSelection = { from, to };
  }

  function chainWithSavedSelection() {
    let chain = editor.chain().focus();
    if (savedSelection) {
      chain = chain.setTextSelection(savedSelection);
    }
    return chain;
  }

  function clearSavedSelection() {
    savedSelection = null;
  }

  function onFontFamilyChange(event: Event) {
    let value = (event.currentTarget as HTMLSelectElement).value;
    if (value) {
      chainWithSavedSelection().setFontFamily(value).run();
    } else {
      chainWithSavedSelection().unsetFontFamily().run();
    }
    clearSavedSelection();
  }

  function onFontSizeChange(event: Event) {
    let value = (event.currentTarget as HTMLSelectElement).value;
    if (value) {
      chainWithSavedSelection().setFontSize(value).run();
    } else {
      chainWithSavedSelection().unsetFontSize().run();
    }
    clearSavedSelection();
  }

  function applyTextColor(color: string | null) {
    if (color) {
      chainWithSavedSelection().setColor(color).run();
    } else {
      chainWithSavedSelection().unsetColor().run();
    }
    clearSavedSelection();
    textColorMenuOpen = false;
  }

  function toggleTextColorMenu() {
    highlightMenuOpen = false;
    textColorMenuOpen = !textColorMenuOpen;
  }

  function toggleHighlightMenu() {
    textColorMenuOpen = false;
    highlightMenuOpen = !highlightMenuOpen;
  }

  function applyHighlight(color: string | null) {
    if (color) {
      chainWithSavedSelection().setHighlight({ color }).run();
    } else {
      chainWithSavedSelection().unsetHighlight().run();
    }
    clearSavedSelection();
    highlightMenuOpen = false;
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
    width: 100%;
    min-width: 0;
    align-self: stretch;
    gap: 0;
    border-block-end: 1px solid var(--border);
    background: var(--headerbar-bg);
    color: var(--headerbar-fg);
  }
  .compose-ribbon :global(.h-scroll) {
    width: 100%;
    min-width: 0;
  }
  .ribbon-tabs {
    gap: 0;
    width: 100%;
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
    width: 100%;
    min-width: 100%;
    box-sizing: border-box;
    gap: 2px;
    padding: 6px 8px 4px;
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
  .color-tool {
    position: relative;
    gap: 0;
    padding-block: 2px 1px;
  }
  .font-color-glyph {
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    color: var(--headerbar-fg);
  }
  .color-tool-bar {
    display: block;
    width: 16px;
    height: 3px;
    border-radius: 1px;
    margin-block-start: 1px;
    border: 1px solid color-mix(in srgb, var(--toolbar-control-border) 80%, transparent);
  }
  .color-picker-popup {
    gap: 8px;
    padding: 8px;
    min-width: 168px;
  }
  .color-picker-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--fg);
    cursor: default;
    user-select: none;
  }
  .color-picker-action {
    box-sizing: border-box;
    width: 100%;
    min-height: 28px;
    padding: 4px 8px;
    border: 1px solid var(--toolbar-control-border);
    border-radius: 6px;
    background: var(--toolbar-control-bg);
    color: var(--fg);
    font: inherit;
    font-size: 11px;
    text-align: start;
    cursor: default;
  }
  .color-picker-action:hover {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 28px);
    gap: 4px;
  }
  .color-cell {
    width: 28px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--toolbar-control-border);
    border-radius: 2px;
    cursor: default;
  }
  .color-cell:hover {
    outline: 2px solid var(--icon-primary);
    outline-offset: 1px;
  }
  .color-cell.selected {
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
  .ribbon-btn.color-tool:hover:not(:disabled) .font-color-glyph {
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

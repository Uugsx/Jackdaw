<FileDropTarget
  on:add-files={(event) => catchErrors(() => onFilesDrop(event))}
  on:inline-files={(event) => catchErrors(() => onFileInlineDrop(event))}
  allowInline={true}>
  <vbox flex class="mail-composer-window" class:floating on:keydown={onComposerKeydown}>
    <vbox class="compose-header">
      <hbox class="compose-top-row">
        <IdentitySelector bind:selectedIdentity={fromIdentity}
          bind:fromAddress={mail.from.emailAddress}
          bind:fromName={mail.from.name}
          compact />
        <EncryptionButtons {mail} identity={fromIdentity} />
        <hbox flex class="spacer" />
        {#if appGlobal.isMobile}
          <CloseButton {mail} on:close={onClose} />
        {:else if !floating}
          <hbox class="header-actions">
            <RoundButton
              classes="plain toolbar-chrome"
              label={$t`Save draft`}
              icon={SaveIcon}
              iconSize="16px"
              padding="6px"
              onClick={onSaveDraft}
              />
            <CloseButton {mail} chrome on:close={onClose} />
          </hbox>
        {/if}
      </hbox>

      <grid class="recipients">
        <hbox class="label-cell">
          <span class="label">{$t`To`}</span>
        </hbox>
        <hbox flex class="to-row">
          <MailAutocomplete bind:this={toAutocomplete} addresses={mail.to} placeholder={$t`Add recipient`} tabindex={1} autofocus={mail.to.isEmpty && !floating}>
            <svelte:fragment slot="person-popup-buttons" let:person>
              <Button plain label={$t`CC`} onClick={() => onMoveToCC(person)} />
              <Button plain label={$t`BCC`} onClick={() => onMoveToBCC(person)} />
            </svelte:fragment>
          </MailAutocomplete>
          <RoundButton
            classes="plain toolbar-chrome"
            label={$t`Check names`}
            shortCutInfo="Alt+K"
            icon={UserCheckIcon}
            iconSize="16px"
            padding="6px"
            onClick={() => catchErrors(onCheckNames)} />
          <hbox class="cc buttons">
            <Button
              label={$t`Cc`}
              onClick={() => {showCCForce = !showCCForce}}
              selected={showCC}
              />
            <Button
              label={$t`Bcc`}
              onClick={() => {showBCCForce = !showBCCForce}}
              selected={showBCC}
              />
          </hbox>
        </hbox>
        {#if showCC}
          <hbox class="label-cell"><span class="label">{$t`Cc`}</span></hbox>
          <MailAutocomplete bind:this={ccAutocomplete} addresses={mail.cc} placeholder={$t`Add CC recipient`} tabindex={1}>
            <svelte:fragment slot="person-popup-buttons" let:person={person}>
              <Button plain label={$t`To`} onClick={() => onMoveToTo(person)} />
              <Button plain label={$t`BCC`} onClick={() => onMoveToBCC(person)} />
            </svelte:fragment>
          </MailAutocomplete>
        {/if}
        {#if showBCC}
          <hbox class="label-cell"><span class="label">{$t`Bcc`}</span></hbox>
          <MailAutocomplete bind:this={bccAutocomplete} addresses={mail.bcc} placeholder={$t`Add BCC recipient`} tabindex={1}>
            <svelte:fragment slot="person-popup-buttons" let:person>
              <Button plain label={$t`To`} onClick={() => onMoveToTo(person)} />
              <Button plain label={$t`CC`} onClick={() => onMoveToCC(person)} />
            </svelte:fragment>
          </MailAutocomplete>
        {/if}
      </grid>

      <hbox class="subject-row">
        <span class="label">{$t`Subject`}</span>
        <input type="text" bind:value={mail.subject} tabindex={1} placeholder={$t`Subject`} class="font-normal" />
      </hbox>
    </vbox>
    {#if $mail.shouldEncrypt}
      <EncryptionDetails {mail} identity={fromIdentity} bind:encryptionError />
    {/if}
    <hbox bind:this={smlAddAnchor} class="ribbon-anchor">
      <ComposeRibbon
        {editor}
        bind:openLinkDialog
      sendDisabledTooltip={sendDisabledTooltip}
      {sending}
      importanceLevel={mail.appportanceLevel}
      requestReadReceipt={mail.requestReadReceipt}
      requestDeliveryReceipt={mail.requestDeliveryReceipt}
      isFlagged={mail.isStarred}
      {showEmojis}
      spellcheckOn={$spellcheckEnabled.value}
      {editorZoom}
      hasSML={!!$mail.sml}
      on:send={() => catchErrors(onSend)}
      on:addAttachment={() => catchErrors(onAddAttachment)}
      on:insertSignature={insertSignature}
      on:toggleHighImportance={toggleHighImportance}
      on:toggleLowImportance={toggleLowImportance}
      on:toggleReadReceipt={() => mail.requestReadReceipt = !mail.requestReadReceipt}
      on:toggleDeliveryReceipt={() => mail.requestDeliveryReceipt = !mail.requestDeliveryReceipt}
      on:toggleFlag={() => mail.isStarred = !mail.isStarred}
      on:saveDraft={() => catchErrors(onSaveDraft)}
      on:toggleEmojis={() => showEmojis = !showEmojis}
      on:toggleSpellcheck={() => spellcheckEnabled.value = !spellcheckEnabled.value}
      on:setZoom={event => editorZoom = event.detail}
      on:openActions={() => showSMLAdd = true} />
    </hbox>
    {#if loading}
      <Spinner size="64px" />
    {/if}
    <hbox flex class="editor-and-attachments">
      {#if showEmojis}
        <vbox class="emojis">
          <GraphicSelector
            on:select={onEmoji}
            on:backspace={() => catchErrors(onEmojiBackspace)}
            bind:isOpen={showEmojis}
            />
        </vbox>
      {/if}
      <vbox flex class="editor-wrapper">
        <Paper>
          <Scroll visibleScrollbars={floating} allowHorizontalOverflow={floating}>
            <SMLComposer {mail} />
            <vbox class="editor" spellcheck={$spellcheckEnabled.value}
              style:zoom={editorZoom / 100}>
              <!-- The html in the mail passed in MUST already be sanitized HTML.
              Using `rawHTMLDangerous` avoids that we're sanitizing on every keypress. -->
              <HTMLEditor bind:html={mail.rawHTMLDangerous} bind:editor tabindex={1}
                extraExtensions={composeEditorExtensions} />
            </vbox>
          </Scroll>
        </Paper>
      </vbox>
      {#if showAttachments}
        <vbox class="attachments">
          <AttachmentsPane message={mail} />
        </vbox>
      {/if}
    </hbox>
  </vbox>
</FileDropTarget>
{#if smlAddAnchor}
  <Popup
    bind:popupOpen={showSMLAdd}
    popupAnchor={smlAddAnchor}
    boundaryElSel=".mail-composer-window"
    placement="bottom"
    autoClose>
    <vbox class="sml-add-dialog">
      <SMLAddKinds bind:sml={mail.sml} identity={fromIdentity}
        on:close={() => showSMLAdd = false} />
    </vbox>
  </Popup>
{/if}
{#if $appGlobal.isMobile}
  <ComposerBarM message={mail} />
{/if}

<FileSelector bind:this={fileSelector} />

<script lang="ts">
  import type { EMail, MailImportanceLevel } from "../../../logic/Mail/EMail";
  import { PersonUID } from "../../../logic/Abstract/PersonUID";
  import { addFilesAsAttachments } from "../../../logic/Abstract/Attachment";
  import { insertImage } from "../../Shared/Editor/InsertImage";
  import { MailIdentity } from "../../../logic/Mail/MailIdentity";
  import { WriteMailJackdawApp, mailApp } from "../MailJackdawApp";
  import { SpecialFolder } from "../../../logic/Mail/Folder";
  import { getLocalStorage } from "../../Util/LocalStorage";
  import { goBack } from "../../AppsBar/selectedApp";
  import { appGlobal } from "../../../logic/app";
  import { UserError, assert } from "../../../logic/util/util";
  import { backgroundError, catchErrors, showUserError } from "../../Util/error";
  import CloseButton from "./CloseButton.svelte";
  import MailAutocomplete from "./MailAutocomplete.svelte";
  import AttachmentsPane from "./Attachments/AttachmentsPane.svelte";
  import FileSelector from "./Attachments/FileSelector.svelte";
  import FileDropTarget from "./Attachments/FileDropTarget.svelte";
  import HTMLEditor from "../../Shared/Editor/HTMLEditor.svelte";
  import { composeEditorExtensions, composeDefaultFontFamily, composeDefaultFontSize, fontSizeToCSS } from "../../Shared/Editor/composeEditorExtensions";
  import { resolveComposeRecipients } from "../../../logic/Mail/composeResolveRecipients";
  import { closeFloatingCompose } from "./composeFloating";
  import { focusComposeTypingArea } from "./composeCursor";
  import UserCheckIcon from "lucide-svelte/icons/user-check";
  import { createEventDispatcher } from "svelte";
  import ComposeRibbon from "./ComposeRibbon.svelte";
  import IdentitySelector from "./IdentitySelector.svelte";
  import EncryptionButtons from "./EncryptionButtons.svelte";
  import EncryptionDetails from "./EncryptionDetails.svelte";
  import GraphicSelector from "../../Chat/Emoji/GraphicSelector.svelte";
  import SMLComposer from "./SMLComposer.svelte";
  import SMLAddKinds from "../SML/SMLAddKinds.svelte";
  import ComposerBarM from "./ComposerBarM.svelte";
  import Paper from "../../Shared/Paper.svelte";
  import Spinner from "../../Shared/Spinner.svelte";
  import Popup from "../../Shared/Popup.svelte";
  import RoundButton from "../../Shared/RoundButton.svelte";
  import Button from "../../Shared/Button.svelte";
  import Scroll from "../../Shared/Scroll.svelte";
  import SaveIcon from "lucide-svelte/icons/save";
  import { t, gt } from "../../../l10n/l10n";
  import { tick } from "svelte";
  import type { Editor } from '@tiptap/core';

  export let mail: EMail;
  export let floating = false;

  const dispatchEvent = createEventDispatcher<{ close: void }>();

  let editor: Editor;
  $: to = mail.to;
  let fromIdentity: MailIdentity;
  let toAutocomplete: MailAutocomplete;
  let ccAutocomplete: MailAutocomplete;
  let bccAutocomplete: MailAutocomplete;
  let spellcheckEnabled = getLocalStorage("mail.send.spellcheck.enabled", false);
  let editorZoom = 100;
  let encryptionError: string | null = null;

  // HACK to reload the HTMLEditor to force it to load the new text
  // See <https://github.com/ueberdosis/tiptap/issues/4918>
  let lastMail = null;
  $: differentMailLoaded(mail);
  function differentMailLoaded(_dummy: any) {
    if (closing) {
      return;
    }
    if (mail == lastMail || !mail) {
      return;
    }
    lastMail = mail;

    fromIdentity = mail.identity
      ?? mail.folder?.account.identities.first
      ?? appGlobal.emailAccounts.first?.identities.first;
    assert(fromIdentity, "Composer: Need identity or account for email");
    showCCForce = mail.cc.hasItems;
    showBCCForce = mail.bcc.hasItems;
    // setAuthor() called

    if (mail.from?.emailAddress) {
      let recipients = [mail.from, ...mail.to.contents, ...mail.cc.contents, ...mail.bcc.contents];
      checkInvalidRecipients(recipients);
    }

    loadText()
      .catch(backgroundError);
  }

  let loading = false;
  async function loadText() {
    mail.identity = fromIdentity ?? mail.identity;
    if (!mail.hasHTML) {
      // New empty message: inject signature into the raw body for the editor
      mail.compose.applySignature();
      await ensureEditorContent();
      return;
    }
    loading = true;
    await mail.loadBody();
    loading = false;
    // Drafts already contain signature; replies/forwards need it injected
    if (!mail.isDraft) {
      mail.compose.applySignature();
    } else if (fromIdentity?.signatureHTML && !hasSignatureFooter(mail.rawHTMLDangerous)) {
      mail.compose.applySignature();
    }
    await ensureEditorContent();
  }

  function hasSignatureFooter(html: string | null | undefined): boolean {
    // Ignore footers inside quoted originals; our signature is top-level
    let top = (html ?? "").replace(/<blockquote\b[\s\S]*?<\/blockquote>/gi, "");
    return /<footer\b[^>]*>/i.test(top);
  }

  async function ensureEditorContent() {
    if (!editor) {
      await tick();
    }
    if (!editor) {
      return;
    }
    // Use raw HTML so DOMPurify WHOLE_DOCUMENT wrapping does not break TipTap
    editor.commands.setContent(mail.rawHTMLDangerous || "<p></p>");
    applyDefaultComposeFormatting();
    await tick();
    setCursorDefault();
  }

  function applyDefaultComposeFormatting() {
    if (!editor || mail.hasHTML || mail.isDraft) {
      return;
    }
    let html = editor.getHTML();
    if (html.replace(/<[^>]+>/g, "").trim()) {
      return;
    }
    editor.chain().focus()
      .selectAll()
      .setFontFamily(composeDefaultFontFamily)
      .setFontSize(fontSizeToCSS(composeDefaultFontSize))
      .run();
  }

  async function commitPendingRecipients() {
    await toAutocomplete?.commitPendingInput();
    if (showCC) {
      await ccAutocomplete?.commitPendingInput();
    }
    if (showBCC) {
      await bccAutocomplete?.commitPendingInput();
    }
  }

  async function onCheckNames() {
    await commitPendingRecipients();
    await resolveComposeRecipients(mail);
  }

  function insertSignature() {
    if (!editor) {
      return;
    }
    mail.rawHTMLDangerous = editor.getHTML();
    mail.compose.applySignature();
    editor.commands.setContent(mail.rawHTMLDangerous || "<p></p>");
    setCursorDefault();
  }

  function toggleHighImportance() {
    mail.appportanceLevel = mail.appportanceLevel === "high" ? "normal" : "high";
  }

  function toggleLowImportance() {
    mail.appportanceLevel = mail.appportanceLevel === "low" ? "normal" : "low";
  }

  function isEditorTarget(target: EventTarget | null): boolean {
    return target instanceof Element &&
      !!target.closest(".html-editor, .ProseMirror, .tiptap");
  }

  function onComposerKeydown(event: KeyboardEvent) {
    if (event.altKey && !event.metaKey && !event.ctrlKey &&
        event.key.toLowerCase() === "k" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      catchErrors(onCheckNames);
      return;
    }
    let mod = event.ctrlKey || event.metaKey;
    if (mod && event.key === "Enter" && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      catchErrors(onSend);
      return;
    }
    if (mod && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      event.stopPropagation();
      catchErrors(onSaveDraft);
      return;
    }
    if (!editor || !isEditorTarget(event.target)) {
      return;
    }
    if (!mod || event.altKey) {
      return;
    }
    let key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      editor.chain().focus().toggleBold().run();
    } else if (key === "i") {
      event.preventDefault();
      editor.chain().focus().toggleItalic().run();
    } else if (key === "u") {
      event.preventDefault();
      editor.chain().focus().toggleUnderline().run();
    } else if (key === "k") {
      event.preventDefault();
      openLinkDialog = true;
    }
  }

  let openLinkDialog = false;

  function setCursorDefault() {
    if (!editor) {
      return;
    }
    if (mail.to.isEmpty) {
      editor.commands.focus("start");
      return;
    }
    focusComposeTypingArea(editor);
  }

  $: fromIdentity && setAuthor()
  function setAuthor() {
    let identityChanged = mail.identity != fromIdentity;
    mail.identity = fromIdentity;
    mail.folder ??= fromIdentity.account.getSpecialFolder(SpecialFolder.Sent)
      ?? fromIdentity.account.inbox;
    if (!fromIdentity.isCatchAll || !mail.from?.emailAddress || mail.from.emailAddress.includes("*")) {
      mail.from = fromIdentity.asPersonUID();
    }
    // When user switches identity in composer, refresh signature footer
    if (identityChanged && editor && !loading) {
      mail.rawHTMLDangerous = editor.getHTML();
      mail.compose.applySignature();
      editor.commands.setContent(mail.rawHTMLDangerous || "<p></p>");
      setCursorDefault();
    }
  }

  function checkInvalidRecipients(recipients: PersonUID[]) {
    const kNoReplyRegExp = /no[\-_t]*reply@|invalid$/;
    let invalidTo = recipients.find(person =>
      !person.emailAddress || kNoReplyRegExp.test(person.emailAddress));
    if (invalidTo) {
      let notification = showUserError(new UserError(gt`The recipient ${invalidTo.emailAddress} does not accept email`));
      doOnClose.push(() => notification.remove());
    }
  }

  function onMoveToCC(person: PersonUID) {
    mail.bcc.remove(person);
    mail.to.remove(person);
    mail.cc.add(person);
    showCCForce = true;
  }
  function onMoveToBCC(person: PersonUID) {
    mail.cc.remove(person);
    mail.to.remove(person);
    mail.bcc.add(person);
    showBCCForce = true;
  }
  function onMoveToTo(person: PersonUID) {
    mail.cc.remove(person);
    mail.bcc.remove(person);
    mail.to.add(person);
  }

  let fileSelector: FileSelector;
  async function onAddAttachment() {
    let file = await fileSelector.selectFile();
    if (!file) {
      return;
    }
    addFilesAsAttachments(mail, [file]);
  }

  function onFilesDrop(event: CustomEvent) {
    addFilesAsAttachments(mail, event.detail.files as File[]);
  }

  async function onFileInlineDrop(event: CustomEvent) {
    let files = event.detail.files as File[];
    for (let file of files) {
      await insertImage(editor, file, mail);
    }
  }

  let showEmojis = false;

  function onEmoji(ev: CustomEvent) {
    let emoji = ev.detail.emoji;
    if (emoji) {
      editor.commands.insertContent(emoji);
    }
  }

  function onEmojiBackspace() {
    editor.view.focus();
    document.execCommand("delete");
  }

  $: sendDisabledTooltip =
    !mail.subject ? $t`Please enter a subject` :
    $to.isEmpty ? $t`Please add some recipients` :
    encryptionError ??
    null;

  let sending = false;
  async function onSend() {
    if (sending) {
      return;
    }
    sending = true;
    try {
      if (editor) {
        mail.rawHTMLDangerous = editor.getHTML();
      }
      await commitPendingRecipients();
      await resolveComposeRecipients(mail);
      await mail.compose.send();
      onClose();
    } finally {
      sending = false;
    }
  }

  async function onSaveDraft() {
    if (editor) {
      mail.rawHTMLDangerous = editor.getHTML();
    }
    await mail.compose.saveAsDraft();
  }

  /** Sync editor HTML before save/close from floating window chrome. */
  export function syncEditorContent() {
    if (editor) {
      mail.rawHTMLDangerous = editor.getHTML();
    }
  }

  export async function saveDraft() {
    await onSaveDraft();
  }

  let closing = false;
  let doOnClose: (() => void)[] = [];
  function onClose() {
    if (floating) {
      closeFloatingCompose(mail);
      dispatchEvent("close");
      return;
    }
    closing = true;
    for (let func of doOnClose) {
      func();
    }
    doOnClose = [];

    let me = mailApp.subApps.find(app => app instanceof WriteMailJackdawApp && app.windowParams.mail == mail);
    mailApp.subApps.remove(me);
    goBack();
  }

  let showSMLAdd = false;
  let smlAddAnchor: HTMLElement;
  let showCCForce = false;
  let showBCCForce = false;
  let showAttachmentsForce = false;
  $: ccList = mail.cc;
  $: bccList = mail.bcc;
  $: attachmentsList = mail.attachments;
  $: hasCC = $ccList.hasItems;
  $: hasBCC = $bccList.hasItems;
  $: hasAttachments = $attachmentsList.hasItems;
  $: showCC = showCCForce;
  $: showBCC = showBCCForce;
  $: showAttachments = showAttachmentsForce || hasAttachments;
</script>

<style>
  .mail-composer-window {
    padding: 0 16px 12px;
    background-color: var(--main-bg, var(--bg));
    color: var(--main-fg, var(--fg));
  }
  .mail-composer-window.floating {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 12px 8px;
    min-height: 0;
    flex: 1 1 0;
    height: 100%;
    box-sizing: border-box;
  }
  .mail-composer-window.floating .ribbon-anchor {
    flex-shrink: 0;
    min-width: 0;
    overflow: visible;
  }
  .mail-composer-window.floating .editor-and-attachments {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
  .mail-composer-window.floating .editor-wrapper {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .mail-composer-window.floating .editor-wrapper :global(.paper) {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .mail-composer-window.floating .editor-wrapper :global(.scroll) {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
  }
  .mail-composer-window.floating .editor {
    max-width: none;
    width: max-content;
    min-width: 100%;
  }
  .compose-header {
    gap: 2px;
    padding-block-end: 4px;
    border-block-end: 1px solid var(--border);
  }
  .compose-top-row {
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding-block: 2px 4px;
  }
  .header-actions {
    gap: 4px;
    align-items: center;
  }
  .header-actions :global(.toolbar-chrome) {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: color-mix(in srgb, var(--main-fg) 84%, transparent);
  }
  .header-actions :global(.toolbar-chrome:hover:not(.disabled)) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .header-actions :global(.button-menu > .toolbar-chrome) {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: color-mix(in srgb, var(--main-fg) 84%, transparent);
  }
  .header-actions :global(.button-menu > .toolbar-chrome:hover:not(.disabled)) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .to-row :global(.toolbar-chrome) {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    flex-shrink: 0;
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    background: var(--input-bg);
    color: color-mix(in srgb, var(--main-fg) 84%, transparent);
  }
  .to-row :global(.toolbar-chrome:hover:not(.disabled)) {
    background: var(--hover-bg);
    color: var(--hover-fg);
  }
  .cc.buttons {
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .cc.buttons > :global(button) {
    border: none;
    margin: 0;
    padding-inline: 6px;
    min-height: 28px;
    font-size: 11px;
  }
  .cc.buttons > :global(button:not(.selected)) {
    background-color: transparent;
    color: color-mix(in srgb, var(--main-fg) 72%, transparent);
  }
  .cc.buttons > :global(button.selected) {
    background-color: color-mix(in srgb, var(--icon-primary) 12%, transparent);
    color: var(--icon-primary);
  }
  grid.recipients {
    grid-template-columns: 3.25rem 1fr;
    max-width: none;
    margin-block: 2px 0;
  }
  .to-row {
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .to-row :global(.persons-autocomplete) {
    flex: 1 1 auto;
    min-width: 0;
  }
  .subject-row {
    display: grid;
    grid-template-columns: 3.25rem 1fr;
    align-items: center;
    gap: 8px;
    max-width: none;
    margin-block: 2px 0;
    padding-block: 2px 4px;
  }
  .subject-row input {
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    padding: 4px 0;
  }
  .label {
    color: var(--input-placeholder);
    font-size: 11px;
  }
  .label-cell,
  .subject-row .label {
    align-items: center;
    padding-block-start: 4px;
  }
  .editor {
    margin: 12px 12px;
    max-width: 50em;
    flex-shrink: 0;
  }
  .editor-wrapper {
    flex: 3 0 0;
    margin-block-start: 4px;
  }
  .composer-subject {
    max-width: 900px;
    margin-block-start: 4px;
    margin-block-end: 4px;
  }
  .ribbon-anchor {
    width: 100%;
    min-width: 0;
    align-self: stretch;
  }
  .ribbon-anchor :global(.compose-ribbon) {
    flex: 1 1 auto;
  }
  .editor-wrapper :global(.paper) {
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: none;
  }
  .attachments {
    width: 300px;
    margin-inline-end: -12px;
  }
  .subject {
    margin-inline: 2px 24px;
    font-weight: bold;
  }
  .subject input {
    width: 100%;
    padding-block: 8px;
    border: none;
    border-block-end: 1px solid var(--border);
    background-color: transparent;
    color: var(--main-fg);
    font-size: 16px;
  }
  .buttons :global(.send.disabled) {
    opacity: 30%;
  }
  .emojis {
    width: 400px;
  }
  .sml-add-dialog {
    padding: 16px 24px;
    background-color: var(--leftbar-bg);
    color: var(--leftbar-fg);
    z-index: 1000;
  }
</style>

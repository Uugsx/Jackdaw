<!-- Draggable compose window (desktop, when presentation = window). -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<vbox class="compose-float"
  class:minimized
  style="left: {entry.x}px; top: {entry.y}px; width: {entry.width}px; height: {minimized ? 'auto' : entry.height + 'px'}; z-index: {entry.zIndex}"
  on:pointerdown={() => {
    focusFloatingCompose(entry.mail);
    focusAppWindow();
  }}>
  <hbox class="float-chrome"
    on:pointerdown={onDragStart}>
    <hbox class="float-qat">
      <button type="button" class="qat-btn" title={$t`Save draft`}
        on:click|stopPropagation={onSaveDraft}>
        <SaveIcon size="16px" />
      </button>
      <CloseButton
        mail={entry.mail}
        chrome
        compact
        beforeSave={syncBeforeSave}
        on:close={onCloseRequest} />
    </hbox>
    <hbox flex class="float-title font-smallest">
      {entryTitle}
    </hbox>
    <hbox class="float-actions">
      <button type="button" class="qat-btn" title={minimized ? $t`Restore` : $t`Minimize`}
        on:click|stopPropagation={() => updateFloatingCompose(entry.id, { minimized: !minimized })}>
        {#if minimized}
          <Maximize2Icon size="16px" />
        {:else}
          <MinusIcon size="16px" />
        {/if}
      </button>
    </hbox>
  </hbox>
  {#if !minimized}
    <vbox flex class="float-body">
      <MailComposer bind:this={composer} mail={entry.mail} floating on:close={() => onCloseRequest()} />
    </vbox>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle" on:pointerdown={onResizeStart} aria-hidden="true" />
  {/if}
</vbox>

<svelte:window
  on:pointermove={onWindowPointerMove}
  on:pointerup={onWindowPointerUp}
  on:pointercancel={onWindowPointerUp}
  />

<script lang="ts">
  import MailComposer from "./MailComposer.svelte";
  import CloseButton from "./CloseButton.svelte";
  import {
    closeFloatingCompose,
    focusFloatingCompose,
    updateFloatingCompose,
    type FloatingComposeEntry,
  } from "./composeFloating";
  import MinusIcon from "lucide-svelte/icons/minus";
  import Maximize2Icon from "lucide-svelte/icons/maximize-2";
  import SaveIcon from "lucide-svelte/icons/save";
  import { t } from "../../../l10n/l10n";
  import { bringAppToFront } from "../../AppsBar/selectedApp";
  import { catchErrors } from "../../Util/error";

  export let entry: FloatingComposeEntry;

  const MIN_WIDTH = 520;
  const MIN_HEIGHT = 360;
  const VIEWPORT_MARGIN = 12;

  let composer: MailComposer;

  $: minimized = entry.minimized;
  $: fromLabel = entry.mail.from?.emailAddress ?? entry.mail.identity?.emailAddress ?? "";
  $: entryTitle = [
    entry.mail.subject?.trim() || $t`Compose`,
    fromLabel,
  ].filter(Boolean).join(" • ");

  function syncBeforeSave() {
    composer?.syncEditorContent();
  }

  function onSaveDraft() {
    catchErrors(async () => {
      await composer?.saveDraft();
    });
  }

  function onCloseRequest() {
    closeFloatingCompose(entry.mail);
  }

  function focusAppWindow() {
    bringAppToFront();
  }

  type InteractionMode = "drag" | "resize";
  let interactionMode: InteractionMode | null = null;
  let activePointerId: number | null = null;
  let captureEl: HTMLElement | null = null;
  let dragOrigin = { x: 0, y: 0, left: 0, top: 0 };
  let resizeOrigin = { x: 0, y: 0, width: 0, height: 0 };

  function beginInteraction(event: PointerEvent, mode: InteractionMode) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    focusFloatingCompose(entry.mail);
    interactionMode = mode;
    activePointerId = event.pointerId;
    captureEl = event.currentTarget as HTMLElement;
    captureEl.setPointerCapture(event.pointerId);
    document.body.classList.add(mode === "resize" ? "compose-resize-dragging" : "compose-move-dragging");
  }

  function endInteraction(event: PointerEvent) {
    if (interactionMode === null) {
      return;
    }
    if (activePointerId !== null && event.pointerId !== activePointerId) {
      return;
    }
    interactionMode = null;
    activePointerId = null;
    document.body.classList.remove("compose-resize-dragging", "compose-move-dragging");
    if (captureEl?.hasPointerCapture?.(event.pointerId)) {
      captureEl.releasePointerCapture(event.pointerId);
    }
    captureEl = null;
  }

  function onWindowPointerMove(event: PointerEvent) {
    if (interactionMode === null || activePointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    if (interactionMode === "drag") {
      let next = clampLayout({
        x: dragOrigin.left + event.clientX - dragOrigin.x,
        y: dragOrigin.top + event.clientY - dragOrigin.y,
        width: entry.width,
        height: entry.height,
        minimized: entry.minimized,
      });
      updateFloatingCompose(entry.id, next);
      return;
    }
    let maxWidth = window.innerWidth - entry.x - VIEWPORT_MARGIN;
    let maxHeight = window.innerHeight - entry.y - VIEWPORT_MARGIN;
    updateFloatingCompose(entry.id, {
      width: Math.min(maxWidth, Math.max(MIN_WIDTH, resizeOrigin.width + event.clientX - resizeOrigin.x)),
      height: Math.min(maxHeight, Math.max(MIN_HEIGHT, resizeOrigin.height + event.clientY - resizeOrigin.y)),
    });
  }

  function onWindowPointerUp(event: PointerEvent) {
    endInteraction(event);
  }

  function onDragStart(event: PointerEvent) {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    dragOrigin = { x: event.clientX, y: event.clientY, left: entry.x, top: entry.y };
    beginInteraction(event, "drag");
  }

  function onResizeStart(event: PointerEvent) {
    resizeOrigin = {
      x: event.clientX,
      y: event.clientY,
      width: entry.width,
      height: entry.height,
    };
    beginInteraction(event, "resize");
  }

  function clampLayout(layout: {
    x: number;
    y: number;
    width: number;
    height: number;
    minimized: boolean;
  }) {
    let width = Math.max(MIN_WIDTH, Math.min(layout.width, window.innerWidth - VIEWPORT_MARGIN * 2));
    let height = Math.max(MIN_HEIGHT, Math.min(layout.height, window.innerHeight - VIEWPORT_MARGIN * 2));
    let maxX = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    let maxY = Math.max(VIEWPORT_MARGIN, window.innerHeight - (layout.minimized ? 36 : height) - VIEWPORT_MARGIN);
    return {
      width,
      height,
      x: Math.min(maxX, Math.max(VIEWPORT_MARGIN, layout.x)),
      y: Math.min(maxY, Math.max(VIEWPORT_MARGIN, layout.y)),
    };
  }
</script>

<style>
  .compose-float {
    position: fixed;
    display: flex;
    flex-direction: column;
    min-width: 520px;
    min-height: 360px;
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--main-bg, var(--bg));
    color: var(--main-fg, var(--fg));
    box-shadow: 0 10px 28px rgba(var(--shadow-color), 0.16);
    overflow: hidden;
  }
  .compose-float.minimized {
    min-height: 0;
    height: auto;
  }
  .float-chrome {
    align-items: center;
    gap: 10px;
    padding: 4px 8px 4px 10px;
    min-height: 36px;
    border-block-end: 1px solid var(--border);
    background: var(--main-bg, var(--bg));
    color: var(--main-fg, var(--fg));
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
    touch-action: none;
  }
  .float-chrome:active {
    cursor: grabbing;
  }
  .float-qat {
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    padding-inline-end: 8px;
    border-inline-end: 1px solid var(--border);
  }
  .qat-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    background: transparent;
    color: color-mix(in srgb, var(--main-fg) 78%, transparent);
    cursor: default;
  }
  .qat-btn:hover {
    background: var(--hover-bg);
    color: var(--hover-fg);
    border-color: var(--border);
  }
  .float-qat :global(.toolbar-chrome.qat) {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
    border: 1px solid transparent;
    background: transparent;
    color: color-mix(in srgb, var(--main-fg) 78%, transparent);
  }
  .float-qat :global(.toolbar-chrome.qat:hover:not(.disabled)) {
    background: var(--hover-bg);
    color: var(--hover-fg);
    border-color: var(--border);
  }
  .float-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.82;
    justify-content: center;
    text-align: center;
  }
  .float-actions {
    gap: 2px;
    flex-shrink: 0;
    padding-inline-start: 8px;
    border-inline-start: 1px solid var(--border);
  }
  .float-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .float-body :global(.mail-composer-window) {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0 12px 8px;
    box-sizing: border-box;
  }
  .resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 18px;
    height: 18px;
    cursor: nwse-resize;
    touch-action: none;
    background:
      linear-gradient(135deg, transparent 50%, color-mix(in srgb, var(--main-fg) 28%, transparent) 50%);
    opacity: 0.65;
  }
  .resize-handle:hover {
    opacity: 1;
  }
  :global(body.compose-resize-dragging) {
    user-select: none;
    cursor: nwse-resize;
  }
  :global(body.compose-move-dragging) {
    user-select: none;
    cursor: grabbing;
  }
  :global(body.compose-resize-dragging iframe),
  :global(body.compose-resize-dragging webview),
  :global(body.compose-move-dragging iframe),
  :global(body.compose-move-dragging webview) {
    pointer-events: none;
  }
</style>

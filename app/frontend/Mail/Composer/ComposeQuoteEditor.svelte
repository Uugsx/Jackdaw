<!-- Editable quoted thread — native contenteditable preserves original HTML; not TipTap. -->
<div
  class="compose-quote-html"
  contenteditable="true"
  spellcheck={false}
  tabindex={0}
  role="textbox"
  aria-multiline="true"
  use:quoteEditable={{ html, onChange }}
  on:dblclick={onDoubleClick}
  on:touchend={onTouchEnd}
  on:keydown={onKeyDown}
/>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { openMailImageFromElement } from "../Message/openMailImage";
  import { catchErrors, showUserError } from "../../Util/error";

  /** Sanitized HTML (original message body or forward quote). */
  export let html: string;

  const dispatch = createEventDispatcher<{ change: string }>();

  function onChange(bodyHtml: string) {
    dispatch("change", bodyHtml);
  }

  function openImage(img: HTMLImageElement) {
    catchErrors(async () => {
      try {
        await openMailImageFromElement(img);
      } catch (ex) {
        showUserError(ex);
      }
    });
  }

  function onDoubleClick(event: MouseEvent) {
    let img = (event.target as Element | null)?.closest("img");
    if (!img || !(img instanceof HTMLImageElement)) {
      return;
    }
    event.preventDefault();
    openImage(img);
  }

  let lastTouchEnd = 0;
  function onTouchEnd(event: TouchEvent) {
    let touch = event.changedTouches[0];
    if (!touch) {
      return;
    }
    let now = Date.now();
    if (now - lastTouchEnd > 350) {
      lastTouchEnd = now;
      return;
    }
    lastTouchEnd = 0;
    let img = (document.elementFromPoint(touch.clientX, touch.clientY) as Element | null)?.closest("img");
    if (!img || !(img instanceof HTMLImageElement)) {
      return;
    }
    event.preventDefault();
    openImage(img);
  }

  /** Keep Tab in the quote; do not focus-trap the compose window. */
  function onKeyDown(event: KeyboardEvent) {
    if (event.key == "Tab") {
      event.stopPropagation();
    }
  }

  type QuoteEditableParams = {
    html: string;
    onChange: (html: string) => void;
  };

  function quoteEditable(node: HTMLElement, params: QuoteEditableParams) {
    let lastHtml = "";
    let syncing = false;

    function setHtml(nextHtml: string) {
      syncing = true;
      node.innerHTML = nextHtml;
      lastHtml = nextHtml;
      syncing = false;
    }

    function onInput() {
      if (syncing) {
        return;
      }
      lastHtml = node.innerHTML;
      params.onChange(lastHtml);
    }

    function update(next: QuoteEditableParams) {
      params = next;
      if (next.html !== lastHtml && !node.contains(document.activeElement)) {
        setHtml(next.html);
      }
    }

    setHtml(params.html);
    node.addEventListener("input", onInput);

    return {
      update,
      destroy() {
        node.removeEventListener("input", onInput);
      },
    };
  }
</script>

<style>
  @import url("../Message/content.css");

  .compose-quote-html {
    margin: 0;
    padding: 0;
    outline: none;
    font-family:
      -apple-system, BlinkMacSystemFont,
      "Segoe UI", system-ui,
      "Helvetica Neue", Helvetica, Arial, sans-serif;
    line-height: 1.45;
    font-size: inherit;
    color: inherit;
    user-select: text;
    cursor: text;
  }
  .compose-quote-html:focus-visible {
    outline: 2px solid var(--focus-ring, var(--accent));
    outline-offset: 2px;
    border-radius: 4px;
  }
  .compose-quote-html :global(p) {
    margin-block: 0;
  }
  .compose-quote-html :global(img) {
    max-width: 100%;
    height: auto;
  }
</style>

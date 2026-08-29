{#if popupOpen}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <vbox class="popup"
    on:close
    on:click={onClickInside}
    on:wheel={onClickInside}
    on:pointerenter={onPointerEnterSurface}
    on:pointerleave={onPointerLeaveSurface}
    bind:this={popupEl}
    use:portalToBody
    use:popupContent={popupOptions}>
    <slot />
  </vbox>
{/if}
<!-- Do not close on wheel: SubMenu flyouts are portaled outside popupEl,
     so mousewheel-as-outside would dismiss the menu while scrolling categories. -->
<svelte:window on:click={onClickOutside} on:contextmenu|capture={onContextMenuOutside} />

<script lang="ts">
  import { createPopperActions } from 'svelte-popperjs';
  import type { Placement } from '@popperjs/core';
  import { onDestroy } from 'svelte';

  /** in/out */
  export let popupOpen: boolean;
  /** Under/above which element the popup window should appear.
   * The popup will not cover this element, but be just above/below it.
   * in */
  export let popupAnchor: HTMLElement;
  /** Where the popup should appear in relation to the anchor.
   * above/below ("top"/"bottom") and left/right ("start"/"end")
   * in */
  export let placement: Placement = "bottom-end";
  /**
   * In which area the popup may appear. Much larger than the anchor.
   * Typically the entire page,  or just a part of it.
   * Should be large enough to contain the entire popup window
   * in any situation, e.g. if the anchor is in the middle of this area.
   * The popup window will be entirely within this area, and
   * be cut off larger.
   * Document element selector, e.g. '.mail-composer-window'
   * in */
  export let boundaryElSel: string;
  export let autoClose: boolean = true;
  /** Close when the pointer leaves the popup, anchor, and any open submenu flyout. */
  export let dismissOnPointerLeave = false;
  export let dismissDelayMs = 350;

  const [popupRef, popupContent, getInstance] = createPopperActions({
    placement: placement,
    strategy: 'fixed',
  });
  const popupOptions = {
    modifiers: [
      {
        name: 'offset',
        options: { offset: [0, 4] },
        preventOverflow: true,
        allow: true,
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
          boundary: document.querySelector(boundaryElSel),
        },
      },
      {
        name: 'hide',
      },
    ],
  };
  let contentObserver: ResizeObserver;
  let leaveTimer: ReturnType<typeof setTimeout> | null = null;
  let anchorLeaveHook: { destroy?(): void } | null = null;

  function clearLeaveTimer() {
    if (leaveTimer) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }
  }

  function isInsideMenuSurface(target: EventTarget | null): boolean {
    if (!(target instanceof Node)) {
      return false;
    }
    if (popupEl?.contains(target)) {
      return true;
    }
    if (popupAnchor instanceof Node && popupAnchor.contains(target)) {
      return true;
    }
    if (target instanceof Element && target.closest(".submenu-flyout")) {
      return true;
    }
    return false;
  }

  function scheduleDismissOnLeave() {
    if (!autoClose || !dismissOnPointerLeave || !popupOpen) {
      return;
    }
    clearLeaveTimer();
    leaveTimer = setTimeout(() => {
      leaveTimer = null;
      popupOpen = false;
    }, dismissDelayMs);
  }

  function onPointerEnterSurface() {
    clearLeaveTimer();
  }

  function onPointerLeaveSurface(event: PointerEvent) {
    if (!isInsideMenuSurface(event.relatedTarget)) {
      scheduleDismissOnLeave();
    }
  }

  function onAnchorPointerEnter() {
    clearLeaveTimer();
  }

  function onAnchorPointerLeave(event: PointerEvent) {
    if (!isInsideMenuSurface(event.relatedTarget)) {
      scheduleDismissOnLeave();
    }
  }

  function isDomAnchor(anchor: unknown): anchor is HTMLElement {
    return anchor instanceof EventTarget &&
      typeof (anchor as HTMLElement).addEventListener === "function";
  }

  function syncAnchorLeaveListener(anchor: unknown, open: boolean) {
    anchorLeaveHook?.destroy?.();
    anchorLeaveHook = null;
    if (!open || !dismissOnPointerLeave || !isDomAnchor(anchor)) {
      return;
    }
    anchor.addEventListener("pointerenter", onAnchorPointerEnter);
    anchor.addEventListener("pointerleave", onAnchorPointerLeave);
    anchorLeaveHook = {
      destroy() {
        anchor.removeEventListener("pointerenter", onAnchorPointerEnter);
        anchor.removeEventListener("pointerleave", onAnchorPointerLeave);
      },
    };
  }

  $: syncAnchorLeaveListener(popupAnchor, popupOpen && dismissOnPointerLeave);

  // popupRef is not yet defined when use: hook in parent is invoked, so do it manually
  let popupHook: { destroy?(); };
  if (popupAnchor) {
    popupHook = popupRef(popupAnchor);
    popupAnchor = null;
  }
  $: popupAnchor && popupRef && (popupHook = popupRef(popupAnchor));
  onDestroy(() => {
    popupHook?.destroy();
    anchorLeaveHook?.destroy?.();
    clearLeaveTimer();
    contentObserver?.disconnect();
  });

  function onClickOutside(event: Event) {
    if (!autoClose || !popupOpen) {
      return;
    }
    if (isDomAnchor(popupAnchor) && event.target instanceof Node && popupAnchor.contains(event.target)) {
      return;
    }
    // Ignore events that originated inside the popup (or were stopped there).
    if (popupEl && event.target instanceof Node && popupEl.contains(event.target)) {
      return;
    }
    // SubMenu flyouts are portaled to document.body — treat them as inside.
    if (event.target instanceof Element && event.target.closest(".submenu-flyout")) {
      return;
    }
    popupOpen = false;
  }

  /** A context menu is not a click, so a previously open popup would remain
   * visible beside the native/context menu. Close it before the new menu is
   * opened; capture is needed because the target handler stops propagation. */
  function onContextMenuOutside(event: Event) {
    if (!autoClose || !popupOpen) {
      return;
    }
    if (popupEl && event.target instanceof Node && popupEl.contains(event.target)) {
      return;
    }
    if (event.target instanceof Element && event.target.closest(".submenu-flyout")) {
      return;
    }
    popupOpen = false;
  }
  function onClickInside(event: Event) {
    if (!autoClose || !popupOpen) {
      return;
    }
    event.stopPropagation();
  }

  // Re-position popup when popup content changes
  let popupEl: HTMLDivElement;
  $: popupEl && createResizeObserver();
  function createResizeObserver() {
    contentObserver?.disconnect();
    contentObserver = new ResizeObserver(async () => {
      let popper = getInstance();
      await popper?.update();
    });
    contentObserver.observe(popupEl);
  }

  /** Popper uses fixed positioning; portaling avoids clipping by glass panels. */
  function portalToBody(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }
</script>

<style>
  .popup {
    position: relative;
    z-index: 10000;
    isolation: isolate;
    background: var(--glass-bg-elevated);
    backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
    color: var(--main-fg, var(--fg));
    padding: 0;
    border-radius: var(--border-radius);
    margin: 5px;
    border: 1px solid var(--glass-border);
    box-shadow:
      var(--glass-highlight),
      0 0 0 1px rgba(var(--shadow-color), 0.06),
      0 12px 28px rgba(var(--shadow-color), 0.22);
    pointer-events: auto;
    overflow: hidden;
  }
</style>

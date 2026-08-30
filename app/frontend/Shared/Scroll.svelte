<vbox class="scroll"
  bind:this={containerE}
  on:mousewheel={onScrollWheel}
  class:hideHorizontalScrollbar
  class:visible-scrollbars={visibleScrollbars}
  class:both-axes={visibleScrollbars && allowHorizontalOverflow}>
  <vbox class="inside" class:allow-horizontal={allowHorizontalOverflow}>
    <slot />
  </vbox>
</vbox>

<script lang="ts">
  export let hideHorizontalScrollbar = false;
  /** Always show styled scrollbars (compose windows on macOS). */
  export let visibleScrollbars = false;
  /** Let content extend wider than the viewport (compose with wide signatures). */
  export let allowHorizontalOverflow = false;

  let containerE: HTMLDivElement;
  export function scrollDown() {
    containerE.scrollTop = containerE.scrollHeight;
  }
  export function scrollTo(y: number) {
    containerE.scrollTop = y;
  }

  function onScrollWheel(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<style>
  .scroll {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    position: relative;
    overflow: auto;
    overflow-wrap: anywhere;
  }
  .scroll.hideHorizontalScrollbar {
    overflow-y: auto;
    overflow-x: hidden;
  }
  .inside {
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
  }
  .inside.allow-horizontal {
    width: max-content;
    min-width: 100%;
  }
  .scroll.visible-scrollbars {
    overflow: auto;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--main-fg) 42%, transparent)
      color-mix(in srgb, var(--main-fg) 10%, var(--main-bg, var(--bg)));
  }
  .scroll.visible-scrollbars.both-axes {
    overflow-x: auto;
    overflow-y: auto;
  }
  .scroll.visible-scrollbars::-webkit-scrollbar {
    width: 10px;
    height: 10px;
    -webkit-appearance: none;
  }
  .scroll.visible-scrollbars::-webkit-scrollbar-track {
    background: color-mix(in srgb, var(--main-fg) 10%, var(--main-bg, var(--bg)));
    border-radius: 5px;
    margin-block: 4px;
  }
  .scroll.visible-scrollbars::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--main-fg) 42%, transparent);
    border-radius: 5px;
    border: 2px solid color-mix(in srgb, var(--main-fg) 10%, var(--main-bg, var(--bg)));
  }
  .scroll.visible-scrollbars::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--main-fg) 58%, transparent);
  }
</style>

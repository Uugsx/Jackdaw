<!-- Tags of a message, in a list row where horizontal space is scarce.
  As long as the full labels fit, they are shown as colored bubbles.
  Once they don't, we switch to the Outlook layout: one color chip per tag,
  followed by the names as a single line that ellipsizes.
  Clipping a bubble mid-letter, which is what happens without this, looks broken. -->
<!-- The font lives on the box we measure from, not on the content, so that
  the text metrics we calculate below are the ones actually used for the tags. -->
<hbox class="message-tags font-smallest" bind:this={boxEl}>
  {#if entries.length}
    <hbox class="content"
      title={namesLine}
      style="--tag-pad: {kTagPaddingInline}px; --tag-gap: {kTagGap}px; --chip-size: {kChipSize}px; --chip-gap: {kChipGap}px; --trailing-gap: {kTrailingGap}px"
      >
      {#if compact}
        <hbox class="chips">
          {#each entries as entry (entry.name)}
            <hbox class="chip" style="--tag-color: {entry.color}" />
          {/each}
        </hbox>
        <span class="names">{namesLine}</span>
      {:else}
        {#each entries as entry (entry.name)}
          <span class="tag" style="--tag-color: {entry.color}">{entry.name}</span>
        {/each}
      {/if}
    </hbox>
  {/if}
</hbox>

<script lang="ts">
  import type { Tag } from "../../../logic/Abstract/Tag";
  import type { Collection } from "svelte-collections";
  import { onDestroy, onMount } from "svelte";

  export let tags: Collection<Tag>;

  /** Geometry of the bubbles, in px. The CSS below reads these as custom
   * properties, so that the width we calculate and the width we render
   * cannot drift apart. */
  const kTagPaddingInline = 6;
  const kTagGap = 4;
  const kChipSize = 9;
  const kChipGap = 2;
  /** Keeps the tags off the buttons that follow them in the row */
  const kTrailingGap = 4;

  let boxEl: HTMLElement;
  /** Width that the tags may occupy in this row, from the layout */
  let availableWidth = 0;
  /** Tag name and color are mutable, e.g. the colors arrive from the server
   * after the list is already on screen. Bumped when any of our tags changes. */
  let tagsEpoch = 0;
  let tagSubscriptions: (() => void)[] = [];

  $: tagList = $tags?.contents ?? [];
  $: subscribeToTags(tagList);
  $: entries = readTags(tagList, tagsEpoch);
  $: namesLine = entries.map(entry => entry.name).join(", ");
  $: neededWidth = fullLabelsWidth(entries, boxEl);
  $: compact = availableWidth > 0 && neededWidth > availableWidth;

  /** @param epoch only a dependency, to re-read after a tag changed */
  function readTags(list: Tag[], epoch: number) {
    return list.map(tag => ({ name: tag.name, color: tag.color }));
  }

  function subscribeToTags(list: Tag[]) {
    for (let unsubscribe of tagSubscriptions) {
      unsubscribe();
    }
    tagSubscriptions = list.map(tag => tag.subscribe(() => tagsEpoch++));
  }
  onDestroy(() => subscribeToTags([]));

  onMount(() => {
    availableWidth = boxEl.clientWidth;
    return observeWidth(boxEl, width => availableWidth = width);
  });

  /** How wide the tags would be as full bubbles. Measured from the text metrics
   * rather than from the DOM, so that we already know it on the first frame and
   * the row doesn't visibly flip from one layout to the other. */
  function fullLabelsWidth(labels: { name: string }[], sample: HTMLElement | undefined): number {
    if (!labels.length || !sample) {
      return 0;
    }
    let total = (labels.length - 1) * kTagGap + kTrailingGap;
    for (let label of labels) {
      total += textWidth(label.name, sample) + 2 * kTagPaddingInline;
    }
    return total;
  }
</script>

<script lang="ts" context="module">
  /** All rows share the same font, so measure it once. */
  let measureContext: CanvasRenderingContext2D | null | undefined;
  let measureFont: string | null = null;
  const textWidths = new Map<string, number>();

  function textWidth(text: string, sample: HTMLElement): number {
    if (measureContext === undefined) {
      measureContext = document.createElement("canvas").getContext("2d");
    }
    if (!measureContext) { // no canvas, e.g. in tests: never collapse
      return 0;
    }
    if (!measureFont) {
      let style = getComputedStyle(sample);
      measureFont = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      measureContext.font = measureFont;
      if (!measureContext.font.includes(style.fontSize)) { // canvas rejected it
        measureFont = `${style.fontSize} sans-serif`;
        measureContext.font = measureFont;
      }
    }
    let cached = textWidths.get(text);
    if (cached === undefined) {
      cached = measureContext.measureText(text).width;
      textWidths.set(text, cached);
    }
    return cached;
  }

  /** One observer for all rows, instead of one per row */
  let widthObserver: ResizeObserver | null = null;
  const widthListeners = new WeakMap<Element, (width: number) => void>();

  function observeWidth(el: Element, onWidth: (width: number) => void): () => void {
    widthObserver ??= new ResizeObserver(entries => {
      for (let entry of entries) {
        widthListeners.get(entry.target)?.(entry.contentRect.width);
      }
    });
    widthListeners.set(el, onWidth);
    widthObserver.observe(el);
    return () => {
      widthListeners.delete(el);
      widthObserver.unobserve(el);
    };
  }
</script>

<style>
  /* Claims the space left over in the row, so that we can measure how much
    the tags may use. The tags themselves sit at its end. */
  .message-tags {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    align-items: center;
  }
  .content {
    margin-inline-start: auto;
    margin-inline-end: var(--trailing-gap);
    min-width: 0;
    max-width: 100%;
    align-items: center;
    gap: var(--tag-gap);
    overflow: hidden;
  }
  .tag {
    flex: 0 1 auto;
    min-width: 0;
    border-radius: 8px;
    padding-inline: var(--tag-pad);
    background-color: var(--tag-color);
    color: white;
    line-height: 1.45;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chips {
    flex: 0 0 auto;
    gap: var(--chip-gap);
    align-items: center;
  }
  .chip {
    flex: 0 0 auto;
    width: var(--chip-size);
    height: var(--chip-size);
    border-radius: 2px;
    background-color: var(--tag-color);
  }
  .names {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>

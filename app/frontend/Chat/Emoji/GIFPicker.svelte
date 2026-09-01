<vbox class="gif-picker" flex>
  {#if state == "loading"}
    <vbox class="media-grid skeleton-grid" flex>
      {#each skeletons as _}
        <hbox class="media-skeleton" />
      {/each}
    </vbox>
  {:else if state == "error"}
    <vbox class="picker-state" flex>
      <hbox class="state-title">{$t`Could not load GIFs`}</hbox>
      <hbox class="state-copy">{$t`Check your connection and try again.`}</hbox>
      <RoundButton label={$t`Retry`} onClick={() => scheduleSearch(normalizedQuery)} />
    </vbox>
  {:else if !visibleGIFs.length}
    <vbox class="picker-state" flex>
      <hbox class="state-title">{$t`No GIFs found`}</hbox>
      <hbox class="state-copy">{$t`Try another search or clear the search field.`}</hbox>
      <RoundButton label={$t`Clear search`} onClick={() => searchTerm = null} />
    </vbox>
  {:else}
    <Scroll>
      <vbox class="media-grid">
        {#each visibleGIFs as gif (gif.id)}
          <button
            type="button"
            class="media-button"
            title={gif.creator ? `${gif.title} — ${gif.creator}` : gif.title}
            aria-label={$t`Insert GIF ${gif.title}`}
            disabled={!!loadingID}
            on:click={() => selectGIF(gif)}
            >
            <span class="media-preview">
              <span class="media-placeholder" aria-hidden="true">GIF</span>
              {#if !failedThumbnailIDs.has(gif.id)}
                <img
                  class:media-image-visible={loadedThumbnailIDs.has(gif.id)}
                  src={getGIFThumbnailURL(gif, fallbackThumbnailIDs.has(gif.id))}
                  alt={gif.title}
                  loading="lazy"
                  on:load={() => onThumbnailLoad(gif)}
                  on:error={() => onThumbnailError(gif)}
                  />
              {/if}
            </span>
            {#if loadingID == gif.id}
              <span class="media-loading">{$t`Loading…`}</span>
            {/if}
          </button>
        {/each}
      </vbox>
    </Scroll>
  {/if}
  {#if selectionError}
    <hbox class="selection-error" role="status">{$t`Could not add this GIF. Try another one.`}</hbox>
  {/if}
</vbox>

<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  import RoundButton from "../../Shared/RoundButton.svelte";
  import Scroll from "../../Shared/Scroll.svelte";
  import {
    downloadGIF,
    getGIFThumbnailURL,
    kGIFDisplayWidth,
    searchGIFs,
    type GraphicSelection,
    type OpenverseGIF,
  } from "./media";
  import { t } from "../../../l10n/l10n";

  export let searchTerm: string | null;

  const kSearchDebounceMS = 300;
  const skeletons = Array(8);
  const dispatchEvent = createEventDispatcher<{ select: GraphicSelection }>();

  let state: "loading" | "ready" | "error" = "loading";
  let gifs: OpenverseGIF[] = [];
  let visibleGIFs: OpenverseGIF[] = [];
  let selectionError = false;
  let loadingID: string | null = null;
  let fallbackThumbnailIDs = new Set<string>();
  let failedThumbnailIDs = new Set<string>();
  let loadedThumbnailIDs = new Set<string>();
  let normalizedQuery = "";
  let scheduledQuery = "";
  let requestID = 0;
  let isMounted = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  $: normalizedQuery = searchTerm?.trim() ?? "";
  $: visibleGIFs = gifs;
  $: if (isMounted && normalizedQuery != scheduledQuery) {
    scheduleSearch(normalizedQuery);
  }

  onMount(() => {
    isMounted = true;
    scheduleSearch(normalizedQuery);
  });

  onDestroy(() => {
    requestID++;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  });

  function scheduleSearch(query: string) {
    requestID++;
    scheduledQuery = query;
    state = "loading";
    selectionError = false;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void loadGIFs(query);
    }, kSearchDebounceMS);
  }

  async function loadGIFs(query: string) {
    let currentRequestID = ++requestID;
    state = "loading";
    gifs = [];
    fallbackThumbnailIDs = new Set();
    failedThumbnailIDs = new Set();
    loadedThumbnailIDs = new Set();
    loadingID = null;
    try {
      let result = await searchGIFs(query);
      if (currentRequestID != requestID) {
        return;
      }
      gifs = result;
      state = "ready";
    } catch (ex) {
      if (currentRequestID != requestID) {
        return;
      }
      state = "error";
    }
  }

  async function selectGIF(gif: OpenverseGIF) {
    if (loadingID) {
      return;
    }
    loadingID = gif.id;
    selectionError = false;
    try {
      let file = await downloadGIF(gif);
      dispatchEvent("select", { emoji: null, file, width: kGIFDisplayWidth });
    } catch (ex) {
      selectionError = true;
    } finally {
      loadingID = null;
    }
  }

  function onThumbnailError(gif: OpenverseGIF) {
    loadedThumbnailIDs = new Set(loadedThumbnailIDs);
    loadedThumbnailIDs.delete(gif.id);
    if (!fallbackThumbnailIDs.has(gif.id) && gif.thumbnail != gif.url) {
      fallbackThumbnailIDs = new Set(fallbackThumbnailIDs).add(gif.id);
      return;
    }
    failedThumbnailIDs = new Set(failedThumbnailIDs).add(gif.id);
  }

  function onThumbnailLoad(gif: OpenverseGIF) {
    loadedThumbnailIDs = new Set(loadedThumbnailIDs).add(gif.id);
  }
</script>

<style>
  .gif-picker {
    min-height: 0;
    min-width: 0;
  }
  .media-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 4px 8px 8px;
  }
  .media-button {
    position: relative;
    min-width: 0;
    min-height: 72px;
    padding: 0;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 8px;
    background-color: var(--main-bg);
    color: var(--main-fg);
    cursor: pointer;
  }
  .media-button:hover:not(:disabled) {
    border-color: var(--selected-bg);
  }
  .media-button:focus-visible {
    outline: 2px solid var(--input-focus);
    outline-offset: 2px;
  }
  .media-button:active:not(:disabled) {
    transform: scale(0.98);
  }
  .media-button:disabled {
    cursor: wait;
    opacity: 70%;
  }
  .media-button img {
    display: block;
    position: relative;
    z-index: 1;
    width: 100%;
    height: 96px;
    object-fit: cover;
    opacity: 0;
    transition: opacity 120ms ease-out;
  }
  .media-button img.media-image-visible {
    opacity: 1;
  }
  .media-preview {
    position: relative;
    display: block;
    height: 96px;
    background-color: var(--hover-bg);
  }
  .media-placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 8px;
    box-sizing: border-box;
    background-color: var(--hover-bg);
    color: var(--main-fg);
    font-size: 12px;
    font-weight: 600;
  }
  .media-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background-color: rgba(0, 0, 0, 35%);
    color: white;
    font-size: 12px;
  }
  .media-skeleton {
    min-height: 96px;
    border-radius: 8px;
    background-color: var(--hover-bg);
    animation: pulse 1.2s ease-in-out infinite alternate;
  }
  .picker-state {
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px;
    text-align: center;
  }
  .state-title {
    font-weight: bold;
  }
  .state-copy {
    max-width: 260px;
    color: var(--input-placeholder);
    text-align: center;
  }
  .selection-error {
    flex: 0 0 auto;
    padding: 4px 8px;
    color: var(--error-fg, #b00020);
    font-size: 12px;
  }
  @keyframes pulse {
    from { opacity: 55%; }
    to { opacity: 100%; }
  }
</style>

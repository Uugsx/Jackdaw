<hbox class="message-zoom" aria-label={$t`Text scale`}>
  <Button
    icon={ZoomOutIcon}
    iconSize="14px"
    iconOnly
    label={$t`Zoom out`}
    shortCutInfo={zoomOutHint}
    onClick={() => changeZoom(-1)}
    disabled={zoom <= kMessageZoomMin ? $t`Minimum scale reached` : false}
    plain
    classes="zoom-btn"
    />
  <Button
    icon={ZoomInIcon}
    iconSize="14px"
    iconOnly
    label={$t`Zoom in`}
    shortCutInfo={zoomInHint}
    onClick={() => changeZoom(1)}
    disabled={zoom >= kMessageZoomMax ? $t`Maximum scale reached` : false}
    plain
    classes="zoom-btn"
    />
</hbox>

<script lang="ts">
  import Button from "../../Shared/Button.svelte";
  import ZoomInIcon from "lucide-svelte/icons/zoom-in";
  import ZoomOutIcon from "lucide-svelte/icons/zoom-out";
  import { createEventDispatcher } from "svelte";
  import { t, translateString } from "../../../l10n/l10n";
  import {
    isMacPlatform,
    kMessageZoomMax,
    kMessageZoomMin,
    stepMessageZoom,
  } from "./messageZoom";

  export let zoom: number;

  const dispatch = createEventDispatcher<{ change: number }>();
  $: zoomInHint = isMacPlatform()
    ? translateString({ id: "ZeMPGkMac", defaultMessage: "⌘ + scroll up" }, {})
    : translateString({ id: "ZeMPGk", defaultMessage: "Ctrl + scroll up" }, {});
  $: zoomOutHint = isMacPlatform()
    ? translateString({ id: "twQNl4Mac", defaultMessage: "⌘ + scroll down" }, {})
    : translateString({ id: "twQNl4", defaultMessage: "Ctrl + scroll down" }, {});

  function changeZoom(direction: 1 | -1) {
    dispatch("change", stepMessageZoom(zoom, direction));
  }
</script>

<style>
  .message-zoom {
    position: absolute;
    top: 4px;
    inset-inline-end: 8px;
    z-index: 1;
    align-items: center;
    gap: 0;
    opacity: 0.72;
    pointer-events: auto;
  }
  .message-zoom:hover {
    opacity: 1;
  }
  .message-zoom :global(.zoom-btn) {
    min-width: 0;
    padding: 2px;
  }
</style>

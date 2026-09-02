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
  import { t, translateString } from "../../../l10n/l10n";
  import {
    clampMessageZoom,
    getMessageZoomSetting,
    isMacPlatform,
    kMessageZoomMax,
    kMessageZoomMin,
    stepMessageZoom,
  } from "./messageZoom";

  let zoomSetting = getMessageZoomSetting();
  $: zoom = clampMessageZoom($zoomSetting.value);
  $: zoomInHint = isMacPlatform()
    ? translateString({ id: "ZeMPGkMac", defaultMessage: "⌘ + scroll up" }, {})
    : translateString({ id: "ZeMPGk", defaultMessage: "Ctrl + scroll up" }, {});
  $: zoomOutHint = isMacPlatform()
    ? translateString({ id: "twQNl4Mac", defaultMessage: "⌘ + scroll down" }, {})
    : translateString({ id: "twQNl4", defaultMessage: "Ctrl + scroll down" }, {});

  function changeZoom(direction: 1 | -1) {
    zoomSetting.value = stepMessageZoom(zoom, direction);
  }
</script>

<style>
  .message-zoom {
    align-items: center;
    gap: 0;
    margin-inline-end: 4px;
  }
  .message-zoom :global(.zoom-btn) {
    min-width: 0;
    padding: 2px;
  }
</style>

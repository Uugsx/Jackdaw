<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<vbox flex class="message-display"
  class:message-background-white={messageBackground == "white"}
  class:message-background-dark={messageBackground == "dark"}
  on:keydown={event => catchErrors(() => onKeyOnMessage(event, onZoomKey))}
  on:wheel|capture={onZoomWheel}
  tabindex={0}
  >
  <MessageHeader bind:message />
  <MessageAttachments attachments={message.attachments} />
  <SMLDisplayKinds {message} sml={message.sml} />
  <vbox class="body" flex>
    <Paper>
      <MessageBody {message} {zoom} on:zoomwheel={onZoomWheelFromBody} />
    </Paper>
  </vbox>
  {#if $appGlobal.isMobile}
    <MessageDisplayBarM bind:message />
  {/if}
</vbox>

<script lang="ts">
  import type { EMail } from "../../../logic/Mail/EMail";
  import { onKeyOnMessage } from "./MessageKeyboard";
  import { appGlobal } from "../../../logic/app";
  import MessageHeader from "./MessageHeader.svelte";
  import MessageAttachments from "./AttachmentsUI.svelte";
  import MessageBody from "./MessageBody.svelte";
  import SMLDisplayKinds from "../SML/SMLDisplayKinds.svelte";
  import MessageDisplayBarM from "./MessageDisplayBarM.svelte";
  import Paper from "../../Shared/Paper.svelte";
  import { catchErrors } from "../../Util/error";
  import {
    getMessageViewerBackgroundSetting,
    normalizeMessageViewerBackground,
  } from "./messageViewerAppearance";
  import {
    clampMessageZoom,
    getMessageZoomSetting,
    isMessageZoomWheelEvent,
    kMessageZoomDefault,
    messageZoomKeyDirection,
    stepMessageZoom,
  } from "./messageZoom";

  export let message: EMail;

  let messageBackgroundSetting = getMessageViewerBackgroundSetting();
  $: messageBackground = normalizeMessageViewerBackground($messageBackgroundSetting.value);

  let zoomSetting = getMessageZoomSetting();
  $: zoom = clampMessageZoom($zoomSetting.value);

  function setZoom(next: number) {
    zoomSetting.value = clampMessageZoom(next);
  }

  function onZoomWheel(event: WheelEvent) {
    if (!isMessageZoomWheelEvent(event)) {
      return;
    }
    event.preventDefault();
    setZoom(stepMessageZoom(zoom, event.deltaY > 0 ? -1 : 1));
  }

  function onZoomWheelFromBody(event: CustomEvent<{ direction: 1 | -1 }>) {
    setZoom(stepMessageZoom(zoom, event.detail.direction));
  }

  function onZoomKey(event: KeyboardEvent): boolean {
    let direction = messageZoomKeyDirection(event);
    if (direction == null) {
      return false;
    }
    event.preventDefault();
    event.stopPropagation();
    setZoom(direction == 0 ? kMessageZoomDefault : stepMessageZoom(zoom, direction));
    return true;
  }
</script>

<style>
  .message-display {
    --message-viewer-bg: var(--main-bg);
    --message-viewer-fg: var(--main-fg);
    background-color: var(--message-viewer-bg);
    color: var(--message-viewer-fg);
  }
  .message-display.message-background-white {
    --message-viewer-bg: #ffffff;
    --message-viewer-fg: #111827;
  }
  .message-display.message-background-dark {
    --message-viewer-bg: #1a1a1c;
    --message-viewer-fg: #e5e7eb;
  }
  .message-display :global(.paper) {
    background-color: var(--message-viewer-bg);
    color: var(--message-viewer-fg);
    box-shadow: none;
    border-radius: 0;
    outline: none;
  }
  .body {
    margin-inline: 8px 16px;
    margin-block-end: 2px;
  }
  @media (max-width: 600px)  {
    .body {
      margin-inline-start: 4px;
      margin-inline-end: 1px;
      margin-block-end: 1px;
    }
  }
</style>

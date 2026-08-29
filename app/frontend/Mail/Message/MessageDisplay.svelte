<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<vbox flex class="message-display"
  on:keydown={event => catchErrors(() => onKeyOnMessage(event))}
  tabindex={0}
  >
  <MessageHeader bind:message />
  <MessageAttachments attachments={message.attachments} />
  <SMLDisplayKinds {message} sml={message.sml} />
  <vbox class="body" flex>
    <Paper>
      <MessageBody {message} />
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

  export let message: EMail;
</script>

<style>
  .message-display {
    background-color: transparent;
    color: var(--main-fg);
  }
  .message-display :global(.paper) {
    background-color: transparent;
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

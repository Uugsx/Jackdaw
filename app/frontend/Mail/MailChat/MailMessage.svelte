<div
  class="mail-message-row"
  class:incoming={!displayOutgoing}
  class:outgoing={displayOutgoing}
  aria-label={displayOutgoing ? "Исходящее письмо" : "Входящее письмо"}
>
  <div class="mail-message-card">
    <MessageBubble
      {message}
      {previousMessage}
      wideBubble={true}
      showReactions={false}
      renderHTML={false}
      outgoingOverride={displayOutgoing}
      previousOutgoingOverride={previousDisplayOutgoing}
    >
  <svelte:fragment slot="above-center">
    <hbox flex />
    <hbox class="recipients">
      {$t`to:`}
      {recipientsLine}
    </hbox>
  </svelte:fragment>
  <svelte:fragment slot="inner-top">
    {#if !(previousMessage instanceof EMail && message.subject == previousMessage.subject)}
      <h2 class="subject font-small">
        {$message.subject}
      </h2>
    {/if}
  </svelte:fragment>
  <svelte:fragment slot="bubble">
    {#await loadMailChatMessage(message)}
      <span class="body-state">{$t`Loading...`}</span>
    {:catch ex}
      <span class="body-state">{ex.message ?? ex + ""}</span>
    {:then}
      {@html stripMailChatQuote($message.html)}
    {/await}
  </svelte:fragment>
  <svelte:fragment slot="menu">
    <Toolbar {message} />
  </svelte:fragment>
    </MessageBubble>
  </div>
</div>

<script lang="ts">
  import type { Message } from "../../../logic/Abstract/Message";
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import { EMail } from "../../../logic/Mail/EMail";
  import { isOutgoingMail } from "./MailChatRoom";
  import { stripMailChatQuote } from "../Message/mailChatBody";
  import MessageBubble from "../../Chat/MessageView/Message.svelte";
  import Toolbar from "./MailChatToolbar.svelte";
  import { t } from "../../../l10n/l10n";

  export let message: EMail;
  export let previousMessage: Message;
  export let account: MailAccount | null | undefined = null;

  $: displayOutgoing = isOutgoingMail($message, account);
  $: previousDisplayOutgoing = previousMessage instanceof EMail
    ? isOutgoingMail(previousMessage, account)
    : null;
  $: allRecipients = message.to.concat(message.cc).concat(message.bcc);
  $: recipientsLine = allRecipients.contents.map(person => person.name).join(", ");

  async function loadMailChatMessage(mail: EMail): Promise<void> {
    await mail.loadForDisplay();
    await mail.loadBody();
  }
</script>

<style>
  .mail-message-row {
    display: block;
    width: 100%;
    min-width: 100%;
    align-self: stretch;
    flex: 0 0 auto;
    box-sizing: border-box;
  }
  .mail-message-row.incoming {
    padding-inline-start: 20px;
  }
  .mail-message-row.outgoing {
    padding-inline-end: 32px;
  }
  .mail-message-card {
    display: block;
    width: 75%;
    max-width: 75%;
    min-width: 0;
    box-sizing: border-box;
  }
  .mail-message-row.outgoing .mail-message-card {
    margin-inline-start: auto;
  }
  .mail-message-card > :global(.message) {
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .mail-message-card > :global(.message) :global(.right) {
    min-width: 0;
    flex: 1 1 auto;
  }
  .subject {
    font-weight: bold;
    line-height: normal;
    margin: 8px 0 4px 0;
  }
  .recipients {
    overflow: hidden;
    max-width: 75%;
    margin: 0 12px;
    max-height: 1.5em;
  }
</style>

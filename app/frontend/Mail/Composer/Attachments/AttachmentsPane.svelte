<vbox flex class="attachments-pane">
  <Scroll>
    {#each $visibleAttachments.each as attachment (attachment)}
      <AttachmentEntry {attachment} attachments={allAttachments} on:remove />
    {/each}
    <hbox class="buttons">
      <RoundButton
        icon={AddIcon} label={$t`Add attachment`}
        onClick={onAdd}
        />
    </hbox>
  </Scroll>
</vbox>

<FileSelector bind:this={fileSelector} />

<script lang="ts">
  import { addFilesAsAttachments, type MessageWithAttachments } from "../../../../logic/Abstract/Attachment";
  import AttachmentEntry from "./AttachmentEntry.svelte";
  import FileSelector from "./FileSelector.svelte";
  import RoundButton from "../../../Shared/RoundButton.svelte";
  import Scroll from "../../../Shared/Scroll.svelte";
  import AddIcon from "lucide-svelte/icons/plus";
  import { t } from "../../../../l10n/l10n";

  /** The email, chat message or calendar event to attach the files to */
  export let message: MessageWithAttachments;
  $: allAttachments = message.attachments;
  /** Inline/related-части входят в MIME письма, но не являются вложениями пользователя. */
  $: visibleAttachments = allAttachments.filterObservable(attachment => !attachment.hidden);

  let fileSelector: FileSelector;
  export async function onAdd() {
    let file = await fileSelector.selectFile();
    if (!file) {
      return;
    }
    addFilesAsAttachments(message, [file]);
  }
</script>

<style>
  .buttons {
    justify-content: center;
    margin-block-start: 12px;
  }
</style>

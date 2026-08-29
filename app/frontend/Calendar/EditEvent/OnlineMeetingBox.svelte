<vbox class="online-meeting" flex>
  <input type="url" bind:value={event.onlineMeetingURL}
    placeholder={$t`Paste meeting URL`}
    on:input={onURLChanged} />
  <hbox class="buttons">
    {#if canCreateTeams}
      <Button
        label={$t`Create Teams meeting`}
        tooltip={$t`Exchange will create a Teams link when you save`}
        plain
        disabled={hasURL || pendingTeamsCreate}
        onClick={onCreateTeams}
        />
    {/if}
    <Button
      label={$t`Copy`}
      icon={CopyIcon}
      iconSize="16px"
      iconOnly
      plain
      disabled={!hasURL}
      onClick={onCopyMeetingURL}
      />
    <Button
      label={$t`Open`}
      icon={BrowserIcon}
      iconSize="16px"
      iconOnly
      plain
      disabled={!hasURL}
      onClick={onOpenMeetingURL}
      />
    <Button
      label={$t`Delete`}
      icon={DeleteIcon}
      iconSize="16px"
      iconOnly
      plain
      disabled={!event.isOnline && !hasURL}
      onClick={onRemove}
      />
  </hbox>
  {#if pendingTeamsCreate}
    <hbox class="hint font-smallest">{$t`Teams link will be created when you save`}</hbox>
  {/if}
</vbox>

<script lang="ts">
  import type { Event } from "../../../logic/Calendar/Event";
  import { OWAEvent } from "../../../logic/Calendar/OWA/OWAEvent";
  import { Provider } from "../../../logic/Auth/OAuth2URLs";
  import { openExternalURL } from "../../../logic/util/os-integration";
  import Button from "../../Shared/Button.svelte";
  import CopyIcon from "lucide-svelte/icons/copy";
  import BrowserIcon from "lucide-svelte/icons/globe";
  import DeleteIcon from "lucide-svelte/icons/trash-2";
  import { t } from "../../../l10n/l10n";

  export let event: Event;

  $: hasURL = !!event.onlineMeetingURL?.startsWith("https://");
  $: canCreateTeams = event instanceof OWAEvent &&
    event.calendar?.account?.provider?.() == Provider.Office365;
  $: pendingTeamsCreate = event.isOnline && !hasURL;

  function onURLChanged() {
    event.isOnline = !!event.onlineMeetingURL?.trim();
    event.createOnlineMeetingWithAccount = null;
  }

  function onCreateTeams() {
    event.onlineMeetingURL = null;
    event.isOnline = true;
    event.createOnlineMeetingWithAccount = null;
  }

  async function onCopyMeetingURL() {
    await navigator.clipboard.writeText(event.onlineMeetingURL);
  }

  async function onOpenMeetingURL() {
    await openExternalURL(event.onlineMeetingURL);
  }

  function onRemove() {
    if (event.participants.hasItems && !event.isNew && !confirm($t`Changing the meeting URL might cause some participants to miss the meeting. Are you sure?`)) {
      return;
    }
    event.isOnline = false;
    event.onlineMeetingURL = null;
    event.createOnlineMeetingWithAccount = null;
  }
</script>

<style>
  input {
    max-width: 20em;
  }
  .hint {
    opacity: 0.7;
    margin-block-start: 4px;
  }
  .buttons {
    gap: 4px;
    flex-wrap: wrap;
  }
</style>

<vbox flex class="call-history empty">
  <hbox class="message">{$t`Call history is not available yet.`}</hbox>
</vbox>

{#if $appGlobal.isMobile}
  <CallHistoryBarM />
{/if}

<script lang="ts">
  import { appGlobal } from "../../../logic/app";
  import CallHistoryBarM from "./CallHistoryBarM.svelte";
  import { t } from "../../../l10n/l10n";
</script>

<style>
  .empty {
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--faded);
  }
</style>

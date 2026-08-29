<vbox flex class="todos-empty">
  <hbox class="title">{$t`Tasks are not available yet`}</hbox>
  <hbox class="subtitle">{$t`Task sync with Exchange is disabled for now.`}</hbox>
</vbox>

{#if $appGlobal.isMobile}
  <TODOsBarM />
{/if}

<script lang="ts">
  import { appGlobal } from "../../../logic/app";
  import TODOsBarM from "./TODOsBarM.svelte";
  import { t } from "../../../l10n/l10n";
</script>

<style>
  .todos-empty {
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 2em;
    text-align: center;
    opacity: 0.75;
  }
  .title {
    font-weight: 600;
  }
</style>

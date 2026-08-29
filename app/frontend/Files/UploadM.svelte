<vbox flex class="pane">
  <hbox class="message">{$t`Upload from this screen is not available yet. Use the desktop app to add files.`}</hbox>
</vbox>

{#if $appGlobal.isMobile}
  <UploadBarM {person} on:uploadFile={uploadFile} on:uploadPicture={uploadPicture} />
{/if}

<script lang="ts">
  import type { Person } from "../../logic/Abstract/Person";
  import { appGlobal } from "../../logic/app";
  import UploadBarM from "./UploadBarM.svelte";
  import { t } from "../../l10n/l10n";

  export let person: Person;

  function uploadFile() {
  }

  function uploadPicture() {
  }
</script>

<style>
  .pane {
    background-color: var(--main-bg);
    color: var(--main-fg);
    align-items: center;
    justify-content: center;
    padding: 2em;
  }
  .message {
    opacity: 0.75;
    text-align: center;
    max-width: 20em;
  }
</style>

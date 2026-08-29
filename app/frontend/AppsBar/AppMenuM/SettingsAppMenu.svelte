<hbox />
<hbox />
<hbox class="settings">
  <AppButton app={settingsApp} page="/settings/" />
</hbox>
<hbox />
<hbox />

<script lang="ts">
  import { settingsApp } from "../../Settings/Window/SettingsJackdawApp";
  import AppButton from "./AppButton.svelte";
</script>

<style>
  .settings {
    margin-bottom: -44px;
    height: 44px;
    z-index: 1;
  }
  .settings :global(.app-button) {
    background-color: transparent;
  }
</style>

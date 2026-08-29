<hbox class="buttons">
  <AppBarM>
    <!-- left -->
    <hbox class="settings">
      <Button
        icon={settingsApp.icon}
        iconSize="24px"
        iconOnly
        label={settingsApp.name}
        onClick={() => goTo("/settings/")}
        plain
        />
    </hbox>

    <!-- left middle -->
    <hbox class="empty" />

    <AppMenuButton onClick={onClose} />

    <!-- right middle -->
    <hbox class="empty" />

    <!-- right -->
    <hbox class="empty" />
  </AppBarM>
</hbox>

<script lang="ts">
  import { settingsApp } from "../../Settings/Window/SettingsJackdawApp";
  import { goBack, goTo } from "../selectedApp";
  import AppBarM from "../../AppsBar/AppBarM.svelte";
  import AppMenuButton from "../../AppsBar/AppMenuM/AppMenuButton.svelte";
  import Button from "../../Shared/Button.svelte";
  import { t } from "../../../l10n/l10n";

  function onClose() {
    goBack();
  }
</script>

<style>
  .settings :global(button svg) {
    stroke-width: 2px;
  }
</style>

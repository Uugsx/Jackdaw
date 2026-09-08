<HeaderGroupBox>
  <hbox slot="header">
    {$t`Notifications`}
  </hbox>
  <NotificationKinds bind:list={$notificationsSetting.value} />
</HeaderGroupBox>

<HeaderGroupBox>
  <hbox slot="header">
    {$t`Notification sounds`}
  </hbox>
  <hbox class="subtitle">{$t`Choose a sound for calendar reminders.`}</hbox>
  <NotificationSounds events={["calendar"]} />
</HeaderGroupBox>

<script lang="ts">
  import { getLocalStorage } from "../../Util/LocalStorage";
  import NotificationKinds from "../Mail/NotificationKinds.svelte";
  import NotificationSounds from "../Mail/NotificationSounds.svelte";
  import HeaderGroupBox from "../../Shared/HeaderGroupBox.svelte";
  import { t } from "../../../l10n/l10n";

  let notificationsSetting = getLocalStorage("notifications.calendar", ["popup", "sound"]);
</script>

<style>
</style>

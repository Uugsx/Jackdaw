<hbox class="buttons">
  <AppBarM>
    <!-- left -->
    <hbox class="empty" />

    <!-- left middle -->
    <hbox class="history" />

    <AppMenuButton />

    <!-- right middle -->
    <hbox class="new">
      <Button
        icon={PlusIcon}
        iconSize="24px"
        iconOnly
        label={$t`Start a meeting`}
        onClick={onCreateMeeting}
        disabled={!selectedAccount}
        plain
        />
    </hbox>

    <!-- right -->
    <hbox class="empty" />
  </AppBarM>
</hbox>

<script lang="ts">
  import { MeetAccount } from "../../../logic/Meet/MeetAccount";
  import { startAdHocMeeting } from "./start";
  import { meetApp } from "../MeetJackdawApp";
  import AppBarM from "../../AppsBar/AppBarM.svelte";
  import Button from "../../Shared/Button.svelte";
  import AppMenuButton from "../../AppsBar/AppMenuM/AppMenuButton.svelte";
  import PlusIcon from "lucide-svelte/icons/plus";
  import { openApp } from "../../AppsBar/selectedApp";
  import { t } from "../../../l10n/l10n";

  export let selectedAccount: MeetAccount;

  async function onCreateMeeting() {
    let meeting = await startAdHocMeeting();
    openApp(meetApp, { meeting });
  }
</script>

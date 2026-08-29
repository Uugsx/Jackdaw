<hbox class="buttons">
  <AppBarM>
    <!-- left -->
    <hbox class="todos" />

    <!-- left middle -->
    <hbox class="search">
      <Button
        icon={SearchIcon}
        iconSize="24px"
        iconOnly
        label={$t`Search appointments`}
        onClick={goToSearch}
        plain
        />
    </hbox>

    <AppMenuButton />

    <!-- right middle -->
    <hbox class="write">
      <Button
        icon={PlusIcon}
        iconSize="24px"
        iconOnly
        label={$t`Make an appointment`}
        onClick={newEvent}
        disabled={!$selectedCalendar}
        plain
        />
    </hbox>

    <!-- right -->
    <hbox class="empty" />
  </AppBarM>
</hbox>

<script lang="ts">
  import { selectedCalendar } from "../selected";
  import { setNewEventTime } from "../event";
  import { openEvent } from "../open";
  import AppBarM from "../../AppsBar/AppBarM.svelte";
  import Button from "../../Shared/Button.svelte";
  import AppMenuButton from "../../AppsBar/AppMenuM/AppMenuButton.svelte";
  import SearchIcon from "lucide-svelte/icons/search";
  import PlusIcon from "lucide-svelte/icons/plus";
  import { goTo } from "../../AppsBar/selectedApp";
  import { t } from "../../../l10n/l10n";

  function goToSearch() {
    goTo("/calendar/search", {});
  }

  function newEvent() {
    let event = $selectedCalendar.newEvent();
    setNewEventTime(event, false, new Date());
    openEvent(event, true);
  }
</script>

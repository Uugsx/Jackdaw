{#if $selectedPerson}
  <CombinedButton
    icon1={calendarApp.icon}
    icon2={$selectedPerson.picture ?? PersonIcon}
    page="/calendar/person"
    params={{ person: $selectedPerson}} />
{:else}
  <hbox class="empty" />
{/if}
<AppButton app={calendarApp} page="/calendar/" />
<BasicButton icon={SearchIcon} page="/calendar/search" />
<BasicButton icon={PlusIcon} onClick={onCreateEvent} />

<script lang="ts">
  import { setNewEventTime } from "../../../Calendar/event";
  import { calendarApp } from "../../../Calendar/CalendarJackdawApp";
  import { openEvent } from "../../../Calendar/open";
  import { selectedCalendar } from "../../../Calendar/selected";
  import { selectedPerson } from "../../../Contacts/Person/Selected";
  import { appGlobal } from "../../../../logic/app";
  import AppButton from "../AppButton.svelte";
  import CombinedButton from "../CombinedButton.svelte";
  import BasicButton from "../BasicButton.svelte";
  import SearchIcon from "lucide-svelte/icons/search";
  import PersonIcon from "lucide-svelte/icons/user";
  import PlusIcon from "lucide-svelte/icons/plus";
  import { assert } from "../../../../logic/util/util";

  function onCreateEvent() {
    let calendar = $selectedCalendar ?? appGlobal.calendars.first;
    assert(calendar, "Create a calendar first");
    let event = calendar.newEvent();
    setNewEventTime(event, false, new Date());
    openEvent(event);
  }
</script>

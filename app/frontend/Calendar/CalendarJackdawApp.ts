import { JackdawApp } from "../AppsBar/JackdawApp";
import { openApp } from "../AppsBar/selectedApp";
import type { Event } from "../../logic/Calendar/Event";
import CalendarIcon from "../Calendar/CalendarIcon.svelte";
import EditIcon from "lucide-svelte/icons/pencil";
import { derived } from "svelte/store";
import { gt } from "../../l10n/l10n";

export class CalendarJackdawApp extends JackdawApp {
  id = "calendar";
  name = gt`Calendar`;
  icon = CalendarIcon;
  appURL = "/calendar";

  showEvent(event: Event) {
    let edit = calendarApp.subApps.find(app => app.windowParams?.event == event);
    if (!edit) {
      edit = new CalendarEventJackdawApp();
      edit.title = derived(event, event => event.title ?? edit.name);
      edit.windowParams = { event: event };
      calendarApp.subApps.add(edit);
    }
    openApp(edit, edit.windowParams);
  }
}

export class CalendarEventJackdawApp extends JackdawApp {
  id = "calendar-event-show";
  name = gt`Event`;
  icon = EditIcon;
  appURL = "/calendar/event";
}

export const calendarApp = new CalendarJackdawApp();

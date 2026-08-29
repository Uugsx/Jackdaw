import { JackdawApp } from "../AppsBar/JackdawApp";
import MeetApp from "./MeetApp.svelte";
import MeetSidebar from "./MeetSidebar.svelte";
import VideoIcon from "lucide-svelte/icons/video";
import { gt } from "../../l10n/l10n";

export class MeetJackdawApp extends JackdawApp {
  id = "meet";
  name = gt`Meet`;
  icon = VideoIcon;
  appURL = "/meet";
  sidebar = MeetSidebar;
}

export const meetApp = new MeetJackdawApp();

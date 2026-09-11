import ClockIcon from "lucide-svelte/icons/clock-3";
import { gt } from "../../l10n/l10n";
import { JackdawApp } from "../AppsBar/JackdawApp";

export class LiveSlaJackdawApp extends JackdawApp {
  id = "live-sla";
  name = gt`Live response control`;
  barLabel = gt`LIVE SLA`;
  icon = ClockIcon;
  appURL = "/live-sla";
}

export const liveSlaApp = new LiveSlaJackdawApp();

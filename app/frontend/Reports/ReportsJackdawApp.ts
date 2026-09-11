import ChartIcon from "lucide-svelte/icons/chart-column";
import { gt } from "../../l10n/l10n";
import { JackdawApp } from "../AppsBar/JackdawApp";

export class ReportsJackdawApp extends JackdawApp {
  id = "reports";
  name = gt`Reports`;
  barLabel = gt`Reports`;
  icon = ChartIcon;
  appURL = "/reports";
}

export const reportsApp = new ReportsJackdawApp();

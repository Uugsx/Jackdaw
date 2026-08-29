import { JackdawApp } from "../AppsBar/JackdawApp";
import SettingsIcon from "lucide-svelte/icons/settings";
import { gt } from "../../l10n/l10n";

export class SetupJackdawApp extends JackdawApp {
  id = "setup";
  name = gt`Setup`;
  icon = SettingsIcon;
  appURL = "/setup";
  onBack: () => void = null;
}

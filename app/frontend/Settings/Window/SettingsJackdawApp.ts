import { JackdawApp } from "../../AppsBar/JackdawApp";
import SettingsIcon from "lucide-svelte/icons/settings";
import { gt } from "../../../l10n/l10n";

export class SettingsJackdawApp extends JackdawApp {
  id = "settings";
  name = gt`Settings`;
  icon = SettingsIcon;
  appURL = "/settings";
}

export const settingsApp = new SettingsJackdawApp();

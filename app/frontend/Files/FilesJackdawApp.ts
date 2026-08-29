import { JackdawApp } from "../AppsBar/JackdawApp";
import FolderIcon from "lucide-svelte/icons/folder";
import { gt } from "../../l10n/l10n";

export class FilesJackdawApp extends JackdawApp {
  id = "files";
  name = gt`Files`;
  icon = FolderIcon;
  appURL = "/files";
}

export const filesApp = new FilesJackdawApp();

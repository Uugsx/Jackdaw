import { JackdawApp } from "../AppsBar/JackdawApp";
import ContactRoundIcon from "lucide-svelte/icons/contact-round";
import { gt } from "../../l10n/l10n";

export class ContactsJackdawApp extends JackdawApp {
  id = "contacts";
  name = gt`People *=> or Persons - Short word, less than 10 characters`;
  icon = ContactRoundIcon;
  appURL = "/contacts";
}

export const contactsApp = new ContactsJackdawApp();

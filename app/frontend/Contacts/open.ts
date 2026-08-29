import type { Person } from "../../logic/Abstract/Person";
import { selectedPerson } from "./Person/Selected";
import { contactsApp } from "./ContactsJackdawApp";
import { goTo, openApp } from "../AppsBar/selectedApp";
import { appGlobal } from "../../logic/app";

export function openPersonFromOtherApp(person: Person) {
  selectedPerson.set(person);
  if (appGlobal.isMobile) {
    goTo(`/contacts/person/${person.id}/edit`, { person });
  } else {
    openApp(contactsApp, {});
  }
}

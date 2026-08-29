import { contactsApp } from "../Contacts/ContactsJackdawApp";
import { chatApp } from "../Chat/ChatJackdawApp";
// #if [PROPRIETARY]
import { meetApp } from "../Meet/MeetJackdawApp";
// #endif
import { mailApp } from "../Mail/MailJackdawApp";
import { calendarApp } from "../Calendar/CalendarJackdawApp";
// #if [!WEBMAIL]
import { filesApp } from "../Files/FilesJackdawApp";
// #endif
import { settingsApp } from "../Settings/Window/SettingsJackdawApp";
import { apps } from "./selectedApp";
import { JackdawApp } from "./JackdawApp";
import { appGlobal } from "../../logic/app";
import { getConfigDir } from "../../logic/util/backend-wrapper";
import JXON from "../../../lib/util/JXON";
import { ArrayColl } from "svelte-collections";

const allApps = new ArrayColl<JackdawApp>();

export function loadApps() {
  if (allApps.isEmpty) {
    allApps.addAll([
      contactsApp,
      mailApp,
      chatApp,
      // #if [PROPRIETARY]
      meetApp,
      // #endif
      calendarApp,
      filesApp,
      settingsApp,
    ]);
  }

  apps.replaceAll([
    contactsApp,
    mailApp,
    calendarApp,
    // #if [!WEBMAIL]
    filesApp,
    // #endif
    settingsApp,
  ]);
}

export async function disableAppsBasedOnFeaturesXML() {
  let xmlArray: Uint8Array;
  try {
    let fileName = await appGlobal.remoteApp.path.join(await getConfigDir(), "features.xml");
    xmlArray = await appGlobal.remoteApp.readFile(fileName, { encoding: "utf-8" });
  } catch (ex) {
    if (ex.message?.includes("ENOENT") || (ex as any)?.code == "ConnectionClosed") {
      return;
    }
    throw ex;
  }
  let xmlStr = new TextDecoder().decode(xmlArray);
  let xml = JXON.parse(xmlStr);
  let newApps = new ArrayColl<JackdawApp>(); // preserve order of apps
  for (let app of allApps) {
    let enabledProp = xml.features?.[app.id]?.["@enabled"];
    let enabled = typeof(enabledProp) == "boolean" ? enabledProp : apps.includes(app);
    if (enabled) {
      newApps.add(app);
    }
  }
  apps.replaceAll(newApps);
}

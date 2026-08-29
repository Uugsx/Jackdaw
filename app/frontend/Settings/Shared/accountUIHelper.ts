import type { Account } from "../../../logic/Abstract/Account";
import { Calendar } from "../../../logic/Calendar/Calendar";
import { MailAccount } from "../../../logic/Mail/MailAccount";
import { ChatAccount } from "../../../logic/Chat/ChatAccount";
import { Addressbook } from "../../../logic/Contacts/Addressbook";
import { MeetAccount } from "../../../logic/Meet/MeetAccount";
import { FileSharingAccount } from "../../../logic/Files/FileSharingAccount";
import { contactsApp } from "../../Contacts/ContactsJackdawApp";
import { calendarApp } from "../../Calendar/CalendarJackdawApp";
import { meetApp } from "../../Meet/MeetJackdawApp";
import { chatApp } from "../../Chat/ChatJackdawApp";
import { mailApp } from "../../Mail/MailJackdawApp";
import { filesApp } from "../../Files/FilesJackdawApp";
import { appGlobal } from "../../../logic/app";
import AccountIcon from "lucide-svelte/icons/server";
import { NotReached } from "../../../logic/util/util";
import { gt } from "../../../l10n/l10n";

export function getAccountIcon(acc: Account) {
  if (acc instanceof MailAccount) {
    return mailApp.icon;
  } else if (acc instanceof ChatAccount) {
    return chatApp.icon;
  } else if (acc instanceof MeetAccount) {
    return meetApp.icon;
  } else if (acc instanceof Calendar) {
    return calendarApp.icon;
  } else if (acc instanceof Addressbook) {
    return contactsApp.icon;
  } else if (acc instanceof FileSharingAccount) {
    return filesApp.icon;
  } else {
    return AccountIcon;
  }
}

export function getAccountMainTypeLabel(acc: Account) {
  if (acc instanceof MailAccount) {
    return gt`Mail`;
  } else if (acc instanceof ChatAccount) {
    return gt`Chat`;
  } else if (acc instanceof MeetAccount) {
    return gt`Meet`;
  } else if (acc instanceof Calendar) {
    return gt`Calendar`;
  } else if (acc instanceof Addressbook) {
    return gt`Addressbook`;
  } else if (acc instanceof FileSharingAccount) {
    return gt`Files`;
  } else {
    return gt`Account`;
  }
}

export function getAppGlobalListForAccount(account: Account) {
  for (let [AccountClass, appGlobalList] of accountTypeToAppGlobalList.entries()) {
    if (account instanceof AccountClass) {
      return appGlobalList;
    }
  }
  throw new NotReached("Unknown account type");
}

export const accountTypeToAppGlobalList = new Map();
accountTypeToAppGlobalList.set(MailAccount, appGlobal.emailAccounts);
accountTypeToAppGlobalList.set(ChatAccount, appGlobal.chatAccounts);
accountTypeToAppGlobalList.set(MeetAccount, appGlobal.meetAccounts);
accountTypeToAppGlobalList.set(Calendar, appGlobal.calendars);
accountTypeToAppGlobalList.set(Addressbook, appGlobal.addressbooks);
accountTypeToAppGlobalList.set(FileSharingAccount, appGlobal.fileSharingAccounts);

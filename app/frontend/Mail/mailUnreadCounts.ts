import { writable } from "svelte/store";
import { appGlobal } from "../../logic/app";
import { SpecialFolder, type Folder } from "../../logic/Mail/Folder";
import type { MailAccount } from "../../logic/Mail/MailAccount";
import { accountInboxBadgeCount, findInboxFolder, totalUnreadFromAccounts } from "../../logic/Mail/MailUnreadBadge";
import { CollectionObserver, type ArrayColl } from "svelte-collections";

export { accountInboxBadgeCount, findInboxFolder } from "../../logic/Mail/MailUnreadBadge";

/** Bumped when any inbox counter changes — refreshes account-row badges. */
export const mailUnreadEpoch = writable(0);

let trackingStarted = false;
const inboxUnsubs = new Map<Folder, () => void>();
const watchedSubFolders = new WeakSet<Folder>();

function bumpMailUnreadEpoch(): void {
  mailUnreadEpoch.update(n => n + 1);
}

function trackInbox(folder: Folder | null | undefined): void {
  if (!folder || inboxUnsubs.has(folder)) {
    return;
  }
  inboxUnsubs.set(folder, folder.subscribe((_folder, prop) => {
    if (prop === "countUnread" || prop === "countNewArrived") {
      bumpMailUnreadEpoch();
    }
  }));
  bumpMailUnreadEpoch();
}

function untrackInbox(folder: Folder): void {
  inboxUnsubs.get(folder)?.();
  inboxUnsubs.delete(folder);
}

/** Inbox may live under msgfolderroot, not in rootFolders top level. */
function scanAccountInboxes(account: MailAccount): void {
  for (let folder of account.getAllFolders().contents) {
    if (folder.specialFolder === SpecialFolder.Inbox) {
      trackInbox(folder);
    }
  }
}

function watchFolderSubtree(folder: Folder): void {
  if (folder.specialFolder === SpecialFolder.Inbox) {
    trackInbox(folder);
  }
  if (!watchedSubFolders.has(folder)) {
    watchedSubFolders.add(folder);
    folder.subFolders.registerObserver(foldersObserver);
  }
  for (let child of folder.subFolders.contents) {
    watchFolderSubtree(child);
  }
}

function watchAccountFolders(account: MailAccount): void {
  scanAccountInboxes(account);
  for (let folder of account.rootFolders.contents) {
    watchFolderSubtree(folder);
  }
}

class MailUnreadFoldersObserver extends CollectionObserver<Folder> {
  added(folders: Folder[] | ArrayColl<Folder>) {
    let accounts = new Set<MailAccount>();
    for (let folder of Array.from(folders)) {
      accounts.add(folder.account);
      watchFolderSubtree(folder);
    }
    for (let account of accounts) {
      scanAccountInboxes(account);
    }
  }
  removed(folders: Folder[] | ArrayColl<Folder>) {
    for (let folder of Array.from(folders)) {
      if (folder.specialFolder === SpecialFolder.Inbox) {
        untrackInbox(folder);
      }
    }
  }
}
const foldersObserver = new MailUnreadFoldersObserver();

class MailUnreadAccountsObserver extends CollectionObserver<MailAccount> {
  added(accounts: MailAccount[]) {
    for (let account of accounts) {
      account.rootFolders.registerObserver(foldersObserver);
      account.subscribe(() => bumpMailUnreadEpoch());
      watchAccountFolders(account);
    }
  }
  removed(accounts: MailAccount[]) {
    for (let account of accounts) {
      account.rootFolders.unregisterObserver(foldersObserver);
      for (let folder of account.getAllFolders().contents) {
        if (folder.specialFolder === SpecialFolder.Inbox) {
          untrackInbox(folder);
        }
      }
    }
  }
}
const accountsObserver = new MailUnreadAccountsObserver();

/** Subscribe to inbox counters on all mail accounts. */
export function startMailUnreadTracking(): void {
  if (trackingStarted) {
    return;
  }
  trackingStarted = true;
  appGlobal.emailAccounts.registerObserver(accountsObserver);
  for (let account of appGlobal.emailAccounts.contents) {
    account.rootFolders.registerObserver(foldersObserver);
    account.subscribe(() => bumpMailUnreadEpoch());
    watchAccountFolders(account);
  }
}

/** Total unread across real mail accounts (not the virtual "All accounts"). */
export function totalMailUnreadCount(): number {
  return totalUnreadFromAccounts(appGlobal.emailAccounts.contents);
}

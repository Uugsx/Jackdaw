import { SpecialFolder, type Folder } from "./Folder";
import type { MailAccount } from "./MailAccount";

/** Inbox folder for badge display — searches the full tree, not only rootFolders. */
export function findInboxFolder(account: MailAccount): Folder | null {
  return account.findFolder(folder => folder.specialFolder === SpecialFolder.Inbox)
    ?? account.inbox;
}

/** Unread count shown on an account row (0 = hide badge). */
export function accountInboxBadgeCount(
  account: MailAccount,
  selectedAccount: MailAccount | undefined,
  selectedFolder: Folder | undefined,
  inboxCounts?: { countUnread: number; countNewArrived: number },
): number {
  let unread = inboxCounts?.countUnread ?? findInboxFolder(account)?.countUnread ?? 0;
  let newArrived = inboxCounts?.countNewArrived ?? findInboxFolder(account)?.countNewArrived ?? 0;
  let count = unread || newArrived;
  if (!count) {
    return 0;
  }
  if (selectedAccount === account &&
      selectedFolder?.specialFolder === SpecialFolder.Inbox &&
      selectedFolder.account === account) {
    return 0;
  }
  return count;
}

/** Total unread across real mail accounts (not the virtual "All accounts"). */
export function totalUnreadFromAccounts(accounts: Iterable<MailAccount>): number {
  let total = 0;
  for (let account of accounts) {
    if (account.protocol === "all") {
      continue;
    }
    let inbox = findInboxFolder(account);
    if (!inbox) {
      continue;
    }
    total += inbox.countUnread || inbox.countNewArrived;
  }
  return total;
}

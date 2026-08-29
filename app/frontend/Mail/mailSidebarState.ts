import { writable } from "svelte/store";
import type { MailAccount } from "../../logic/Mail/MailAccount";

function loadExpanded(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("mail.sidebar.expanded") ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveExpanded(ids: Record<string, boolean>): void {
  localStorage.setItem("mail.sidebar.expanded", JSON.stringify(ids));
}

/** Which mail accounts show their folder tree in the left sidebar. */
export const expandedAccountsStore = writable(loadExpanded());

export function isAccountExpanded(account: MailAccount, ids = loadExpanded()): boolean {
  return !!ids[account.id];
}

export function setAccountExpanded(account: MailAccount, expanded: boolean): void {
  expandedAccountsStore.update(ids => {
    let next = { ...ids };
    if (expanded) {
      next[account.id] = true;
    } else {
      delete next[account.id];
    }
    saveExpanded(next);
    return next;
  });
}

export function toggleAccountExpanded(account: MailAccount): void {
  expandedAccountsStore.update(ids => {
    let next = { ...ids };
    if (next[account.id]) {
      delete next[account.id];
    } else {
      next[account.id] = true;
    }
    saveExpanded(next);
    return next;
  });
}

export function ensureAccountExpanded(account: MailAccount | undefined): void {
  if (!account) {
    return;
  }
  expandedAccountsStore.update(ids => {
    if (ids[account.id]) {
      return ids;
    }
    let next = { ...ids, [account.id]: true };
    saveExpanded(next);
    return next;
  });
}

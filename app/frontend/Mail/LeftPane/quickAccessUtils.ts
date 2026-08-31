import type { MailAccount } from "../../../logic/Mail/MailAccount";
import type { Folder } from "../../../logic/Mail/Folder";
import { SpecialFolder } from "../../../logic/Mail/Folder";

export const preferredSpecialFolders = [
  SpecialFolder.Inbox,
  SpecialFolder.Sent,
  SpecialFolder.Drafts,
  SpecialFolder.All,
  SpecialFolder.Spam,
  SpecialFolder.Trash,
  SpecialFolder.Archive,
];

/**
 * Saved OWA hierarchies can contain the right folders without retaining the
 * special-use marker. Prefer the marker, then use the stable system-folder
 * names as a fallback so quick access never becomes an empty heading.
 */
const fallbackNames: Partial<Record<SpecialFolder, string[]>> = {
  [SpecialFolder.Inbox]: ["inbox", "входящие"],
  [SpecialFolder.Sent]: ["sent", "sent items", "отправленные"],
  [SpecialFolder.Drafts]: ["drafts", "черновики"],
  [SpecialFolder.All]: ["all mail", "all messages", "все сообщения"],
  [SpecialFolder.Spam]: ["spam", "junk", "нежелательная почта", "спам"],
  [SpecialFolder.Trash]: ["trash", "deleted items", "удаленные", "корзина"],
  [SpecialFolder.Archive]: ["archive", "архив"],
};

function normalizeFolderName(name: string): string {
  return name.trim().toLocaleLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
}

export function findQuickAccessFolder(account: MailAccount, specialFolder: SpecialFolder): Folder | null {
  let marked = account.findSpecialFolder(specialFolder);
  if (marked) {
    return marked;
  }
  let names = fallbackNames[specialFolder] ?? [];
  return account.getAllFolders().find(folder => names.includes(normalizeFolderName(folder.name))) ?? null;
}

export function getDefaultQuickAccessFolders(account: MailAccount | null | undefined): Folder[] {
  if (!account) {
    return [];
  }
  return preferredSpecialFolders
    .map(specialFolder => findQuickAccessFolder(account, specialFolder))
    .filter((folder): folder is Folder => !!folder)
    .filter((folder, index, folders) => folders.indexOf(folder) == index);
}

export function folderQuickAccessKey(folder: Folder): string {
  return `${folder.account.id}:${folder.id ?? folder.fullPath}`;
}

import { writable } from "svelte/store";
import type { Collection } from "svelte-collections";
import type { Folder } from "../../../logic/Mail/Folder";
import type { MailAccount } from "../../../logic/Mail/MailAccount";
import { getLocalStorage } from "../../Util/LocalStorage";
import { enumerateMailAccounts } from "./favoriteFolders";

export interface HiddenFolderRef {
  accountId: string;
  folderId: string;
  folderPath: string;
}

export const hiddenFoldersSetting = getLocalStorage<HiddenFolderRef[]>(
  "mail.folders.hidden",
  [],
);

/** Bumped when hidden-folder preferences change so folder trees recalculate. */
export const hiddenFoldersEpoch = writable(0);

function normalizeFolderPath(path: string | null | undefined): string {
  return (path ?? "").replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
}

function sameFolderRef(a: HiddenFolderRef, b: HiddenFolderRef): boolean {
  if (a.accountId != b.accountId) {
    return false;
  }
  if (a.folderId && b.folderId && a.folderId == b.folderId) {
    return true;
  }
  let aPath = normalizeFolderPath(a.folderPath);
  let bPath = normalizeFolderPath(b.folderPath);
  return !!aPath && aPath == bPath;
}

function folderMatchesRef(folder: Folder, ref: HiddenFolderRef): boolean {
  if (ref.folderId && folder.id == ref.folderId) {
    return true;
  }
  let refPath = normalizeFolderPath(ref.folderPath);
  if (!refPath) {
    return false;
  }
  let fullPath = normalizeFolderPath(folder.fullPath);
  return refPath == fullPath || refPath == normalizeFolderPath(folder.name);
}

export function getHiddenFolderRefs(): HiddenFolderRef[] {
  return hiddenFoldersSetting.value ?? [];
}

export function isHiddenFolderRef(
  ref: HiddenFolderRef,
  refs: HiddenFolderRef[] = getHiddenFolderRefs(),
): boolean {
  return refs.some(candidate => sameFolderRef(candidate, ref));
}

export function isHiddenFolder(
  folder: Folder,
  refs: HiddenFolderRef[] = getHiddenFolderRefs(),
): boolean {
  if (!folder.id || !folder.account?.id || folder.account.protocol == "all") {
    return false;
  }
  return refs.some(ref =>
    ref.accountId == folder.account.id && folderMatchesRef(folder, ref));
}

export function hideFolder(folder: Folder): void {
  if (!folder.id || !folder.account?.id || folder.account.protocol == "all" || isHiddenFolder(folder)) {
    return;
  }
  hiddenFoldersSetting.value = [
    ...getHiddenFolderRefs(),
    {
      accountId: folder.account.id,
      folderId: folder.id,
      folderPath: folder.fullPath,
    },
  ];
  hiddenFoldersEpoch.update(value => value + 1);
}

export function restoreHiddenFolder(ref: HiddenFolderRef): void {
  let refs = getHiddenFolderRefs();
  let visibleRefs = refs.filter(candidate => !sameFolderRef(candidate, ref));
  if (visibleRefs.length == refs.length) {
    return;
  }
  hiddenFoldersSetting.value = visibleRefs;
  hiddenFoldersEpoch.update(value => value + 1);
}

export function findHiddenFolder(
  accounts: Collection<MailAccount>,
  ref: HiddenFolderRef,
): Folder | null {
  let account = enumerateMailAccounts(accounts).find(a => a.id == ref.accountId);
  return account?.getAllFolders().find(folder => folderMatchesRef(folder, ref)) ?? null;
}

export function hiddenRefLabel(
  ref: HiddenFolderRef,
  accounts?: Collection<MailAccount>,
): string {
  let path = normalizeFolderPath(ref.folderPath) || ref.folderId;
  let accountName = accounts
    ? enumerateMailAccounts(accounts).find(account => account.id == ref.accountId)?.name
    : null;
  return accountName && path ? `${accountName} / ${path}` : path;
}

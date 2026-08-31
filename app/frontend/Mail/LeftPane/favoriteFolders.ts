import { getLocalStorage } from "../../Util/LocalStorage";
import type { MailAccount } from "../../../logic/Mail/MailAccount";
import type { Folder } from "../../../logic/Mail/Folder";
import type { Collection } from "svelte-collections";
import { folderQuickAccessKey } from "./quickAccessUtils";

export interface FavoriteFolderRef {
  accountId: string;
  folderId: string;
  folderPath: string;
}

export const favoriteFoldersSetting = getLocalStorage<FavoriteFolderRef[]>("mail.folders.favorites", []);

export function getFavoriteFolderRefs(): FavoriteFolderRef[] {
  return favoriteFoldersSetting.value ?? [];
}

export function isFavoriteFolderRef(folder: Folder, refs: FavoriteFolderRef[]): boolean {
  if (!folder.id || !folder.account?.id) {
    return false;
  }
  return refs.some(ref =>
    ref.accountId == folder.account.id &&
    (ref.folderId == folder.id || (!!ref.folderPath && ref.folderPath == folder.fullPath)));
}

export function isFavoriteFolder(folder: Folder): boolean {
  return isFavoriteFolderRef(folder, getFavoriteFolderRefs());
}

export function addFavoriteFolder(folder: Folder): void {
  if (!folder.id || !folder.account?.id || folder.account.protocol == "all") {
    return;
  }
  if (isFavoriteFolder(folder)) {
    return;
  }
  favoriteFoldersSetting.value = [
    ...getFavoriteFolderRefs(),
    {
      accountId: folder.account.id,
      folderId: folder.id,
      folderPath: folder.fullPath,
    },
  ];
}

export function removeFavoriteFolder(folder: Folder): void {
  if (!folder.account?.id) {
    return;
  }
  favoriteFoldersSetting.value = getFavoriteFolderRefs().filter(ref =>
    !(ref.accountId == folder.account.id &&
      (ref.folderId == folder.id || (!!ref.folderPath && ref.folderPath == folder.fullPath))));
}

export function toggleFavoriteFolder(folder: Folder): void {
  if (isFavoriteFolder(folder)) {
    removeFavoriteFolder(folder);
  } else {
    addFavoriteFolder(folder);
  }
}

export function resolveFavoriteFolders(
  accounts: Collection<MailAccount>,
  refs: FavoriteFolderRef[] = getFavoriteFolderRefs(),
): Folder[] {
  let resolved: Folder[] = [];
  let seen = new Set<string>();
  for (let ref of refs) {
    let account = accounts.find(a => a.id == ref.accountId);
    if (!account) {
      continue;
    }
    let folder = account.getAllFolders().find(f => f.id == ref.folderId)
      ?? (ref.folderPath ? account.getAllFolders().find(f => f.fullPath == ref.folderPath) : null);
    if (!folder) {
      continue;
    }
    let key = folderQuickAccessKey(folder);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    resolved.push(folder);
  }
  return resolved;
}

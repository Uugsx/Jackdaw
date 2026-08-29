import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { OWAError } from "../../../../logic/Mail/OWA/OWAError";
import { expect, test } from "vitest";

function fakeAccount(response: any): OWAAccount {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = {
    readFolderHierarchy: async () => void 0,
    saveFolder: async () => void 0,
    deleteFolder: async () => void 0,
  } as any;
  (account as any).throttle = { throttle: async () => void 0 };
  (account as any).callOWA = async () => response;
  return account;
}

test("reports a controlled OWA error when the folder root has no ID", async () => {
  let account = fakeAccount({ RootFolder: { Folders: [] } });
  let error: unknown;

  try {
    await account.listFolders();
  } catch (ex) {
    error = ex;
  }

  expect(error).toBeInstanceOf(OWAError);
  expect(error).not.toBeInstanceOf(TypeError);
});

test("loads valid folders and skips entries without a folder ID", async () => {
  let account = fakeAccount({
    RootFolder: {
      ParentFolder: { FolderId: { Id: "root" } },
      Folders: [
        { FolderClass: "IPF.Note", DisplayName: "Malformed" },
        {
          FolderClass: "IPF.Note",
          FolderId: { Id: "inbox" },
          ParentFolderId: { Id: "root" },
          DistinguishedFolderId: "inbox",
          DisplayName: "Inbox",
          TotalCount: 2,
          UnreadCount: 1,
        },
      ],
    },
  });

  await account.listFolders();

  expect(account.getAllFolders().length).toBe(1);
  expect(account.inbox?.id).toBe("inbox");
  expect(account.inbox?.countTotal).toBe(2);
  expect(account.inbox?.countUnread).toBe(1);
});

test("normalizes a stale shared-folder polling offset", async () => {
  let account = fakeAccount({ Folders: [] });
  let folder = account.newFolder();
  folder.id = "folder";
  folder.name = "Shared folder";
  account.rootFolders.add(folder);
  (account as any).pollFolderCountOffset = 1;

  let errors: unknown[] = [];
  account.errorCallback = (error) => errors.push(error);

  await account.refreshAllFolderCounts();

  expect(errors).toEqual([]);
});

test("reuses a folder created by a concurrent hierarchy notification", async () => {
  let account = fakeAccount({ Folders: [{ FolderId: { Id: "folder" } }] });
  account.msgFolderRootID = "root";
  (account as any).callOWA = async () => {
    (account as any).handleHierarchyNotification({
      folderId: "folder",
      parentFolderId: "root",
      displayName: "2",
      unreadCount: 0,
      itemCount: 0,
    });
    return { Folders: [{ FolderId: { Id: "folder" } }] };
  };

  let folder = await account.createToplevelFolder("2");
  let folders = account.rootFolders.filter(candidate => candidate.id == "folder");

  expect(folders.length).toBe(1);
  expect(folders.first).toBe(folder);
  expect(account.folderMap.get("folder")).toBe(folder);
});

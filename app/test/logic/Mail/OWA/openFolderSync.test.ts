import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { OWAEMail } from "../../../../logic/Mail/OWA/OWAEMail";
import { SpecialFolder } from "../../../../logic/Mail/Folder";
import { DummyMailStorage } from "../../../../logic/Mail/Store/DummyMailStorage";
import { ArrayColl } from "svelte-collections";
import { expect, test } from "vitest";

function findItemResponse(itemIDs: string[]): any {
  return {
    RootFolder: {
      Items: itemIDs.map((ItemId) => ({ ItemId: { Id: ItemId } })),
      IncludesLastItemInRange: true,
      TotalItemsInView: itemIDs.length,
    },
  };
}

test("загружает письмо при открытии shared-папки после пустого быстрого поиска", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  account.mainAccount = new OWAAccount();

  let requests: any[] = [];
  (account as any).callOWA = async (request: any) => {
    requests.push(request);
    if (request.action == "GetFolder") {
      return { Folders: [{ TotalCount: 2, UnreadCount: 1 }] };
    }
    if (
      request.action == "FindItem" &&
      request.Body.QueryString == "isread:no"
    ) {
      return findItemResponse([]);
    }
    if (
      request.action == "FindItem" &&
      request.Body.Paging.BasePoint == "End"
    ) {
      return findItemResponse([]);
    }
    if (request.action == "FindItem") {
      return findItemResponse(["new-message", "cached-message"]);
    }
    if (request.action == "GetItem") {
      return {
        Items: [
          {
            ItemId: { Id: "new-message" },
            InternetMessageId: "<new-message@example.test>",
            Subject: "Новое письмо",
            DateTimeSent: "2026-08-28T10:00:00Z",
            DateTimeReceived: "2026-08-28T10:00:00Z",
            IsRead: false,
            ItemClass: "IPM.Note",
          },
        ],
      };
    }
    throw new Error(`Неожиданный запрос OWA: ${request.action}`);
  };

  let folder = account.newFolder();
  folder.id = "errors-wb";
  folder.name = "Ошибки WB";
  (folder as any).haveReadFolder = true;
  folder.countTotal = 2;
  folder.countUnread = 1;

  let cached = folder.newEMail();
  cached.itemID = "cached-message";
  cached.sent = new Date("2026-08-27T10:00:00Z");
  cached.isRead = true;
  folder.messages.add(cached);
  folder.downloadMessages = async (messages: any) => messages;

  await folder.syncOnFolderOpen();

  let newMessage = folder.getEmailByItemID("new-message") as OWAEMail;
  expect(newMessage).toBeDefined();
  expect(newMessage.subject).toBe("Новое письмо");
  expect(folder.messages.length).toBe(2);
  expect(
    requests.some(
      (request) =>
        request.action == "FindItem" &&
        !request.Body.QueryString &&
        request.Body.Paging.BasePoint == "Beginning",
    ),
  ).toBe(true);
});

test("подтягивает письмо в фоновой синхронизации после пустого unread-запроса", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  account.mainAccount = new OWAAccount();

  let requests: any[] = [];
  (account as any).callOWA = async (request: any) => {
    requests.push(request);
    if (
      request.action == "FindItem" &&
      request.Body.QueryString == "isread:no"
    ) {
      return findItemResponse([]);
    }
    if (request.action == "GetFolder") {
      return { Folders: [{ TotalCount: 1, UnreadCount: 1 }] };
    }
    if (request.action == "FindItem") {
      return findItemResponse(["new-message"]);
    }
    if (request.action == "GetItem") {
      return {
        Items: [
          {
            ItemId: { Id: "new-message" },
            InternetMessageId: "<new-message@example.test>",
            Subject: "Новое письмо",
            DateTimeSent: "2026-08-28T10:00:00Z",
            DateTimeReceived: "2026-08-28T10:00:00Z",
            IsRead: false,
            ItemClass: "IPM.Note",
          },
        ],
      };
    }
    throw new Error(`Неожиданный запрос OWA: ${request.action}`);
  };

  let folder = account.newFolder();
  folder.id = "inbox";
  folder.name = "Входящие";
  (folder as any).haveReadFolder = true;
  folder.countTotal = 1;
  folder.countUnread = 1;
  folder.dirty = true;
  folder.downloadMessages = async (messages: any) => messages;

  await folder.syncRecentArrivals();

  expect(folder.getEmailByItemID("new-message")).toBeDefined();
  expect(folder.messages.length).toBe(1);
  expect(
    requests.some(
      (request) =>
        request.action == "FindItem" &&
        !request.Body.QueryString &&
        request.Body.Paging.BasePoint == "End",
    ),
  ).toBe(true);
});

test("запускает синхронизацию входящих после hierarchy-события без счётчиков", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  (account as any).hasLoggedIn = true;

  let folder = account.newFolder();
  folder.id = "inbox";
  folder.name = "Входящие";
  folder.specialFolder = SpecialFolder.Inbox;
  account.rootFolders.add(folder);
  account.folderMap.set(folder.id, folder);

  let syncCount = 0;
  folder.syncRecentArrivals = async () => {
    syncCount++;
    return new ArrayColl();
  };
  (account as any).callOWA = async () => ({
    Folders: [{ TotalCount: 1, UnreadCount: 1 }],
  });

  (account as any).handleHierarchyNotification({
    EventType: "RowModified",
    id: "HierarchyNotification",
    folderId: folder.id,
  });
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(syncCount).toBe(1);
  expect(folder.countTotal).toBe(1);
  expect(folder.countUnread).toBe(1);
});

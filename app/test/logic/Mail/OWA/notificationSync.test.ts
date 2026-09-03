import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { SpecialFolder } from "../../../../logic/Mail/Folder";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { OWAEMail } from "../../../../logic/Mail/OWA/OWAEMail";
import { DummyMailStorage } from "../../../../logic/Mail/Store/DummyMailStorage";
import { ArrayColl } from "svelte-collections";
import { expect, test } from "vitest";
test("помечает письмо из OWA push как новое до добавления в папку", async () => {
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

  let message = folder.newEMail();
  message.itemID = "push-message";
  message.subject = "Новое письмо";
  (folder as any).getNewMessageHeaders = async (ids: string[]) => {
    let result = new ArrayColl<OWAEMail>();
    if (ids.includes(message.itemID as string)) {
      result.add(message);
    }
    return result;
  };
  (folder as any).downloadMessages = async (messages: ArrayColl<OWAEMail>) =>
    messages;
  await account.onNotificationMessages([
    [
      {
        NotificationType: "NewMailNotification",
        FolderId: "inbox",
        ItemId: { Id: "push-message" },
      },
    ],
  ]);

  expect(folder.getEmailByItemID("push-message")).toBe(message);
  expect(message.isNewArrived).toBe(true);
});

test("RowModified на lazy shared-папке обновляет категории через GetItem", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let main = new OWAAccount();
  main.storage = new DummyMailStorage();
  (main as any).hasLoggedIn = true;
  (main as any).notificationChannelReady = true;

  let shared = new OWAAccount();
  shared.storage = new DummyMailStorage();
  shared.mainAccount = main;
  shared.emailAddress = "shared@example.test";
  shared.sharedFolderRoot = "msgfolderroot";
  (shared as any).hasLoggedIn = true;

  let folder = shared.newFolder();
  folder.id = "errors";
  folder.name = "Ошибки";
  shared.folderMap.set(folder.id, folder);
  appGlobal.emailAccounts.addAll([main, shared]);

  let message = folder.newEMail();
  message.itemID = "cached-message";
  message.tags.replaceAll([{ name: "Старая метка", color: "#00aa00" } as any]);
  folder.messages.add(message);

  let refreshed: string[] = [];
  folder.refreshMessages = async (ids: string[]) => {
    refreshed.push(...ids);
    message.setFlags({ Categories: { String: ["Новая метка"] } }, "full");
    await message.storage.saveMessageTags(message);
    return undefined as any;
  };

  await shared.onNotificationMessages([[
    {
      NotificationType: "RowNotification",
      EventType: "RowModified",
      FolderId: folder.id,
      ItemId: { Id: message.itemID },
      Categories: { String: ["Новая метка"] },
    },
  ]]);

  expect(refreshed).toContain(message.itemID);
  expect(message.tags.contents.map(tag => tag.name)).toEqual(["Новая метка"]);
});

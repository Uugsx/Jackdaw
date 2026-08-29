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

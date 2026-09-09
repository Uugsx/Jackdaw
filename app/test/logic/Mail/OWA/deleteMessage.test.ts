import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { DummyMailStorage } from "../../../../logic/Mail/Store/DummyMailStorage";
import { DeleteStrategy } from "../../../../logic/Mail/MailAccount";
import { SpecialFolder } from "../../../../logic/Mail/Folder";
import { expect, test } from "vitest";

test("очистка корзины удаляет элементы календаря без отправки отмен", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  let folder = account.newFolder();
  folder.specialFolder = SpecialFolder.Trash;
  folder.releaseDeletionAfterGracePeriod = () => {};

  let request: any;
  (account as any).callOWA = async (nextRequest: any) => {
    request = nextRequest;
  };

  let message = folder.newEMail();
  message.itemID = "calendar-item";
  folder.messages.add(message);

  await folder.clearFolder();

  expect(request.action).toBe("DeleteItem");
  expect(request.Body.DeleteType).toBe("HardDelete");
  expect(request.Body.SendMeetingCancellations).toBe("SendToNone");
  expect(request.Body.SuppressReadReceipts).toBe(true);
  expect(folder.messages.isEmpty).toBe(true);
});

test("удаление письма через OWA сохраняет параметр отмен встреч", async () => {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = new DummyMailStorage();
  let folder = account.newFolder();
  folder.releaseDeletionAfterGracePeriod = () => {};

  let request: any;
  (account as any).callOWA = async (nextRequest: any) => {
    request = nextRequest;
  };

  let message = folder.newEMail();
  message.itemID = "message";

  await message.deleteMessageOnServer(DeleteStrategy.MoveToTrash);

  expect(request.Body.DeleteType).toBe("MoveToDeletedItems");
  expect(request.Body.SendMeetingCancellations).toBe("SendToNone");
});

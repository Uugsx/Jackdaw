import "../../../../logic/app";
import { appGlobal } from "../../../../logic/app";
import { OWAAccount } from "../../../../logic/Mail/OWA/OWAAccount";
import { expect, test } from "vitest";

function fakeAccount(): OWAAccount {
  appGlobal.remoteApp = { OWA: {} };
  let account = new OWAAccount();
  account.storage = {
    readFolderHierarchy: async () => void 0,
    saveFolder: async () => void 0,
    deleteFolder: async () => void 0,
  } as any;
  return account;
}

test("inserts newly arrived messages according to the folder sort order", () => {
  let account = fakeAccount();
  let folder = account.newFolder();
  folder.id = "inbox";
  folder.name = "Inbox";

  let existing = folder.newEMail();
  existing.itemID = "old-message";
  existing.sent = new Date("2026-08-27T22:00:00Z");
  folder.messages.addAll([existing]);

  let incoming = folder.newEMail();
  incoming.itemID = "new-message";
  incoming.sent = new Date("2026-08-27T23:09:00Z");
  folder.addMessagesIfAbsent([incoming, incoming]);

  expect(folder.messages.contents).toEqual([incoming, existing]);
});

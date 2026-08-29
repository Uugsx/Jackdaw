import "../../../logic/app";
import { DummyMailStorage } from "../../../logic/Mail/Store/DummyMailStorage";
import { Folder, SpecialFolder } from "../../../logic/Mail/Folder";
import { MailAccount } from "../../../logic/Mail/MailAccount";
import { expect, test } from "vitest";

function newAccount(): MailAccount {
  let account = new MailAccount();
  account.storage = new DummyMailStorage();
  return account;
}

function newFolder(account: MailAccount, name: string, id: string): Folder {
  let folder = account.newFolder();
  folder.name = name;
  folder.id = id;
  return folder;
}

test("перемещает папку в цель и не допускает циклическую иерархию", async () => {
  let account = newAccount();
  let inbox = newFolder(account, "Inbox", "inbox");
  inbox.specialFolder = SpecialFolder.Inbox;
  let source = newFolder(account, "Source", "source");
  let target = newFolder(account, "Target", "target");
  account.rootFolders.addAll([inbox, source, target]);

  await target.moveFolderHere(source);

  expect(account.rootFolders.contains(source)).toBe(false);
  expect(target.subFolders.contains(source)).toBe(true);
  expect(source.parent).toBe(target);
  await expect(source.moveFolderHere(target)).rejects.toThrow("subfolders");
});

test("перемещает папку вверх/вниз и сохраняет пользовательский порядок", async () => {
  let account = newAccount();
  let alpha = newFolder(account, "Alpha", "alpha");
  let bravo = newFolder(account, "Bravo", "bravo");
  let charlie = newFolder(account, "Charlie", "charlie");
  account.rootFolders.addAll([alpha, bravo, charlie]);

  await charlie.moveSibling("up");

  expect(account.rootFolders.contents).toEqual([alpha, charlie, bravo]);
  expect(charlie.sortOrder).toBe(1);
  expect(alpha.sortOrder).toBe(0);
  expect(bravo.sortOrder).toBe(2);

  let restored = newFolder(account, "Restored", "restored");
  restored.fromExtraJSON({ sortOrder: 0 });
  expect(restored.sortOrder).toBe(0);
});

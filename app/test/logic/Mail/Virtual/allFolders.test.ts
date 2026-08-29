import "../../../../logic/app";
import { ArrayColl } from "svelte-collections";
import { AllAccounts } from "../../../../logic/Mail/Virtual/AllAccounts";
import { Folder, SpecialFolder } from "../../../../logic/Mail/Folder";
import { MailAccount } from "../../../../logic/Mail/MailAccount";
import { expect, test } from "vitest";

test("пересчитывает unread-счётчик общей папки после изменения ящика", () => {
  let accounts = new ArrayColl<MailAccount>();
  let allAccounts = new AllAccounts(accounts);

  let firstAccount = new MailAccount();
  let firstInbox = new Folder(firstAccount);
  firstInbox.specialFolder = SpecialFolder.Inbox;
  firstInbox.countUnread = 2;
  firstAccount.rootFolders.add(firstInbox);

  let secondAccount = new MailAccount();
  let secondInbox = new Folder(secondAccount);
  secondInbox.specialFolder = SpecialFolder.Inbox;
  secondInbox.countUnread = 1;
  secondAccount.rootFolders.add(secondInbox);

  accounts.add(firstAccount);
  accounts.add(secondAccount);

  let allInbox = allAccounts.getSpecialFolder(SpecialFolder.Inbox);
  expect(allInbox.countUnread).toBe(3);

  firstInbox.countUnread = 4;
  expect(allInbox.countUnread).toBe(5);

  secondInbox.countNewArrived = 2;
  expect(allInbox.countNewArrived).toBe(2);
});

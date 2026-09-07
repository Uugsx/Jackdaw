import "../../../logic/app";
import { EMail } from "../../../logic/Mail/EMail";
import { Folder } from "../../../logic/Mail/Folder";
import { MailAccount } from "../../../logic/Mail/MailAccount";
import { expect, test } from "vitest";

test("clears the new-arrival badge when the last unread message is read", async () => {
  let folder = new Folder(new MailAccount());
  let message = new EMail(folder);
  folder.countUnread = 1;
  folder.countNewArrived = 1;

  await message.markRead(true);

  expect(message.isRead).toBe(true);
  expect(folder.countUnread).toBe(0);
  expect(folder.countNewArrived).toBe(0);
});

test("marking a message unread updates only the unread count", async () => {
  let folder = new Folder(new MailAccount());
  let message = new EMail(folder);
  message.isRead = true;

  await message.markRead(false);

  expect(message.isRead).toBe(false);
  expect(folder.countUnread).toBe(1);
  expect(folder.countNewArrived).toBe(0);
});

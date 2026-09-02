// @vitest-environment happy-dom

import "../../../logic/app";
import { ChatMessage } from "../../../logic/Chat/ChatMessage";
import { ContactEntry, Person } from "../../../logic/Abstract/Person";
import { PersonUID, kDummyPerson } from "../../../logic/Abstract/PersonUID";
import { Folder, SpecialFolder } from "../../../logic/Mail/Folder";
import { MailAccount } from "../../../logic/Mail/MailAccount";
import { MailIdentity } from "../../../logic/Mail/MailIdentity";
import { EMail } from "../../../logic/Mail/EMail";
import { DummyMailStorage } from "../../../logic/Mail/Store/DummyMailStorage";
import {
  MailChatRoom,
  isConcreteMailAccount,
  isOutgoingMail,
  mailChatContactForMessage,
  mailChatContactMatches,
  resolveMailChatContact,
} from "../../../frontend/Mail/MailChat/MailChatRoom";
import { ArrayColl } from "svelte-collections";
import { expect, test, vi } from "vitest";

let localStorageValues = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
  },
});

class TestMailStorage extends DummyMailStorage {
  supportsAttachments = true;
}

class TestMailAccount extends MailAccount {
  sent: EMail[] = [];

  constructor() {
    super();
    this.name = "Test mail";
    this.emailAddress = "me@example.test";
    this.realname = "Me";
    this.storage = new TestMailStorage();
    this.errorCallback = () => {};

    let identity = new MailIdentity(this);
    identity.emailAddress = this.emailAddress;
    identity.realname = this.realname;
    this.identities.add(identity);

    let sent = this.newFolder();
    sent.name = "Sent";
    sent.specialFolder = SpecialFolder.Sent;
    this.rootFolders.add(sent);
  }

  override async send(email: EMail): Promise<void> {
    this.sent.push(email);
  }
}

function sourceMail(account: TestMailAccount, contact: PersonUID): EMail {
  let inbox = new Folder(account);
  inbox.name = "Inbox";
  inbox.specialFolder = SpecialFolder.Inbox;
  account.rootFolders.add(inbox);

  let source = inbox.newEMail();
  source.id = "source@example.test";
  source.from = contact;
  source.to.add(new PersonUID(account.emailAddress, account.realname));
  source.contact = contact;
  source.subject = "Вопрос";
  source.sent = new Date("2026-08-31T09:00:00Z");
  source.received = new Date("2026-08-31T09:00:01Z");
  source.loadedBody = true;
  return source;
}

test("mail chat sends a real threaded email and keeps attachments", async () => {
  let account = new TestMailAccount();
  let contact = new PersonUID("friend@example.test", "Friend");
  let source = sourceMail(account, contact);
  let reply = account.newEMailFrom();
  reply.subject = "Re: Вопрос";
  reply.inReplyTo = source.id;
  reply.references = [source.id];
  reply.to.add(kDummyPerson);
  let send = vi.fn(async () => account.send(reply));
  Object.defineProperty(reply, "compose", { configurable: true, value: { send } });
  Object.defineProperty(source, "compose", {
    configurable: true,
    value: { replyToAuthor: () => reply },
  });
  let room = new MailChatRoom(account, contact, new ArrayColl([source]));
  let draft = room.newMessage();

  expect(draft).toBeInstanceOf(EMail);
  draft.rawHTMLDangerous = "<p>Быстрый ответ</p>";
  draft.sent = new Date("2026-09-01T09:00:00Z");
  let attachment = draft.newAttachment();
  attachment.fromFile(new File(["gif"], "reply.gif", { type: "image/gif" }));
  draft.attachments.add(attachment);

  await room.sendMessage(draft);

  expect(send).toHaveBeenCalledOnce();
  expect(account.sent).toHaveLength(1);
  let sent = account.sent[0];
  expect(sent).toBeInstanceOf(EMail);
  expect(sent).not.toBeInstanceOf(ChatMessage);
  expect(sent.to.first.emailAddress).toBe(contact.emailAddress);
  expect(sent.subject).toBe("Re: Вопрос");
  expect(sent.inReplyTo).toBe(source.id);
  expect(sent.references).toEqual([source.id]);
  expect(sent.rawHTMLDangerous).toContain("Быстрый ответ");
  expect(sent.attachments).toHaveLength(1);
  expect(sent.attachments.first.message).toBe(sent);
  expect(sent.attachments.first.filename).toBe("reply.gif");
  expect(room.messages.last).toBe(sent);
  expect(account.findSpecialFolder(SpecialFolder.Sent)?.messages.contains(sent)).toBe(true);
  room.destroy();
});

test("mail chat follows source changes without duplicating a server copy", () => {
  let account = new TestMailAccount();
  let contact = new PersonUID("friend@example.test", "Friend");
  let source = sourceMail(account, contact);
  let sourceMessages = new ArrayColl([source]);
  let room = new MailChatRoom(account, contact, sourceMessages);

  let sentFolder = account.findSpecialFolder(SpecialFolder.Sent)!;
  let sent = sentFolder.newEMail();
  sent.id = "reply@example.test";
  sent.from = new PersonUID(account.emailAddress, account.realname);
  sent.to.add(contact);
  sent.sent = new Date("2026-09-01T09:00:00Z");
  sent.outgoing = true;
  sourceMessages.add(sent);

  let serverCopy = sentFolder.newEMail();
  serverCopy.id = sent.id;
  serverCopy.from = sent.from;
  serverCopy.to.add(contact);
  serverCopy.sent = sent.sent;
  serverCopy.outgoing = true;
  sourceMessages.add(serverCopy);

  expect(room.messages).toHaveLength(2);
  expect(room.messages.contents).toContain(sent);
  expect(room.messages.contents).not.toContain(serverCopy);

  sourceMessages.remove(sent);
  expect(room.messages).toHaveLength(1);

  room.destroy();
  sourceMessages.add(serverCopy);
  expect(room.messages).toHaveLength(1);
});

test("mail chat uses the recipient for a sent-folder message", () => {
  let account = new TestMailAccount();
  let contact = new PersonUID("friend@example.test", "Friend");
  let sent = account.findSpecialFolder(SpecialFolder.Sent)!.newEMail();
  sent.from = new PersonUID(account.emailAddress, account.realname);
  sent.to.add(contact);
  sent.sent = new Date("2026-09-01T09:00:00Z");

  expect(mailChatContactForMessage(sent)).toBe(contact);
});

test("mail chat detects outgoing messages from their special folder", () => {
  let account = new TestMailAccount();
  let sent = account.findSpecialFolder(SpecialFolder.Sent)!.newEMail();

  expect(sent.outgoing).toBe(false);
  expect(isOutgoingMail(sent)).toBe(true);
});

test("mail chat detects outgoing mail by the account sender address", () => {
  let account = new TestMailAccount();
  let inbox = new Folder(account);
  inbox.name = "Inbox";
  inbox.specialFolder = SpecialFolder.Inbox;
  let mail = inbox.newEMail();
  mail.from = new PersonUID(account.emailAddress, account.realname);
  mail.to.add(new PersonUID("friend@example.test", "Friend"));
  mail.outgoing = false;

  expect(isOutgoingMail(mail, account)).toBe(true);
});

test("mail chat detects outgoing mail regardless of address casing", () => {
  let account = new TestMailAccount();
  let inbox = new Folder(account);
  inbox.name = "Inbox";
  inbox.specialFolder = SpecialFolder.Inbox;
  let mail = inbox.newEMail();
  mail.from = new PersonUID("ME@EXAMPLE.TEST", account.realname);
  mail.to.add(new PersonUID("friend@example.test", "Friend"));

  expect(isOutgoingMail(mail, account)).toBe(true);
});

test("mail account recognizes its own address regardless of address casing", () => {
  let account = new TestMailAccount();

  expect(account.isMyEMailAddress("ME@EXAMPLE.TEST")).toBe(true);
  expect(account.isMyEMailAddress(null as any)).toBe(false);
});

test("mail chat uses the message account when the display account differs", () => {
  let account = new TestMailAccount();
  let otherAccount = new TestMailAccount();
  let inbox = new Folder(account);
  inbox.name = "Inbox";
  inbox.specialFolder = SpecialFolder.Inbox;
  account.rootFolders.add(inbox);
  let mail = inbox.newEMail();
  mail.from = new PersonUID(account.emailAddress, account.realname);
  mail.to.add(new PersonUID("friend@example.test", "Friend"));

  expect(isOutgoingMail(mail, otherAccount)).toBe(true);
});

test("mail chat contact collection includes messages loaded after initialization", () => {
  let account = new TestMailAccount();
  let contact = new PersonUID("friend@example.test", "Friend");
  let sourceMessages = new ArrayColl<EMail>();
  let persons = sourceMessages
    .map(mailChatContactForMessage)
    .filterObservable(Boolean)
    .unique();

  expect(persons).toHaveLength(0);
  sourceMessages.add(sourceMail(account, contact));

  expect(persons).toHaveLength(1);
  expect(persons.first).toBe(contact);
});

test("mail chat never treats the virtual all-accounts account as sendable", async () => {
  let allAccounts = { protocol: "all" } as MailAccount;
  let room = new MailChatRoom(allAccounts, new PersonUID("friend@example.test", "Friend"), new ArrayColl());

  await expect(room.sendMessage(room.newMessage())).rejects.toThrow("concrete mail account");
  expect(isConcreteMailAccount(allAccounts)).toBe(false);
  expect(isConcreteMailAccount({ protocol: "imap" } as MailAccount)).toBe(true);
});

test("mail chat resolves an address-book person to its email address", () => {
  let account = new TestMailAccount();
  let contact = new Person();
  contact.name = "G N";
  contact.emailAddresses.add(new ContactEntry("galkynnikita@gmail.com", "primary"));
  let source = sourceMail(account, new PersonUID("galkynnikita@gmail.com", "G N"));
  source.contact = contact;
  let messages = new ArrayColl([source]);

  expect(mailChatContactMatches(source, contact)).toBe(true);
  expect(resolveMailChatContact(contact, messages)?.emailAddress).toBe("galkynnikita@gmail.com");

  let room = new MailChatRoom(account, contact, messages);
  let draft = room.newMessage() as EMail;
  expect((draft.contact as PersonUID).emailAddress).toBe("galkynnikita@gmail.com");
});

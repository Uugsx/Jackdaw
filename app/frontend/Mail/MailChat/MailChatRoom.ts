import { ChatRoom } from "../../../logic/Chat/ChatRoom";
import type { ChatMessage } from "../../../logic/Chat/ChatMessage";
import { EMail } from "../../../logic/Mail/EMail";
import { SpecialFolder } from "../../../logic/Mail/Folder";
import type { MailAccount } from "../../../logic/Mail/MailAccount";
import { PersonUID, kDummyPerson } from "../../../logic/Abstract/PersonUID";
import { Person } from "../../../logic/Abstract/Person";
import { convertTextToHTML } from "../../../logic/util/convertHTML";
import { randomID } from "../../../logic/util/util";
import type { Collection } from "svelte-collections";

export type MailChatContact = PersonUID | Person;

export function isConcreteMailAccount(account: MailAccount | null | undefined): account is MailAccount {
  return !!account && account.protocol != "all";
}

function isUsableEmailAddress(emailAddress: string | null | undefined): emailAddress is string {
  return !!emailAddress && emailAddress != kDummyPerson.emailAddress;
}

function isAccountEmailAddress(account: MailAccount, emailAddress: string | null | undefined): boolean {
  if (!isUsableEmailAddress(emailAddress)) {
    return false;
  }
  let normalizedAddress = emailAddress.toLowerCase();
  return [account.emailAddress, ...account.identities.contents.map(identity => identity.emailAddress)]
    .some(address => isUsableEmailAddress(address) && address.toLowerCase() == normalizedAddress);
}

/** True when a mail belongs to our outgoing stream, even if its model flag is stale. */
export function isOutgoingMail(
  message: EMail,
  account: MailAccount | null | undefined = message.folder?.account,
): boolean {
  let specialFolder = message.folder?.specialFolder;
  let senderAddress = message.from?.emailAddress;
  let senderBelongsToAccount = [account, message.folder?.account]
    .filter((candidate, index, candidates) => candidate && candidates.indexOf(candidate) == index)
    .some(candidate => isConcreteMailAccount(candidate) && isAccountEmailAddress(candidate, senderAddress));
  return message.outgoing || message.isDraft || specialFolder == SpecialFolder.Sent ||
    specialFolder == SpecialFolder.Drafts || specialFolder == SpecialFolder.Outbox ||
    senderBelongsToAccount;
}

function messageContact(message: EMail): PersonUID | null {
  let correspondent = isOutgoingMail(message) ? message.to.first : message.from;
  if (isUsableEmailAddress(correspondent?.emailAddress)) {
    return correspondent;
  }
  let contact = message.contact;
  if (contact instanceof PersonUID && isUsableEmailAddress(contact.emailAddress)) {
    return contact;
  }
  if (contact instanceof Person) {
    let email = contact.emailAddresses.find(entry => isUsableEmailAddress(entry.value));
    if (email) {
      return PersonUID.fromContactEntry(contact, email);
    }
  }
  return null;
}

function mailIdentityKey(message: EMail): string | null {
  if (message.messageID) {
    return `message-id:${message.messageID.toLowerCase()}`;
  }
  if (message.pID != null) {
    return `protocol-id:${message.folder?.account?.emailAddress ?? ""}:${message.folder?.id ?? ""}:${String(message.pID)}`;
  }
  return null;
}

export function mailChatContactForMessage(message: EMail): PersonUID | null {
  let correspondent = messageContact(message);
  if (correspondent && message.contact instanceof Person && !correspondent.person) {
    correspondent.person = message.contact;
  }
  return correspondent;
}

export function mailChatContactMatches(message: EMail, contact: MailChatContact | null | undefined): boolean {
  if (!contact) {
    return false;
  }
  if (message.contact == contact) {
    return true;
  }
  let correspondent = messageContact(message);
  if (!correspondent) {
    return false;
  }
  if (contact instanceof Person) {
    return correspondent.person == contact || correspondent.matchesPerson(contact);
  }
  return isUsableEmailAddress(contact.emailAddress) &&
    correspondent.emailAddress.toLowerCase() == contact.emailAddress.toLowerCase();
}

export function resolveMailChatContact(contact: MailChatContact, messages: Collection<EMail>): PersonUID | null {
  let matchingMessage = messages.contents.find(message => mailChatContactMatches(message, contact));
  let messageRecipient = matchingMessage && messageContact(matchingMessage);
  if (messageRecipient) {
    return messageRecipient;
  }
  if (contact instanceof PersonUID && isUsableEmailAddress(contact.emailAddress)) {
    return contact;
  }
  if (contact instanceof Person) {
    let email = contact.emailAddresses.find(entry => isUsableEmailAddress(entry.value));
    if (email) {
      return PersonUID.fromContactEntry(contact, email);
    }
  }
  return null;
}

/** Преобразует черновик общего редактора чата в черновик письма. */
export function prepareMailChatReply(
  account: MailAccount,
  contact: PersonUID,
  source: EMail | null,
  draft: ChatMessage,
): EMail {
  let reply = source ? source.compose.replyToAuthor() : account.newEMailFrom();
  // A chat reply is a direct message to the selected contact. `replyToAuthor()`
  // can reuse a stale or synthetic recipient from the source message (for
  // example `unknown@invalid`), so never let it override the resolved address.
  reply.to.clear();
  reply.cc.clear();
  reply.bcc.clear();
  reply.to.add(contact);

  reply.rawHTMLDangerous = draft.rawHTMLDangerous || convertTextToHTML(draft.text);
  reply.attachments.addAll(draft.attachments.map(attachment => attachment.cloneTo(reply)));
  reply.outgoing = true;
  reply.contact = contact;
  reply.sent = draft.sent ?? new Date();
  reply.received = draft.received ?? reply.sent;
  return reply;
}

export class MailChatRoom extends ChatRoom {
  private sourceMessages: Collection<EMail> | null = null;
  private readonly sourceObserver = {
    added: (messages: EMail[]) => this.addSourceMessages(messages),
    removed: (messages: EMail[]) => this.removeSourceMessages(messages),
  };

  constructor(account: MailAccount, person: MailChatContact, messages: Collection<EMail>) {
    super(account as any);
    this.id = randomID();
    this.contact = person as any;
    this.sourceMessages = messages;
    this.addSourceMessages(messages.contents);
    messages.registerObserver(this.sourceObserver as any);
  }

  private addSourceMessages(messages: EMail[]): void {
    let current = this.messages.contents as any as EMail[];
    let existingKeys = new Set<string>();
    for (let message of current) {
      let key = mailIdentityKey(message);
      if (key) {
        existingKeys.add(key);
      }
    }

    let added: EMail[] = [];
    for (let message of messages) {
      if (current.includes(message)) {
        continue;
      }
      let key = mailIdentityKey(message);
      if (key && existingKeys.has(key)) {
        continue;
      }
      current.push(message);
      if (key) {
        existingKeys.add(key);
      }
      added.push(message);
    }
    if (added.length) {
      this.messages.addAll(added as any);
      this.updateLastMessage();
    }
  }

  private removeSourceMessages(messages: EMail[]): void {
    let current = this.messages.contents as any as EMail[];
    let removed = current.filter(message => messages.includes(message));
    if (removed.length) {
      this.messages.removeAll(removed as any);
      this.updateLastMessage();
    }
  }

  private updateLastMessage(): void {
    let latest = (this.messages.contents as any as EMail[])
      .filter(message => message instanceof EMail)
      .reduce<EMail | null>((current, message) => {
        let messageTime = message.sent?.getTime() ?? 0;
        let currentTime = current?.sent?.getTime() ?? 0;
        return !current || messageTime > currentTime ? message : current;
      }, null);
    this.lastMessage = latest as any;
  }

  destroy(): void {
    this.sourceMessages?.unregisterObserver(this.sourceObserver as any);
    this.sourceMessages = null;
  }
  override newMessage(): ChatMessage {
    let account = this.account as any as MailAccount;
    if (!isConcreteMailAccount(account)) {
      return super.newMessage();
    }
    let draft = account.newEMailFrom();
    draft.rawHTMLDangerous = "";
    let contact = resolveMailChatContact(this.contact as MailChatContact, this.messages as any);
    draft.contact = contact ?? this.contact as any;
    return draft as any;
  }
  async sendMessage(message: ChatMessage): Promise<void> {
    let account = this.account as any as MailAccount;
    if (!isConcreteMailAccount(account)) {
      throw new Error("Mail conversation requires a concrete mail account");
    }
    let contact = resolveMailChatContact(this.contact as MailChatContact, this.messages as any);
    if (!contact) {
      throw new Error("Mail conversation contact has no email address");
    }
    let source = this.messages.contents
      .filter(item => item instanceof EMail)
      .reduce<EMail | undefined>((latest, item) =>
        !latest || item.sent.getTime() > latest.sent.getTime() ? item : latest,
        undefined,
      );
    if (source?.folder?.account != account) {
      source = undefined;
    }

    let reply = prepareMailChatReply(account, contact, source ?? null, message);
    await reply.compose.send();

    // Some protocols refresh Sent asynchronously and some do not add a local
    // copy at all. Keep the sent copy in the folder collection so the room and
    // the mail views observe the same message immediately after a successful send.
    let sentFolder = account.findSpecialFolder(SpecialFolder.Sent);
    if (sentFolder) {
      reply.folder = sentFolder;
      if (!sentFolder.messages.contains(reply)) {
        sentFolder.messages.add(reply);
      }
    }
    this.addSourceMessages([reply]);
  }
}

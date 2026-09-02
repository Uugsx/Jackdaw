<Splitter name="persons-list" initialRightRatio={4}>
  <vbox class="left-pane" slot="left">
    <hbox class="buttons">
      <AccountDropDown
        bind:selectedAccount={$selectedAccount}
        accounts={accounts}
        filterByWorkspace={true}
        />
      <hbox flex class="spacer" />
      <WriteButton account={$selectedAccount} />
    </hbox>
    <PersonsList persons={persons as any} bind:selected={selectedPerson} bind:selectedPersons />
    <ViewSwitcher />
  </vbox>
  <vbox class="right-pane" slot="right">
    {#if chatMessages && selectedPerson && chatRoom}
      <Header person={selectedPerson as any} />
      <vbox flex class="messages background-pattern">
        <MessageList messages={chatMessages}>
          <svelte:fragment slot="message" let:message let:previousMessage>
            {@const mail = message as EMail}
            <MailMessage message={mail} {previousMessage} {account} />
          </svelte:fragment>
        </MessageList>
      </vbox>
      <vbox class="editor">
        <MsgEditor to={chatRoom} />
      </vbox>
    {/if}
  </vbox>
</Splitter>

<script lang="ts">
  import { isConcreteMailAccount, mailChatContactForMessage, mailChatContactMatches, MailChatRoom, type MailChatContact } from "./MailChatRoom";
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import { SpecialFolder, type Folder } from "../../../logic/Mail/Folder";
  import { OWAFolder } from "../../../logic/Mail/OWA/OWAFolder";
  import type { EMail } from "../../../logic/Mail/EMail";
  import type { PersonUID } from "../../../logic/Abstract/PersonUID";
  import { mailChatEntryMessage, selectedAccount } from "../Selected";
  import { globalSearchTerm } from "../../AppsBar/selectedApp";
  import PersonsList from "../../Contacts/Person/PersonsList.svelte";
  import Header from "../../Chat/PersonHeader.svelte";
  import MessageList from "../../Chat/MessageView/MessageList.svelte";
  import MailMessage from "./MailMessage.svelte";
  import MsgEditor from "../../Chat/MsgEditor.svelte";
  import ViewSwitcher from "../LeftPane/ViewSwitcher.svelte";
  import WriteButton from "../LeftPane/WriteButton.svelte";
  import AccountDropDown from "../../Shared/AccountDropDown.svelte";
  import Splitter from "../../Shared/Splitter.svelte";
  import { ArrayColl, Collection, mergeColls } from 'svelte-collections';
  import { onDestroy } from "svelte";

  export let accounts: Collection<MailAccount>; /** in */

  let selectedPerson: any;
  let selectedPersons = new ArrayColl<any>();
  $: realAccounts = accounts.filterObservable(isConcreteMailAccount);
  $: messageAccounts = isConcreteMailAccount($selectedAccount)
    ? new ArrayColl<MailAccount>([$selectedAccount])
    : realAccounts;
  $: folders = mergeColls<Folder>(messageAccounts.map(account => account.rootFolders));
  $: allMessages = mergeColls<EMail>(folders.map(folder => folder.messages)).sortBy(msg => -msg.sent.getTime());
  $: persons = allMessages.map(mailChatContactForMessage).filterObservable(Boolean).unique() as Collection<PersonUID>;
  $: personMessages = allMessages.filterObservable(msg => mailChatContactMatches(msg, selectedPerson));
  $: applyChatEntryMessage($mailChatEntryMessage);
  $: $folders, loadMailChatFolders(messageAccounts);
  $: account = isConcreteMailAccount($selectedAccount)
    ? $selectedAccount
    : isConcreteMailAccount(personMessages.first?.folder?.account)
      ? personMessages.first.folder.account
      : realAccounts.first;
  let chatRoom: MailChatRoom | null = null;
  let chatRoomAccount: MailAccount | null | undefined;
  let chatRoomPerson: MailChatContact | null = null;
  let chatRoomMessages: Collection<EMail> | null = null;
  $: updateChatRoom(account, selectedPerson, personMessages);
  $: chatMessages = chatRoom
    ? ($globalSearchTerm
      ? chatRoom.messages.filterObservable(msg => msg.text?.toLowerCase().includes($globalSearchTerm))
      : chatRoom.messages) as any as Collection<EMail>
    : null;

  function applyChatEntryMessage(message: EMail | null): void {
    if (!message) {
      return;
    }
    let contact = mailChatContactForMessage(message);
    if (contact) {
      selectedPerson = contact;
    }
  }

  let requestedChatFolders = new WeakSet<Folder>();
  let requestedChatAccounts = new WeakSet<MailAccount>();

  function loadMailChatFolders(accounts: Collection<MailAccount>): void {
    for (let account of accounts) {
      if (requestedChatAccounts.has(account)) {
        continue;
      }
      requestedChatAccounts.add(account);
      loadMailChatAccountFolders(account).catch(ex => {
        requestedChatAccounts.delete(account);
        account.errorCallback(ex);
      });
    }
  }

  async function loadMailChatAccountFolders(account: MailAccount): Promise<void> {
    // Chat can be opened before the account startup has finished rebuilding
    // its hierarchy. Read the cached hierarchy first so Sent is not missed
    // when the first reactive pass only sees Inbox.
    await account.readFromDB();
    let inbox = account.findSpecialFolder(SpecialFolder.Inbox);
    let sent = account.findSpecialFolder(SpecialFolder.Sent);
    if (!inbox || !sent) {
      await account.listFolders();
      inbox = account.findSpecialFolder(SpecialFolder.Inbox);
      sent = account.findSpecialFolder(SpecialFolder.Sent);
    }
    requestMailChatFolder(inbox);
    requestMailChatFolder(sent);
  }

  function requestMailChatFolder(folder: Folder | null): void {
    if (!folder || requestedChatFolders.has(folder)) {
      return;
    }
    requestedChatFolders.add(folder);
    loadMailChatFolder(folder).catch(ex => {
      requestedChatFolders.delete(folder);
      folder.account.errorCallback(ex);
    });
  }

  async function loadMailChatFolder(folder: Folder): Promise<void> {
    if (folder instanceof OWAFolder) {
      await folder.syncOnFolderOpen();
      folder.notifyObservers();
      return;
    }
    let newMessages = await folder.listMessages();
    await folder.downloadMessages(newMessages);
  }

  function updateChatRoom(account: MailAccount | null | undefined, person: MailChatContact | null, messages: Collection<EMail>): void {
    if (chatRoom && chatRoomAccount == account && chatRoomPerson == person && chatRoomMessages == messages) {
      return;
    }
    chatRoom?.destroy();
    chatRoomAccount = account;
    chatRoomPerson = person;
    chatRoomMessages = messages;
    chatRoom = account && person
      ? new MailChatRoom(account, person, messages)
      : null;
  }

  onDestroy(() => {
    chatRoom?.destroy();
    chatRoom = null;
    chatRoomAccount = null;
    chatRoomPerson = null;
    chatRoomMessages = null;
  });
</script>

<style>
  .left-pane {
    box-shadow: 2px 0px 6px 0px rgba(0, 0, 0, 10%); /* Also on MessageList */
    background-color: var(--leftbar-bg);
    color: var(--leftbar-fg);
  }
  .right-pane {
    min-height: 0;
    min-width: 0;
  }
  .messages {
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
  }
  .messages :global(.background),
  .messages :global(.scroll),
  .messages :global(.inside),
  .messages :global(.messages) {
    width: 100%;
    min-width: 0;
  }
  .editor {
    flex: 0 0 auto;
    height: max-content;
    min-height: 126px;
    min-width: 0;
  }
  .editor > :global(.container) {
    flex: 0 0 auto;
  }
  .buttons {
    margin: 10px 16px;
    justify-content: end;
  }
  .buttons :global(svg) {
    margin: 4px;
  }
  .spacer {
    min-width: 8px;
  }
</style>

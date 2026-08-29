<vbox class="mail-start-page" flex>
  <vbox class="content">
    <hbox class="title">{$t`No message selected`}</hbox>
    <hbox class="subtitle">{$t`Select a message from the list, or write a new email.`}</hbox>
    <hbox class="actions">
      {#if $selectedAccount}
        <Button
          label={$t`New email`}
          icon={MailPlusIcon}
          classes="primary"
          onClick={newMail} />
      {/if}
      {#if $selectedFolder}
        <Button
          label={$t`Get mail`}
          icon={RefreshIcon}
          onClick={getMail} />
      {/if}
    </hbox>
  </vbox>
</vbox>

<script lang="ts">
  import { selectedAccount, selectedFolder } from "./Selected";
  import { mailApp } from "./MailJackdawApp";
  import Button from "../Shared/Button.svelte";
  import MailPlusIcon from "lucide-svelte/icons/mail-plus";
  import RefreshIcon from "lucide-svelte/icons/refresh-cw";
  import { catchErrors } from "../Util/error";
  import { assert } from "../../logic/util/util";
  import { t, gt } from "../../l10n/l10n";

  function newMail() {
    catchErrors(() => {
      assert($selectedAccount, gt`Please select a mail account first`);
      mailApp.writeMail($selectedAccount.newEMailFrom());
    });
  }

  async function getMail() {
    await catchErrors(async () => {
      assert($selectedFolder, gt`Please select a folder first`);
      let account = $selectedFolder.account;
      if (!account.isLoggedIn) {
        await account.login(true);
      }
      await $selectedFolder.fetchNewMailQuick();
    });
  }
</script>

<style>
  .mail-start-page {
    position: relative;
    z-index: 1;
    align-items: center;
    justify-content: center;
    padding: 2em;
    background-color: transparent;
    color: var(--main-fg);
  }
  .content {
    align-items: center;
    gap: 12px;
    max-width: 28em;
    text-align: center;
  }
  .title {
    font-size: 1.25em;
    font-weight: 600;
  }
  .subtitle {
    opacity: 0.7;
    line-height: 1.4;
  }
  .actions {
    gap: 8px;
    margin-block-start: 8px;
    justify-content: center;
  }
</style>

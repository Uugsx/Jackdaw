{#if showLabel}
  <Button
    label={$t`Compose`}
    icon={ComposeIcon}
    iconSize="16px"
    classes="compose-button"
    disabled={!account}
    onClick={newMail}
    />
{:else}
  <RoundButton
    label={$t`Write new email`}
    icon={WriteIcon}
    iconSize="18px"
    padding="7px"
    classes={toolbar ? "compose-toolbar" : "create"}
    filled={!toolbar}
    disabled={!account}
    onClick={newMail}
    />
{/if}

<script lang="ts">
  import type { MailAccount } from "../../../logic/Mail/MailAccount";
  import { PersonUID } from "../../../logic/Abstract/PersonUID";
  import { mailApp } from "../MailJackdawApp";
  import RoundButton from "../../Shared/RoundButton.svelte";
  import Button from "../../Shared/Button.svelte";
  import WriteIcon from "lucide-svelte/icons/plus";
  import ComposeIcon from "lucide-svelte/icons/pencil";
  import { assert } from "../../../logic/util/util";
  import { gt, t } from "../../../l10n/l10n";

  export let account: MailAccount; /* in/out */
  export let to: PersonUID | null = null;
  export let showLabel = false;
  /** Square toolbar chip instead of filled round compose button */
  export let toolbar = false;

  function newMail() {
    assert(account, gt`Please select a mail account first`);
    let email = account.newEMailFrom();
    if (to) {
      email.to.add(to);
    }
    mailApp.writeMail(email);
  }
</script>

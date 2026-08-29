<Header
  title={$t`Set up your existing CardDAV addressbook`}
  subtitle=""
/>
<vbox flex class="account">
  <grid>
    <label for="carddav-name">{$t`Name of the addressbook`}</label>
    <input id="carddav-name" type="text" bind:value={config.name} name="name"
      placeholder={$t`Private`} autofocus />
    <label for="carddav-url">{$t`Server URL`}</label>
    <input id="carddav-url" type="url" bind:value={config.url} name="url"
      placeholder="https://dav.yourcompany.com/contacts/" />
    <label for="carddav-username">{$t`Username`}</label>
    <input id="carddav-username" type="text" bind:value={config.username} name="username"
      placeholder={$t`fred`} />
    <label for="carddav-password">{$t`Password`}</label>
    <Password id="carddav-password" bind:password={config.password} />
  </grid>
</vbox>

<ErrorMessageInline bind:this={errorUI} />

<ButtonsBottom
  onContinue={() => catchErrors(onContinue, errorUI.showError)}
  canContinue={!!config.name?.trim() && isValidServerURL(config.url) &&
    !!config.username?.trim() && !!config.password}
  canCancel={true}
  onCancel={onCancel}
  />

<script lang="ts">
  import type { Addressbook } from "../../../logic/Contacts/Addressbook";
  import { AuthMethod } from "../../../logic/Abstract/Account";
  import CardDavSelectAddressbook from "./CardDAVSelectAddressbook.svelte";
  import Password from "../Shared/Password.svelte";
  import ButtonsBottom from "../Shared/ButtonsBottom.svelte";
  import Header from "../Shared/Header.svelte";
  import ErrorMessageInline from "../../Shared/ErrorMessageInline.svelte";
  import { catchErrors } from "../../Util/error";
  import { t } from "../../../l10n/l10n";
  import { isValidServerURL } from "../Shared/validateServerURL";

  /** in/out */
  export let config: Addressbook;
  /** out */
  export let showPage: ConstructorOfATypedSvelteComponent;
  export let onCancel = (event: Event) => undefined;

  let errorUI: ErrorMessageInline;

  async function onContinue() {
    errorUI.clearError();
    config.authMethod = AuthMethod.Password;
    await config.verifyLogin();
    showPage = CardDavSelectAddressbook;
  }
</script>

<style>
  grid {
    grid-template-columns: max-content auto;
    align-items: center;
    margin: 32px;
    gap: 8px 24px;
  }
</style>

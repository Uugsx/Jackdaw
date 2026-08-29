<Header
  title={$t`Set up your existing WebDAV account`}
  subtitle=""
/>
<vbox flex class="account">
  <grid>
    <label for="webdav-name">{$t`Account name`}</label>
    <input id="webdav-name" type="text" bind:value={config.name} name="name"
      placeholder={$t`Private`} autofocus />
    <label for="webdav-url">{$t`Server URL`}</label>
    <input id="webdav-url" type="url" bind:value={config.url} name="url"
      placeholder="https://files.yourcompany.com" />
    <label for="webdav-username">{$t`Username`}</label>
    <input id="webdav-username" type="text" bind:value={config.username} name="username"
      placeholder={$t`fred`} />
    <label for="webdav-password">{$t`Password`}</label>
    <Password id="webdav-password" bind:password={config.password} />
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
  import { FileSharingAccount } from "../../../logic/Files/FileSharingAccount";
  import { AuthMethod } from "../../../logic/Abstract/Account";
  import { appGlobal } from "../../../logic/app";
  import Password from "../Shared/Password.svelte";
  import ButtonsBottom from "../Shared/ButtonsBottom.svelte";
  import Header from "../Shared/Header.svelte";
  import ErrorMessageInline from "../../Shared/ErrorMessageInline.svelte";
  import { catchErrors } from "../../Util/error";
  import { t } from "../../../l10n/l10n";
  import { isValidServerURL } from "../Shared/validateServerURL";

  /** in/out */
  export let config: FileSharingAccount;
  /** out */
  export let showPage: ConstructorOfATypedSvelteComponent;
  export let onCancel = (event: Event) => undefined;

  let errorUI: ErrorMessageInline;

  async function onContinue() {
    errorUI.clearError();
    config.authMethod = AuthMethod.Password;
    await config.verifyLogin();
    await config.login(true);
    await config.save();
    appGlobal.fileSharingAccounts.add(config);
    showPage = null;
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

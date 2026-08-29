<Header
  title={$t`Set up your existing CalDAV calendar`}
  subtitle=""
/>
<vbox flex class="account">
  <grid>
    <label for="caldav-name">{$t`Name of the calendar`}</label>
    <input id="caldav-name" type="text" bind:value={config.name} name="name"
      placeholder={$t`Private`} autofocus />
    <label for="caldav-url">{$t`Server URL`}</label>
    <input id="caldav-url" type="url" bind:value={config.url} name="url"
      placeholder="https://dav.yourcompany.com/calendar/" />
    <label for="caldav-username">{$t`Username`}</label>
    <input id="caldav-username" type="text" bind:value={config.username} name="username"
      placeholder={$t`fred`} />
    <label for="caldav-password">{$t`Password`}</label>
    <Password id="caldav-password" bind:password={config.password} />
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
  import type { Calendar } from "../../../logic/Calendar/Calendar";
  import { AuthMethod } from "../../../logic/Abstract/Account";
  import CalDavSelectCalendar from "./CalDAVSelectCalendar.svelte";
  import Password from "../Shared/Password.svelte";
  import ButtonsBottom from "../Shared/ButtonsBottom.svelte";
  import Header from "../Shared/Header.svelte";
  import ErrorMessageInline from "../../Shared/ErrorMessageInline.svelte";
  import { catchErrors } from "../../Util/error";
  import { t } from "../../../l10n/l10n";
  import { isValidServerURL } from "../Shared/validateServerURL";

  /** in/out */
  export let config: Calendar;
  /** out */
  export let showPage: ConstructorOfATypedSvelteComponent;
  export let onCancel = (event: Event) => undefined;

  let errorUI: ErrorMessageInline;

  async function onContinue() {
    errorUI.clearError();
    config.authMethod = AuthMethod.Password;
    await config.verifyLogin();
    showPage = CalDavSelectCalendar;
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

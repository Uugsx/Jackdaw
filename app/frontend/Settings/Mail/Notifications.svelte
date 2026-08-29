<hbox class="groups">
  <HeaderGroupBox>
    <hbox slot="header">
      {$t`Notifications`}
    </hbox>
    <hbox class="subtitle">{$t`When a new mail arrives, show with:`}</hbox>
    <NotificationKinds bind:list={kindsList} />
  </HeaderGroupBox>

  <HeaderGroupBox>
    <hbox slot="header">
      {$t`Notify only for`}
    </hbox>
    <hbox class="subtitle">{$t`Show notifications only for mails:`}</hbox>
    <label>
      <input type="checkbox" bind:checked={onlyFromAddressBook} />
      {$t`From people in my address book`}
    </label>
  </HeaderGroupBox>
</hbox>

<script lang="ts">
  import { getLocalStorage } from "../../Util/LocalStorage";
  import NotificationKinds from "./NotificationKinds.svelte";
  import HeaderGroupBox from "../../Shared/HeaderGroupBox.svelte";
  import { t } from "../../../l10n/l10n";

  let notificationsSetting = getLocalStorage<string[]>("notifications.mail", ["popup", "sound"]);
  let onlyABSetting = getLocalStorage("notifications.mail.only.addressbook", false);

  // Local copies so checkbox toggles assign a new value and hit LocalStorage setters
  let kindsList: string[] = Array.isArray(notificationsSetting.value)
    ? [...notificationsSetting.value]
    : ["popup", "sound"];
  let onlyFromAddressBook = !!onlyABSetting.value;

  $: notificationsSetting.value = kindsList;
  $: onlyABSetting.value = onlyFromAddressBook;
</script>

<style>
  .groups {
    flex-wrap: wrap;
  }
  .groups :global(> *) {
    margin-inline-end: 32px;
  }
  .groups :global(.group .content) {
    padding-inline-end: 48px;
  }
  .subtitle {
    margin-block-end: 16px;
  }
</style>

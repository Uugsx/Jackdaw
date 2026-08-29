<vbox class="notifications">
  <label>
    <input type="checkbox"
      checked={list.includes("popup")}
      on:change={e => toggle("popup", e.currentTarget.checked)} />
    {$t`Popup`}
  </label>
  <img src={popupImg} title={$t`Popup`} alt={$t`Popup`} />

  <label>
    <input type="checkbox"
      checked={list.includes("sound")}
      on:change={e => toggle("sound", e.currentTarget.checked)} />
    {$t`Sound`}
  </label>
  <img src={soundImg} title={$t`Sound`} alt={$t`Sound`} />

  <label title={$t`Coming soon`}>
    <input type="checkbox" disabled />
    {$t`Bubble on the appbar in ${appName}`}
  </label>
  <img src={appbarImg} title={$t`Appbar`} alt={$t`Appbar`} class="disabled" />

  <label title={$t`Coming soon`}>
    <input type="checkbox" disabled />
    {$t`Bubble on the system task bar`}
  </label>
  <img src={taskbarImg} title={$t`System task bar`} alt={$t`System task bar`} class="disabled" />
</vbox>

<script lang="ts">
  import popupImg from "../../asset/settings/notification/popup.png";
  import soundImg from "../../asset/settings/notification/sound.png";
  import appbarImg from "../../asset/settings/notification/appbar.png";
  import taskbarImg from "../../asset/settings/notification/taskbar.png";
  import { appName } from "../../../logic/build";
  import { t } from "../../../l10n/l10n";

  /** in/out — replace the array (do not mutate) so LocalStorage setter runs */
  export let list: string[];

  function toggle(kind: string, on: boolean) {
    let next = (list ?? []).filter(k => k != kind);
    if (on) {
      next = [...next, kind];
    }
    list = next;
  }
</script>

<style>
  label {
    align-items: center;
    display: flex;
  }
  label input {
    margin-inline-end: 8px;
  }
  img {
    width: 99px;
    height: 64px;
    margin: 4px 0px 24px 24px;
  }
  img.disabled {
    opacity: 0.45;
  }
  label:has(input:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>

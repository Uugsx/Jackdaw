<vbox class="notifications">
  <label class="notification-kind">
    <input type="checkbox"
      checked={list.includes("popup")}
      on:change={e => toggle("popup", e.currentTarget.checked)} />
    {$t`Popup`}
  </label>
  <NotificationPreview kind="popup" />

  <label class="notification-kind">
    <input type="checkbox"
      checked={list.includes("sound")}
      on:change={e => toggle("sound", e.currentTarget.checked)} />
    {$t`Sound`}
  </label>
  <NotificationPreview kind="sound" />

  <label class="notification-kind">
    <input type="checkbox"
      checked={list.includes("appbar")}
      on:change={e => toggle("appbar", e.currentTarget.checked)} />
    {$t`Bubble on the appbar in ${appName}`}
  </label>
  <NotificationPreview kind="appbar" />

  <label class="notification-kind">
    <input type="checkbox"
      checked={list.includes("taskbar")}
      on:change={e => toggle("taskbar", e.currentTarget.checked)} />
    {$t`Bubble on the system task bar`}
  </label>
  <NotificationPreview kind="taskbar" />
</vbox>

<script lang="ts">
  import NotificationPreview from "./NotificationPreview.svelte";
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
  label.notification-kind {
    align-items: center;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    min-height: 28px;
    padding-inline: 4px;
    transition: background-color 0.18s ease;
  }
  label.notification-kind:hover {
    background-color: var(--glass-hover-bg);
  }
  label.notification-kind:focus-within {
    outline: 2px solid color-mix(in srgb, var(--input-focus) 68%, transparent);
    outline-offset: 1px;
  }
  label.notification-kind input {
    accent-color: var(--icon-primary);
    margin-inline-end: 8px;
  }
</style>

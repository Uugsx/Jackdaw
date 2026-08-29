<vbox flex class="edit-widget-dialog">
  <hbox class="title font-small">{$t`Edit website widget`}</hbox>
  <label class="field">
    <span class="label">{$t`Name`}</span>
    <input type="text" bind:value={name} />
  </label>
  <label class="field">
    <span class="label">{$t`Website URL`}</span>
    <input type="url" bind:value={url} />
  </label>
  {#if error}
    <hbox class="error font-smallest">{error}</hbox>
  {/if}
  <hbox class="actions">
    <Button plain label={$t`Cancel`} onClick={() => dispatchEvent("close")} />
    <Button label={$t`Save`} onClick={onSave} disabled={!canSave} />
  </hbox>
</vbox>

<script lang="ts">
  import Button from "../Shared/Button.svelte";
  import { isValidServerURL } from "../Setup/Shared/validateServerURL";
  import { t } from "../../l10n/l10n";
  import { createEventDispatcher } from "svelte";

  export let initialName = "";
  export let initialUrl = "";

  const dispatchEvent = createEventDispatcher<{ save: { name: string; url: string }; close: void }>();

  let name = initialName;
  let url = initialUrl;
  let error: string | null = null;

  $: canSave = name.trim().length > 0 && isValidServerURL(url);

  function onSave() {
    if (!canSave) {
      error = $t`Enter a name and a valid https:// URL`;
      return;
    }
    dispatchEvent("save", { name: name.trim(), url: url.trim() });
    dispatchEvent("close");
  }
</script>

<style>
  .edit-widget-dialog {
    gap: 10px;
    padding: 14px 16px;
    min-width: 280px;
    max-width: 360px;
  }
  .title {
    font-weight: 650;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field .label {
    color: var(--input-placeholder);
    font-size: 11px;
  }
  .field input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background: var(--input-bg);
    color: var(--input-fg);
  }
  .error {
    color: var(--danger-fg);
  }
  .actions {
    justify-content: flex-end;
    gap: 8px;
    margin-block-start: 4px;
  }
</style>

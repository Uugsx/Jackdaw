<vbox flex class="add-widget-dialog">
  <hbox class="title font-small">{$t`Add website widget`}</hbox>
  <p class="hint font-smallest">{$t`Any HTTPS website can be opened in the side panel, for example ChatGPT or your company portal.`}</p>
  <label class="field">
    <span class="label">{$t`Name`}</span>
    <input type="text" bind:value={name} placeholder={$t`ChatGPT`} />
  </label>
  <label class="field">
    <span class="label">{$t`Website URL`}</span>
    <input type="url" bind:value={url} placeholder="https://chatgpt.com" />
  </label>
  {#if error}
    <hbox class="error font-smallest">{error}</hbox>
  {/if}
  <hbox class="actions">
    <Button plain label={$t`Cancel`} onClick={() => dispatchEvent("close")} />
    <Button label={$t`Add`} onClick={onAdd} disabled={!canAdd} />
  </hbox>
</vbox>

<script lang="ts">
  import Button from "../Shared/Button.svelte";
  import { isValidServerURL } from "../Setup/Shared/validateServerURL";
  import { t } from "../../l10n/l10n";
  import { createEventDispatcher } from "svelte";

  const dispatchEvent = createEventDispatcher<{ add: { name: string; url: string }; close: void }>();

  let name = "";
  let url = "https://";
  let error: string | null = null;

  $: canAdd = name.trim().length > 0 && isValidServerURL(url);

  function onAdd() {
    if (!canAdd) {
      error = $t`Enter a name and a valid https:// URL`;
      return;
    }
    dispatchEvent("add", { name: name.trim(), url: url.trim() });
    dispatchEvent("close");
  }
</script>

<style>
  .add-widget-dialog {
    gap: 10px;
    padding: 14px 16px;
    min-width: 280px;
    max-width: 360px;
  }
  .title {
    font-weight: 650;
  }
  .hint {
    margin: 0;
    line-height: 1.35;
    color: color-mix(in srgb, var(--main-fg) 72%, transparent);
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

<vbox class="folder-name-dialog">
  <hbox class="title">{title}</hbox>
  <label for="folder-name">{$t`Folder name`}</label>
  <input
    id="folder-name"
    bind:value={name}
    type="text"
    autofocus
    on:keydown={onKeydown} />
  <hbox class="buttons">
    <Button
      label={$t`Cancel`}
      icon={CancelIcon}
      classes="cancel"
      onClick={onCancel} />
    <Button
      label={submitLabel}
      icon={SaveIcon}
      classes="save"
      disabled={!name.trim()}
      onClick={onSubmit} />
  </hbox>
</vbox>

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "../../Shared/Button.svelte";
  import CancelIcon from "lucide-svelte/icons/circle-x";
  import SaveIcon from "lucide-svelte/icons/save";
  import { t } from "../../../l10n/l10n";

  export let title: string;
  export let initialName = "";
  export let submitLabel: string;

  const dispatch = createEventDispatcher<{ submit: string; close: void }>();
  let name = initialName;

  function onSubmit() {
    let trimmedName = name.trim();
    if (trimmedName) {
      dispatch("submit", trimmedName);
    }
  }

  function onCancel() {
    dispatch("close");
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key == "Enter") {
      event.preventDefault();
      onSubmit();
    } else if (event.key == "Escape") {
      event.preventDefault();
      onCancel();
    }
  }
</script>

<style>
  .folder-name-dialog {
    min-width: 280px;
    padding: 16px;
    gap: 8px;
  }
  .title {
    font-weight: 600;
    margin-block-end: 4px;
  }
  input {
    min-width: 0;
    padding: 7px 9px;
    border: 1px solid var(--input-line);
    border-radius: 6px;
    background: var(--input-bg);
    color: var(--input-fg);
    font: inherit;
  }
  input:focus {
    outline: 2px solid var(--input-focus);
    outline-offset: -1px;
  }
  .buttons {
    justify-content: end;
    gap: 8px;
    margin-block-start: 8px;
  }
</style>

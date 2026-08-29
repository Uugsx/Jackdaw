<vbox class="create-folder">
  <HeaderGroupBox>
    <hbox slot="header">{$t`Create folder`}</hbox>
    <vbox class="content">
      <grid>
        <label for="name">{$t`Folder name`}</label>
        <input type="text" bind:value={name} name="name" autofocus on:keydown={onNameKeydown} />

        <label for="name">{$t`Located`}</label>
        <hbox class="radiogroup">
          <label class:disabled={isSubfolderDisabled}>
            <input type="radio"
              value="subfolder"
              bind:group={location}
              disabled={isSubfolderDisabled} />
            {$t`Subfolder of ${parentFolder.name}`}
          </label>
          <label>
            <input type="radio"
              value="toplevel"
              bind:group={location} />
            {$t`Top-level, like Inbox`}
          </label>
        </hbox>
      </grid>
    </vbox>

    <hbox class="buttons">
      <Button label={$t`Cancel`}
        classes="cancel"
        icon={CancelIcon}
        onClick={onCancel}
        />
      <Button label={$t`Create folder`}
        classes="save"
        icon={CreateIcon}
        onClick={onCreate}
        disabled={creating || !name.trim()}
        />
    </hbox>
  </HeaderGroupBox>
</vbox>

<script lang="ts">
  import { Folder, SpecialFolder } from "../../../../logic/Mail/Folder";
  import HeaderGroupBox from "../../../Shared/HeaderGroupBox.svelte";
  import Button from "../../../Shared/Button.svelte";
  import CreateIcon from "lucide-svelte/icons/save";
  import CancelIcon from "lucide-svelte/icons/circle-x";
  import { t } from "../../../../l10n/l10n";
  import { createEventDispatcher } from 'svelte';
  const dispatchEvent = createEventDispatcher<{ close: void; created: Folder }>();

  export let parentFolder: Folder;
  export let location: "subfolder" | "toplevel" = "subfolder";

  let name = "";
  let isSubfolderDisabled = false;
  let creating = false;

  $: parentFolder, init()
  function init() {
    isSubfolderDisabled = parentFolder.specialFolder == SpecialFolder.Inbox ||
      !!parentFolder?.disableSubfolders();
    if (isSubfolderDisabled) {
      location = "toplevel";
    }
  }

  async function onCreate() {
    if (creating) {
      return;
    }
    let folderName = name.trim();
    if (!folderName) {
      return;
    }
    creating = true;
    let created: Folder;
    try {
      if (location == "subfolder") {
        created = await parentFolder.createSubFolder(folderName);
      } else {
        created = await parentFolder.account.createToplevelFolder(folderName);
      }
      dispatchEvent("created", created);
      // Close immediately after the server accepted the folder. A local DB
      // error must not leave the user with a form that creates it again.
      dispatchEvent("close");
      await created.save();
    } finally {
      creating = false;
    }
  }

  function onNameKeydown(event: KeyboardEvent) {
    if (event.key == "Enter") {
      event.preventDefault();
      void onCreate();
    }
  }

  function onCancel() {
    dispatchEvent("close");
  }
</script>

<style>
  .create-folder {
    max-width: 40em;
  }
  grid {
    grid-template-columns: max-content auto;
    gap: 8px 24px;
  }
  .radiogroup {
    align-items: center;
  }
  .radiogroup input {
    margin-bottom: 2px;
  }
  .radiogroup label {
    margin-left: 3px;
    margin-right: 24px;
  }
  label.disabled {
    opacity: 50%;
  }
  .buttons {
    justify-content: end;
    margin-block-start: 64px;
  }
  .buttons :global(button) {
    margin-inline-start: 8px;
  }
</style>

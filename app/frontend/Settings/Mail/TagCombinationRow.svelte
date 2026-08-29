<vbox class="combination-row">
  <hbox class="combination-header">
    <input
      type="text"
      class="combination-name"
      bind:value={combination.name}
      placeholder={$t`Combination name`}
      aria-label={$t`Combination name`}
      on:change={() => catchErrors(onSave)}
      />
    <hbox flex />
    <RoundButton
      label={$t`Remove`}
      onClick={() => dispatch("remove")}
      icon={DeleteIcon}
      classes="small remove"
      iconSize="12px"
      padding="0px"
      border={false}
      />
  </hbox>
  <hbox class="tag-picker">
    {#each sortedTagList($availableTags.contents) as tag (tag.name)}
      <TagBubble
        {tag}
        selected={selectedNames.has(tag.name)}
        on:click={() => catchErrors(() => onToggleTag(tag))}
        />
    {/each}
  </hbox>
  {#if selectedNames.size == 0}
    <hbox class="hint">{$t`Select at least one category for this combination.`}</hbox>
  {/if}
</vbox>

<script lang="ts">
  import {
    availableTags,
    sortedTagList,
    type Tag,
  } from "../../../logic/Abstract/Tag";
  import {
    saveTagCombinations,
    type TagCombination,
  } from "../../../logic/Abstract/TagCombination";
  import TagBubble from "../../Shared/Tag/TagBubble.svelte";
  import RoundButton from "../../Shared/RoundButton.svelte";
  import DeleteIcon from "lucide-svelte/icons/trash-2";
  import { catchErrors } from "../../Util/error";
  import { t } from "../../../l10n/l10n";
  import { createEventDispatcher } from "svelte";

  export let combination: TagCombination;

  const dispatch = createEventDispatcher<{ remove: void }>();

  $: selectedNames = new Set(combination.tagNames);

  async function onToggleTag(tag: Tag) {
    if (selectedNames.has(tag.name)) {
      combination.tagNames = combination.tagNames.filter(name => name != tag.name);
    } else {
      combination.tagNames = [...combination.tagNames, tag.name];
    }
    await onSave();
  }

  async function onSave() {
    combination.name = combination.name.trim();
    combination.tagNames = combination.tagNames.filter(name =>
      $availableTags.find(tag => tag.name == name));
    await saveTagCombinations();
  }
</script>

<style>
  .combination-row {
    gap: 8px;
    padding: 12px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--fg) 4%, transparent);
  }
  .combination-header {
    align-items: center;
    gap: 8px;
  }
  .combination-name {
    min-width: 12em;
    max-width: 100%;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--main-bg);
    color: var(--main-fg);
  }
  .tag-picker {
    flex-wrap: wrap;
    gap: 4px;
  }
  .tag-picker :global(.tag) {
    font-size: 16px;
    cursor: pointer;
  }
  .hint {
    font-size: 0.85em;
    opacity: 0.7;
  }
</style>

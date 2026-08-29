<hbox class="tree-line-item" style="margin-inline-start: {indentionLevel * 12}px" flex>
  {#if canExpand}
    <Button
      classes="expand"
      label={isExpanded ? $t`Collapse` : $t`Expand`}
      icon={isExpanded ? CollapseIcon : ExpandIcon}
      iconOnly plain
      onClick={(event) => onExpandCollapse(event)}
      />
  {:else}
    <hbox class="button-placeholder" />
  {/if}
  <slot name="row" />
</hbox>

<script lang="ts">
  import type { Collection } from "svelte-collections";
  import { type TreeItem, getIndentionLevelFor } from "./FastTree";
  import Button from "./Button.svelte";
  import ExpandIcon from "lucide-svelte/icons/chevron-right";
  import CollapseIcon from "lucide-svelte/icons/chevron-down";
  import { t } from "../../l10n/l10n";
  import { getContext } from "svelte";

  // <https://github.com/dummdidumm/rfcs/blob/ts-typedefs-within-svelte-components/text/ts-typing-props-slots-events.md>
  type T = $$Generic<TreeItem>;

  /** in */
  export let item: T;

  $: children = item.children as Collection<T>;
  $: canExpand = $children.hasItems;
  $: isExpanded = !!$item.expanded;
  $: indentionLevel = getIndentionLevelFor(item);

  let treeToggleExpand = getContext("treeToggleExpand") as ((item: T) => void) | undefined;

  function onExpandCollapse(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (treeToggleExpand) {
      treeToggleExpand(item);
    } else {
      item.expanded = !item.expanded;
    }
  }
</script>

<style>
  hbox :global(button.expand) {
    color: #555555;
  }
  hbox :global(button:hover) {
    background-color: inherit !important;
  }
  .tree-line-item :global(button.expand) {
    padding: 0;
    min-width: unset;
    margin-inline-end: 2px;
  }
  .tree-line-item :global(.folder) {
    flex: 1 1 auto;
    min-width: 0;
  }
  .button-placeholder {
    margin-inline-end: 2px;
    width: 16px;
  }
</style>

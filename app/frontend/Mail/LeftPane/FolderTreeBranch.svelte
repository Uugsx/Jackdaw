<TreeItemLine item={folder}>
  <FolderLine
    slot="row"
    {folder}
    selected={isSelected}
    on:click={selectFolder}
    >
    <slot name="folder-buttons" slot="buttons" {folder} />
  </FolderLine>
</TreeItemLine>
{#if $folder.expanded && $subFoldersSorted.hasItems}
  {#each $subFoldersSorted.each as child (child.id)}
    <svelte:self folder={child} bind:selectedFolder bind:selectedFolders>
      <slot name="folder-buttons" slot="folder-buttons" let:folder {folder} />
    </svelte:self>
  {/each}
{/if}

<script lang="ts">
  import type { Folder } from "../../../logic/Mail/Folder";
  import FolderLine from "./FolderLine.svelte";
  import TreeItemLine from "../../Shared/FastTreeItem.svelte";
  import { ArrayColl, type ArrayColl as ArrayCollType } from "svelte-collections";
  import { createEventDispatcher } from "svelte";
  import { hiddenFoldersEpoch, isHiddenFolder } from "./hiddenFolders";

  export let folder: Folder;
  export let selectedFolder: Folder;
  export let selectedFolders: ArrayCollType<Folder>;
  let subFoldersSorted = new ArrayColl<Folder>();

  const dispatch = createEventDispatcher();

  $: {
    $hiddenFoldersEpoch;
    subFoldersSorted = new ArrayColl(
      $folder.subFolders.each.filter(child => !isHiddenFolder(child)),
    ).sortBy(f => f.orderPos);
  }
  $: isSelected = selectedFolder === folder;

  function selectFolder(event: MouseEvent) {
    event.stopPropagation();
    selectedFolder = folder;
    dispatch("select", folder);
  }
</script>

{#each $foldersSorted.each as folder (folder.id)}
  <FolderTreeBranch {folder} bind:selectedFolder bind:selectedFolders>
    <svelte:fragment slot="folder-buttons" let:folder>
      <slot name="folder-buttons" {folder} />
    </svelte:fragment>
  </FolderTreeBranch>
{/each}

<script lang="ts">
  import type { Folder } from "../../../logic/Mail/Folder";
  import type { Collection, ArrayColl } from "svelte-collections";
  import FolderTreeBranch from "./FolderTreeBranch.svelte";
  import { setContext } from "svelte";

  export let folders: Collection<Folder>;
  export let selectedFolder: Folder;
  export let selectedFolders: ArrayColl<Folder>;

  $: foldersSorted = $folders.sortBy(f => f.orderPos);

  setContext("treeToggleExpand", (item: Folder) => {
    item.expanded = !item.expanded;
    item.notifyObservers("expanded");
  });

  $: if (selectedFolder) {
    expandPathTo(selectedFolder);
  }

  function expandPathTo(folder: Folder) {
    let cur: Folder | null = folder.parent;
    while (cur) {
      cur.expanded = true;
      cur.notifyObservers("expanded");
      cur = cur.parent;
    }
  }
</script>

<FastList items={showItems} {columns} {autoHeight} {highlightItem} {useExternalHighlight}
  bind:selectedItem bind:selectedItems
  on:selected={event => dispatch("selected", event.detail)}>
  <slot name="header" slot="header" />
  <div slot="row" class="tree-row" let:item>
    <slot name="row" {item}
      indentionLevel={getIndentionLevelFor(item)}
      />
  </div>
</FastList>

<script lang="ts">
  /** This is a variant of `<FastList>` which can display a hierarchy of homogenous items,
   * e.g. a folder tree or message threads.
   * The items need to implement the `TreeItem` interface, which has `.parent` and `.children`.
   * The `<FastTree>` then takes care of rendering the hierarchy on-demand,
   * opening/closing items etc.
   */

  import { type TreeItem, containsTreeItem, getIndentionLevelFor } from "./FastTree";
  import { type Collection, ArrayColl } from "svelte-collections"
  import FastList from "./FastList.svelte";
  import { createEventDispatcher, setContext } from "svelte";

  // <https://github.com/dummdidumm/rfcs/blob/ts-typedefs-within-svelte-components/text/ts-typing-props-slots-events.md>
  type T = $$Generic<TreeItem>;

  const dispatch = createEventDispatcher<{ selected: T }>();

  /**
   * The items to display in the list.
   */
  export let items: Collection<T>;

  /** items + children which are displayed */
  let showItems = new ArrayColl<T>();

  function rebuildShowItems() {
    showItems.clear();
    function addRecursive(item: T) {
      showItems.add(item);
      if (item.expanded && item.children?.hasItems) {
        for (let child of item.children) {
          addRecursive(child as T);
        }
      }
    }
    for (let item of items) {
      addRecursive(item);
    }
  }

  /** Ensure ancestors of the selected item are expanded so it stays visible. */
  function expandPathTo(selected: T) {
    let cur = selected?.parent as T;
    while (cur) {
      cur.expanded = true;
      cur = cur.parent as T;
    }
  }

  function toggleExpand(item: T) {
    item.expanded = !item.expanded;
    rebuildShowItems();
  }
  setContext("treeToggleExpand", toggleExpand);
  setContext("treeRefresh", rebuildShowItems);

  // Rebuild when the root collection changes. Selection only ensures the path is open.
  $: ($items, rebuildShowItems());

  let lastSelected: T = null;
  $: if (syncSelection && selectedItem && selectedItem !== lastSelected
      && containsTreeItem(items, selectedItem)) {
    lastSelected = selectedItem;
    expandPathTo(selectedItem);
    rebuildShowItems();
  }

  /** grid-template-columns: */
  export let columns: string = "auto";

  export let autoHeight = false;

  /** Follow global selectedItem and expand path (off for embedded sidebar trees). */
  export let syncSelection = true;

  /** Highlight row without mutating shared selection collections. */
  export let highlightItem: T | null = null;
  export let useExternalHighlight = false;

  /**
   * The list item that the user selected,
   * e.g. by clicking on it.
   * Unlike selecteditems, this is always returns just one element.
   *
   * in/out
   */
  export let selectedItem: T = null;

  /**
   * The list items that the user selected,
   * e.g. by clicking on them.
   * This is usually just one element,
   * unless the user used multiple selection, e.g. using the SHIFT key.
   *
   * This collection object is always the same.
   * You can be notified of changes in the selection using
   * the normal collection observers.
   *
   * @see also selectedItem
   *
   * out only
   */
  export let selectedItems: ArrayColl<T>;
</script>

<style>
</style>

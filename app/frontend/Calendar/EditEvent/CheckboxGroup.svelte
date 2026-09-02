<!--
  Svelte's bind:group only works for literal <input type=checkbox> (issue 2308).
  This isn't a true bind:group because it can't react to changes in group.
  TODO: support other Svelteui <Checkbox> properties
-->
<hbox>
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <slot><label>{label}</label></slot>
  {#each items as item, i}
    <label>
      <input type="checkbox" {...item} bind:checked={item.checked} {disabled} />
      {#if item.label}<span>{item.label}</span>{/if}
    </label>
  {/each}
</hbox>

<script lang="ts">
  export let label = "";
  export let size = undefined;
  export let radius = undefined;
  export let items = [];
  export let group = [];
  export let disabled = false;

  for (let item of items) {
    item.checked = group.includes(item.value);
  }

  $: group = items.filter(item => item.checked).map(item => item.value);
</script>

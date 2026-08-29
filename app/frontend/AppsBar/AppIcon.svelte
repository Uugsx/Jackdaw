{#if typeof (icon) == "string"}
  <Icon data={icon} {size} />
{:else if icon}
  <svelte:component this={icon} {size} {strokeWidth} />
{:else}
  <MissingIcon size={parseInt(size)} />
{/if}

<script lang="ts">
  import Icon from 'svelte-icon/Icon.svelte';
  import MissingIcon from "lucide-svelte/icons/dot";

  /** App icon, either as SVG string or as Svelte component */
  export let icon: string | ConstructorOfATypedSvelteComponent;
  /** CSS size, e.g. "24px" */
  export let size: string;
  export let strokeWidth = 1.75;
</script>

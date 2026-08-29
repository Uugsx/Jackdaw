<!-- Floating compose windows sit above the glass content shell. -->
<vbox class="compose-floating-layer">
  {#each $floatingComposes as entry (entry.id)}
    <ComposeFloatingShell {entry} />
  {/each}
</vbox>

<script lang="ts">
  import ComposeFloatingShell from "./ComposeFloatingShell.svelte";
  import { floatingComposes } from "./composeFloating";
</script>

<style>
  .compose-floating-layer {
    position: fixed;
    inset: 0;
    z-index: 1200;
    pointer-events: none;
  }
  .compose-floating-layer :global(.compose-float) {
    pointer-events: auto;
  }
</style>

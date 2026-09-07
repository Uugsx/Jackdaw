<Scroll>
  <pre class="plaintext value">
{plaintext || ''}
  </pre>
</Scroll>

<script lang="ts">
  import Scroll from "../../Shared/Scroll.svelte";

  export let plaintext: string;
</script>

<style>
  .plaintext {
    flex: 1 0 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    width: 100%;
    max-width: none;
    padding: 16px;
    box-sizing: border-box;
    color: var(--message-viewer-fg, var(--main-fg));
    background-color: var(--message-viewer-bg, var(--main-bg));
  }
</style>

<hbox class="app-button-wrapper {app.id}">
  <AppButton on:click={onClick} classes="center-bar {app.id}" padding={false} {badgeCount}>
    <AppIcon slot="icon" icon={app.icon} size="28px" />
  </AppButton>
</hbox>

<script lang="ts">
  import { goTo } from "../selectedApp";
  import { JackdawApp } from "../JackdawApp";
  import AppButton from "../AppButton.svelte";
  import AppIcon from "../AppIcon.svelte";

  export let app: JackdawApp
  export let page: string;
  export let params = {};
  export let badgeCount = 0;

  function onClick(event: Event) {
    event.stopPropagation();
    goTo(page, params);
  }
</script>

<style>
  .app-button-wrapper :global(.app-button) {
    background-color: var(--appbar-bg);
    color: var(--appbar-fg);
  }
</style>

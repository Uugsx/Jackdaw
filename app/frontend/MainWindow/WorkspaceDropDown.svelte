<vbox class="workspace-selector">
  {#each [null, ...appGlobal.workspaces.each] as workspace}
    <Clickable onClick={event => onWorkspaceSelected(workspace, event)}>
      <hbox class="workspace"
        style="--workspace-color: {workspace?.color ?? "var(--fg)"}"
        class:selected={workspace == $selectedWorkspace}
        >
        <hbox class="dot" />
        <hbox class="name">{workspace?.name ?? $t`All`}</hbox>
      </hbox>
    </Clickable>
  {/each}
</vbox>

<script lang="ts">
  import { Workspace } from "../../logic/Abstract/Workspace";
  import { selectedWorkspace } from "./Selected";
  import { appGlobal } from "../../logic/app";
  import Clickable from "../Shared/Clickable.svelte";
  import { t } from "../../l10n/l10n";

  export let open: boolean;

  function onWorkspaceSelected(workspace: Workspace, event: Event) {
    open = false;
    $selectedWorkspace = workspace;
  }
</script>

<style>
  .workspace-selector {
    min-width: 14em;
    padding: 6px;
    background-color: var(--main-bg);
    color: var(--main-fg);
  }
  .workspace {
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    min-height: 36px;
    box-sizing: border-box;
  }
  .workspace .name {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  .workspace .dot {
    background-color: var(--workspace-color);
    min-width: 10px;
    min-height: 10px;
    border-radius: 999px;
    flex-shrink: 0;
  }
  .workspace:hover {
    background-color: var(--hover-bg);
    color: var(--hover-fg);
  }
  .workspace.selected {
    background-color: var(--selected-bg);
    color: var(--selected-fg);
  }
  .workspace.selected:hover {
    background-color: var(--selected-hover-bg);
    color: var(--selected-hover-fg);
  }
</style>

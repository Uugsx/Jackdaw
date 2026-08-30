<hbox flex class="widget-sidebar" bind:this={sidebarE}>
  <vbox flex class="widget-panel" class:collapsed={!$widgetsExpanded.value}>
    {#if activeWidget && $widgetsExpanded.value}
      <hbox class="widget-header">
        <hbox flex class="widget-title font-smallest">{activeWidget.name}</hbox>
        {#if activeWidget.kind === "web" && activeWidget.url}
          <ButtonMenu label={$t`Panel settings`} boundaryElSel="body" placement="bottom-end">
            <WidgetWebSettingsMenu widget={activeWidget} on:edit={() => openEditDialog(activeWidget)} />
          </ButtonMenu>
          <button type="button" class="header-btn" title={$t`Sign in`}
            on:click={() => catchErrors(async () => {
              await openWidgetSignIn("widget-" + activeWidget.id, activeWidget.url, activeWidget.name);
              reloadWebWidget(activeWidget.id);
            })}>
            <LogInIcon size="14px" />
          </button>
          <button type="button" class="header-btn" title={$t`Open in browser`}
            on:click={() => catchErrors(() => openExternalURL(activeWidget.url))}>
            <ExternalLinkIcon size="14px" />
          </button>
        {:else if activeWidget.kind === "calendar"}
          <button type="button" class="header-btn" title={$t`Open calendar`}
            on:click={openCalendarApp}>
            <CalendarIcon size="14px" />
          </button>
        {/if}
        {#if !isBuiltInWidget(activeWidget)}
          <button type="button" class="header-btn danger" title={$t`Remove widget`}
            on:click={() => removeWidget(activeWidget.id)}>
            <Trash2Icon size="14px" />
          </button>
        {/if}
      </hbox>
    {/if}
    <vbox flex class="widget-body">
      {#each widgets as widget (widget.id)}
        {#if widget.kind === "web" && widget.url}
          <vbox flex class="widget-web-slot"
            class:active={activeWidget?.id === widget.id}
            aria-hidden={activeWidget?.id !== widget.id || !$widgetsExpanded.value}>
            <WidgetWebPanel
              widgetId={widget.id}
              url={widget.url}
              title={widget.name}
              sessionID={"widget-" + widget.id}
              suspended={!$widgetsExpanded.value || activeWidget?.id !== widget.id}
              refreshMinutes={getWidgetWebSettings(widget).refreshMinutes}
              mobileVersion={getWidgetWebSettings(widget).mobileVersion}
              freezeWhenHidden={getWidgetWebSettings(widget).freezeWhenHidden} />
          </vbox>
        {/if}
      {/each}
      {#if activeWidget?.kind === "calendar" && $widgetsExpanded.value}
        <CalendarWidgetPanel />
      {/if}
    </vbox>
  </vbox>

  <vbox class="widget-rail">
    {#each widgets as widget (widget.id)}
      <button type="button"
        class="rail-btn"
        class:active={activeWidget?.id === widget.id && $widgetsExpanded.value}
        title={widget.name}
        on:click={() => onWidgetClick(widget.id)}
        on:contextmenu={(event) => onWidgetContextMenu(event, widget)}>
        {#if widget.kind === "calendar"}
          <CalendarIcon size="16px" />
        {:else}
          <span class="rail-letter" aria-hidden="true">{widgetInitial(widget.name)}</span>
        {/if}
      </button>
    {/each}
    <vbox flex class="rail-spacer" />
    <button type="button" class="rail-btn" bind:this={addAnchor} title={$t`Add website widget`}
      on:click|stopPropagation={toggleAddWidget}>
      <PlusIcon size="16px" />
    </button>
    <button type="button" class="rail-btn" title={$widgetsExpanded.value ? $t`Hide panel` : $t`Show panel`}
      on:click={toggleWidgetPanel}>
      {#if $widgetsExpanded.value}
        <PanelRightCloseIcon size="16px" />
      {:else}
        <PanelRightOpenIcon size="16px" />
      {/if}
    </button>
  </vbox>
</hbox>

{#if addAnchor}
  <Popup bind:popupOpen={addOpen} popupAnchor={addAnchor} placement="left-end" boundaryElSel="body">
    <AddWidgetDialog
      on:add={(event) => {
        addWebWidget(event.detail.name, event.detail.url);
        addOpen = false;
      }}
      on:close={() => addOpen = false} />
  </Popup>
{/if}

<ContextMenu bind:this={widgetContextMenu}>
  {#if menuWidget?.kind === "web" && menuWidget.url}
    <WidgetWebSettingsMenu widget={menuWidget} on:edit={() => openEditDialog(menuWidget!)} />
  {/if}
</ContextMenu>

{#if editWidget && sidebarE}
  <Popup bind:popupOpen={editOpen} popupAnchor={sidebarE} placement="left-end" boundaryElSel="body">
    <EditWidgetDialog
      initialName={editWidget.name}
      initialUrl={editWidget.url ?? "https://"}
      on:save={(event) => {
        updateWebWidget(editWidget!.id, event.detail.name, event.detail.url);
        editOpen = false;
      }}
      on:close={() => editOpen = false} />
  </Popup>
{/if}

<script lang="ts">
  import WidgetWebPanel from "./WidgetWebPanel.svelte";
  import WidgetWebSettingsMenu from "./WidgetWebSettingsMenu.svelte";
  import EditWidgetDialog from "./EditWidgetDialog.svelte";
  import Popup from "../Shared/Popup.svelte";
  import AddWidgetDialog from "./AddWidgetDialog.svelte";
  import CalendarWidgetPanel from "./CalendarWidgetPanel.svelte";
  import ButtonMenu from "../Shared/Menu/ButtonMenu.svelte";
  import ContextMenu from "../Shared/Menu/ContextMenu.svelte";
  import { onMount } from "svelte";
  import {
    activeWidgetIdSetting,
    addWebWidget,
    getWidgetWebSettings,
    isBuiltInWidget,
    migrateWidgetListIfNeeded,
    normalizeWidgetList,
    removeWidget,
    reloadWebWidget,
    selectWidget,
    toggleWidgetPanel,
    updateWebWidget,
    widgetsExpanded,
    widgetsListSetting,
    type WidgetEntry,
  } from "./widgetState";
  import PlusIcon from "lucide-svelte/icons/plus";
  import PanelRightOpenIcon from "lucide-svelte/icons/panel-right-open";
  import PanelRightCloseIcon from "lucide-svelte/icons/panel-right-close";
  import ExternalLinkIcon from "lucide-svelte/icons/external-link";
  import LogInIcon from "lucide-svelte/icons/log-in";
  import Trash2Icon from "lucide-svelte/icons/trash-2";
  import CalendarIcon from "lucide-svelte/icons/calendar";
  import { openExternalURL } from "../../logic/util/os-integration";
  import { openWidgetSignIn } from "../../logic/util/widgetBrowser";
  import { openApp } from "../AppsBar/selectedApp";
  import { calendarApp } from "../Calendar/CalendarJackdawApp";
  import { catchErrors } from "../Util/error";
  import { t } from "../../l10n/l10n";

  onMount(() => migrateWidgetListIfNeeded());

  $: widgets = normalizeWidgetList($widgetsListSetting.value);
  $: activeWidget = widgets.find(w => w.id === $activeWidgetIdSetting.value) ?? widgets[0] ?? null;
  let addOpen = false;
  let addAnchor: HTMLButtonElement;
  let widgetContextMenu: ContextMenu;
  let menuWidget: WidgetEntry | null = null;
  let editOpen = false;
  let editWidget: WidgetEntry | null = null;
  let sidebarE: HTMLElement | null = null;

  function onWidgetContextMenu(event: MouseEvent, widget: WidgetEntry) {
    if (widget.kind !== "web" || !widget.url) {
      return;
    }
    menuWidget = widget;
    widgetContextMenu.onContextMenu(event);
  }

  function openEditDialog(widget: WidgetEntry) {
    editWidget = widget;
    selectWidget(widget.id);
    editOpen = true;
  }

  function onWidgetClick(id: string) {
    if (activeWidget?.id === id && $widgetsExpanded.value) {
      toggleWidgetPanel();
      return;
    }
    selectWidget(id);
  }

  function toggleAddWidget() {
    addOpen = !addOpen;
  }

  function widgetInitial(name: string): string {
    let trimmed = name.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
  }

  function openCalendarApp() {
    openApp(calendarApp, {});
  }
</script>

<style>
  .widget-sidebar {
    width: 100%;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background: var(--leftbar-bg);
    color: var(--leftbar-fg);
    border-inline-start: 1px solid var(--glass-border-subtle);
  }
  .widget-panel {
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    max-width: calc(100% - 44px);
  }
  .widget-panel.collapsed {
    flex: 0 0 0;
    width: 0;
    min-width: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .widget-panel.collapsed .widget-body {
    display: none;
  }
  .widget-panel.collapsed :global(webview),
  .widget-panel.collapsed :global(iframe) {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
  }
  .widget-header {
    align-items: center;
    gap: 4px;
    min-height: 36px;
    padding: 4px 8px 4px 12px;
    border-block-end: 1px solid var(--border);
    background: var(--headerbar-bg);
  }
  .widget-title {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 650;
  }
  .header-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    background: transparent;
    color: color-mix(in srgb, var(--leftbar-fg) 78%, transparent);
    cursor: default;
  }
  .header-btn:hover {
    background: var(--hover-bg);
    color: var(--hover-fg);
    border-color: var(--border);
  }
  .header-btn.danger:hover {
    color: var(--danger-fg);
  }
  .widget-body {
    position: relative;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .widget-web-slot {
    position: absolute;
    inset: 0;
    display: none;
    flex-direction: column;
    z-index: 0;
  }
  .widget-web-slot.active {
    display: flex;
    z-index: 1;
  }
  .widget-panel:not(.collapsed) .widget-web-slot.active :global(webview),
  .widget-panel:not(.collapsed) .widget-web-slot.active :global(iframe) {
    display: flex !important;
    visibility: visible !important;
    width: 100% !important;
    height: 100% !important;
  }
  .widget-body :global(webview),
  .widget-body :global(iframe) {
    width: 100%;
    height: 100%;
    border: none;
  }
  .widget-empty {
    align-items: center;
    justify-content: center;
    padding: 20px 16px;
    text-align: center;
    color: color-mix(in srgb, var(--leftbar-fg) 68%, transparent);
  }
  .widget-rail {
    width: 44px;
    min-width: 44px;
    align-items: center;
    gap: 4px;
    padding-block: 8px 10px;
    box-sizing: border-box;
    border-inline-start: 1px solid var(--border);
    background: var(--appbar-bg);
  }
  .rail-spacer {
    min-height: 8px;
  }
  .rail-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    background: transparent;
    color: color-mix(in srgb, var(--appbar-fg) 78%, transparent);
    cursor: default;
    transition:
      background-color 0.16s ease,
      border-color 0.16s ease,
      color 0.16s ease,
      transform 0.18s cubic-bezier(0.34, 1.35, 0.64, 1);
  }
  .rail-btn:hover {
    background: var(--glass-hover-bg);
    color: var(--appbar-fg);
    border-color: var(--glass-border-subtle);
    transform: translateY(-1px);
  }
  .rail-btn:active {
    transform: translateY(0) scale(0.96);
  }
  @media (prefers-reduced-motion: reduce) {
    .rail-btn {
      transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    }
    .rail-btn:hover,
    .rail-btn:active {
      transform: none;
    }
  }
  .rail-btn.active {
    background: color-mix(in srgb, var(--icon-primary) 14%, transparent);
    color: var(--icon-primary);
    border-color: color-mix(in srgb, var(--icon-primary) 28%, transparent);
  }
  .rail-letter {
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
</style>

<SubMenu label={$t`Open in`}>
  <MenuItem
    label={$t`Browser`}
    icon={ExternalLinkIcon}
    onClick={() => catchErrors(() => openExternalURL(widget.url!))} />
  <MenuItem
    label={$t`Jackdaw window`}
    icon={AppWindowIcon}
    onClick={() => catchErrors(() => openWidgetPopout(sessionID, widget.url!, widget.name))} />
</SubMenu>
<MenuItem
  label={$t`Copy panel address`}
  icon={CopyIcon}
  onClick={() => catchErrors(copyPanelUrl)} />
<MenuItem
  label={$t`Reload panel`}
  icon={RefreshCwIcon}
  onClick={() => reloadWebWidget(widget.id)} />
<SubMenu label={$t`Refresh every`}>
  {#each WIDGET_REFRESH_MINUTES as minutes (minutes)}
    <MenuItem
      label={refreshLabel(minutes)}
      selected={settings.refreshMinutes === minutes}
      closeOnClick={false}
      onClick={() => setRefresh(minutes)} />
  {/each}
</SubMenu>
<MenuItem
  label={$t`Show mobile version`}
  icon={SmartphoneIcon}
  selected={settings.mobileVersion}
  closeOnClick={false}
  onClick={() => updateWidgetSettings(widget.id, { mobileVersion: !settings.mobileVersion })} />
<MenuItem
  label={$t`Freeze when hidden`}
  icon={SnowflakeIcon}
  selected={settings.freezeWhenHidden}
  closeOnClick={false}
  tooltip={$t`Unload the page while the tab or panel is hidden to save memory and CPU. Login cookies are kept.`}
  onClick={() => updateWidgetSettings(widget.id, { freezeWhenHidden: !settings.freezeWhenHidden })} />
<SubMenu label={$t`Custom width`}>
  {#each WIDGET_PANEL_WIDTHS as width (width ?? "default")}
    <MenuItem
      label={widthLabel(width)}
      selected={settings.customWidthPx === width}
      closeOnClick={false}
      onClick={() => setPanelWidth(width)} />
  {/each}
</SubMenu>
<MenuDivider />
<MenuItem
  label={$t`Edit website…`}
  icon={PencilIcon}
  onClick={() => dispatchEvent("edit")} />
<MenuItem
  label={$t`Remove from panel`}
  classes="danger"
  icon={Trash2Icon}
  onClick={() => removeWidget(widget.id)} />
<MenuDivider />
<MenuItem
  label={$t`Reset panel settings`}
  icon={RotateCcwIcon}
  onClick={() => resetWidgetSettings(widget.id)} />

<script lang="ts">
  import type { WidgetEntry, WidgetRefreshMinutes } from "./widgetState";
  import {
    applyWidgetPanelWidthPreset,
    getWidgetWebSettings,
    normalizeWidgetList,
    reloadWebWidget,
    removeWidget,
    resetWidgetSettings,
    updateWidgetSettings,
    widgetsListSetting,
    WIDGET_PANEL_WIDTHS,
    WIDGET_REFRESH_MINUTES,
  } from "./widgetState";
  import MenuItem from "../Shared/Menu/MenuItem.svelte";
  import SubMenu from "../Shared/Menu/SubMenu.svelte";
  import MenuDivider from "../Shared/Menu/MenuDivider.svelte";
  import ExternalLinkIcon from "lucide-svelte/icons/external-link";
  import AppWindowIcon from "lucide-svelte/icons/app-window";
  import CopyIcon from "lucide-svelte/icons/copy";
  import RefreshCwIcon from "lucide-svelte/icons/refresh-cw";
  import SmartphoneIcon from "lucide-svelte/icons/smartphone";
  import SnowflakeIcon from "lucide-svelte/icons/snowflake";
  import PencilIcon from "lucide-svelte/icons/pencil";
  import Trash2Icon from "lucide-svelte/icons/trash-2";
  import RotateCcwIcon from "lucide-svelte/icons/rotate-ccw";
  import { openExternalURL } from "../../logic/util/os-integration";
  import { openWidgetPopout } from "../../logic/util/widgetBrowser";
  import { appGlobal } from "../../logic/app";
  import { catchErrors } from "../Util/error";
  import { t } from "../../l10n/l10n";
  import { createEventDispatcher } from "svelte";

  export let widget: WidgetEntry;

  const dispatchEvent = createEventDispatcher<{ edit: void }>();

  $: widgetEntry = normalizeWidgetList($widgetsListSetting.value).find(w => w.id === widget.id) ?? widget;
  $: settings = getWidgetWebSettings(widgetEntry);
  $: sessionID = "widget-" + widget.id;

  function refreshLabel(minutes: WidgetRefreshMinutes): string {
    if (minutes === 0) {
      return $t`Off`;
    }
    if (minutes === 1) {
      return $t`1 minute`;
    }
    return $t`${minutes} minutes`;
  }

  function widthLabel(width: number | null): string {
    return width ? $t`${width} px` : $t`Default`;
  }

  function setRefresh(minutes: WidgetRefreshMinutes) {
    updateWidgetSettings(widget.id, { refreshMinutes: minutes });
  }

  function setPanelWidth(width: number | null) {
    updateWidgetSettings(widget.id, { customWidthPx: width });
    applyWidgetPanelWidthPreset(width);
  }

  async function copyPanelUrl() {
    if (!widget.url) {
      return;
    }
    await appGlobal.remoteApp.writeTextToClipboard(widget.url);
  }
</script>

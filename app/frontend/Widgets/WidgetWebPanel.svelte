<vbox flex class="widget-web-panel" class:suspended class:frozen>
  {#if url && !frozen}
    <hbox class="widget-nav">
      <button type="button" class="nav-btn" title={$t`Back`}
        disabled={!canGoBack}
        on:click={goBack}>
        <ArrowLeftIcon size="14px" />
      </button>
      <button type="button" class="nav-btn" title={$t`Forward`}
        disabled={!canGoForward}
        on:click={goForward}>
        <ArrowRightIcon size="14px" />
      </button>
      <button type="button" class="nav-btn" title={$t`Reload`}
        on:click={reloadPage}>
        <RotateCwIcon size="14px" />
      </button>
      <button type="button" class="nav-btn" title={$t`Home`}
        disabled={!url}
        on:click={goHome}>
        <HouseIcon size="14px" />
      </button>
    </hbox>
    <vbox flex class="webview-slot">
      {#key `${reloadKey}-${mobileVersion}`}
        <WebView
          {url}
          {title}
          sessionID={sessionID}
          containNavigation={true}
          userAgent={mobileVersion ? MOBILE_WEBVIEW_USER_AGENT : null}
          on:webview={onWebviewReady} />
      {/key}
    </vbox>
  {/if}

  {#if !suspended && !loadSettled}
    <vbox flex class="state-panel state-overlay">
      <JackdawChaseLoader compact label={$t`Loading website…`} />
    </vbox>
  {/if}
</vbox>

<script lang="ts">
  import WebView from "../Shared/WebView.svelte";
  import JackdawChaseLoader from "../Shared/JackdawChaseLoader.svelte";
  import ArrowLeftIcon from "lucide-svelte/icons/arrow-left";
  import ArrowRightIcon from "lucide-svelte/icons/arrow-right";
  import RotateCwIcon from "lucide-svelte/icons/rotate-cw";
  import HouseIcon from "lucide-svelte/icons/house";
  import { catchErrors } from "../Util/error";
  import { t } from "../../l10n/l10n";
  import { onDestroy } from "svelte";
  import { MOBILE_WEBVIEW_USER_AGENT, widgetReloadNonce } from "./widgetState";

  export let widgetId: string;
  export let url: string;
  export let title: string;
  export let sessionID: string;
  /** Keep mounted but hide native webview layers when panel is collapsed. */
  export let suspended = false;
  export let refreshMinutes = 0;
  export let mobileVersion = false;
  export let freezeWhenHidden = false;

  $: frozen = suspended && freezeWhenHidden;

  let webviewElement: HTMLElement | null = null;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  /** Bird animation until the page finishes loading */
  let loadSettled = false;
  let reloadKey = 0;
  let loadTimer: ReturnType<typeof setTimeout> | null = null;
  let lastReloadTick = 0;
  let activeUrl = "";
  let loadAttempt = 0;
  let loadFinishedForAttempt = 0;
  let canGoBack = false;
  let canGoForward = false;

  type NavigableWebview = HTMLElement & {
    goBack?: () => void;
    goForward?: () => void;
    reload?: () => void;
    canGoBack?: () => boolean;
    canGoForward?: () => boolean;
    loadURL?: (targetUrl: string) => void;
  };

  const LOAD_TIMEOUT_MS = 45000;

  $: if (url && url !== activeUrl) {
    activeUrl = url;
    beginLoad();
  }

  onDestroy(() => {
    clearLoadTimer();
    clearRefreshTimer();
  });

  $: configureRefreshTimer(refreshMinutes, suspended || frozen);

  $: reloadTick = $widgetReloadNonce[widgetId] ?? 0;
  $: if (reloadTick > lastReloadTick) {
    lastReloadTick = reloadTick;
    retryLoad();
  }

  let prevSuspended = suspended;
  $: {
    if (prevSuspended && !suspended && webviewElement && !loadSettled) {
      catchErrors(() => onLoadFinished(webviewElement!));
    }
    prevSuspended = suspended;
  }

  function clearLoadTimer() {
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
  }

  function clearRefreshTimer() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function configureRefreshTimer(minutes: number, paused: boolean) {
    clearRefreshTimer();
    if (minutes <= 0 || paused) {
      return;
    }
    refreshTimer = setInterval(() => {
      if (!suspended && !frozen) {
        retryLoad();
      }
    }, minutes * 60 * 1000);
  }

  function beginLoad() {
    loadAttempt += 1;
    let attempt = loadAttempt;
    clearLoadTimer();
    loadSettled = false;
    loadFinishedForAttempt = 0;
    loadTimer = setTimeout(() => {
      if (attempt === loadAttempt && !loadSettled) {
        settleSuccess();
      }
    }, LOAD_TIMEOUT_MS);
  }

  function settleSuccess() {
    clearLoadTimer();
    loadSettled = true;
  }

  async function onLoadFinished(element: HTMLElement) {
    let attempt = loadAttempt;
    if (attempt !== loadAttempt) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 400));
    if (attempt !== loadAttempt) {
      return;
    }
    loadFinishedForAttempt = attempt;
    settleSuccess();
  }

  $: if (frozen) {
    webviewElement = null;
    canGoBack = false;
    canGoForward = false;
  }

  $: syncWebviewVisibility(webviewElement, suspended && !frozen);

  function syncWebviewVisibility(element: HTMLElement | null, hide: boolean) {
    if (!element) {
      return;
    }
    element.style.display = hide ? "none" : "";
  }

  function syncNavigationState(element: HTMLElement | null) {
    if (!element) {
      canGoBack = false;
      canGoForward = false;
      return;
    }
    let webview = element as NavigableWebview;
    canGoBack = webview.canGoBack?.() ?? false;
    canGoForward = webview.canGoForward?.() ?? false;
  }

  function goBack() {
    let webview = webviewElement as NavigableWebview | null;
    if (webview?.goBack) {
      webview.goBack();
      return;
    }
    if (webview instanceof HTMLIFrameElement) {
      webview.contentWindow?.history.back();
    }
  }

  function goForward() {
    let webview = webviewElement as NavigableWebview | null;
    if (webview?.goForward) {
      webview.goForward();
      return;
    }
    if (webview instanceof HTMLIFrameElement) {
      webview.contentWindow?.history.forward();
    }
  }

  function reloadPage() {
    let webview = webviewElement as NavigableWebview | null;
    if (webview?.reload) {
      beginLoad();
      webview.reload();
      return;
    }
    retryLoad();
  }

  function goHome() {
    if (!url) {
      return;
    }
    let webview = webviewElement as NavigableWebview | null;
    beginLoad();
    if (webview?.loadURL) {
      webview.loadURL(url);
    } else if (webview instanceof HTMLIFrameElement) {
      webview.src = url;
    } else {
      retryLoad();
    }
  }

  function onWebviewReady(event: CustomEvent<HTMLElement>) {
    let element = event.detail;
    webviewElement = element;
    syncWebviewVisibility(webviewElement, suspended && !frozen);

    element.addEventListener("did-start-loading", () => {
      if (loadFinishedForAttempt < loadAttempt) {
        loadSettled = false;
      }
    });
    element.addEventListener("did-navigate", () => {
      syncNavigationState(element);
    });
    element.addEventListener("did-navigate-in-page", () => {
      syncNavigationState(element);
    });
    element.addEventListener("dom-ready", () => {
      loadFinishedForAttempt = loadAttempt;
      syncNavigationState(element);
      catchErrors(() => onLoadFinished(element));
    });
    element.addEventListener("did-finish-load", () => {
      loadFinishedForAttempt = loadAttempt;
      syncNavigationState(element);
      catchErrors(() => onLoadFinished(element));
    });
    element.addEventListener("did-stop-loading", () => {
      syncNavigationState(element);
      if (loadFinishedForAttempt < loadAttempt && !loadSettled) {
        catchErrors(() => onLoadFinished(element));
      }
    });
    if (element instanceof HTMLIFrameElement) {
      element.addEventListener("load", () => {
        loadFinishedForAttempt = loadAttempt;
        syncNavigationState(element);
        catchErrors(() => onLoadFinished(element));
      });
    } else {
      syncNavigationState(element);
      let webview = element as HTMLElement & { isLoading?: () => boolean };
      if (typeof webview.isLoading === "function" && !webview.isLoading()) {
        setTimeout(() => {
          if (!loadSettled) {
            catchErrors(() => onLoadFinished(element));
          }
        }, 150);
      }
    }
  }

  function retryLoad() {
    reloadKey += 1;
    beginLoad();
  }
</script>

<style>
  .widget-web-panel {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }
  .widget-nav {
    flex: 0 0 auto;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    border-block-end: 1px solid var(--border);
    background: var(--headerbar-bg);
  }
  .nav-btn {
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
  .nav-btn:hover:not(:disabled) {
    background: var(--hover-bg);
    color: var(--hover-fg);
    border-color: var(--border);
  }
  .nav-btn:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .webview-slot {
    position: relative;
    min-height: 0;
    overflow: hidden;
  }
  .widget-web-panel.frozen {
    display: none;
  }
  .widget-web-panel :global(webview),
  .widget-web-panel :global(iframe) {
    width: 100%;
    height: 100%;
    border: none;
    flex: 1 1 0;
    min-height: 0;
  }
  .state-panel {
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px 16px;
    text-align: center;
  }
  .state-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--main-bg, var(--leftbar-bg));
  }
</style>

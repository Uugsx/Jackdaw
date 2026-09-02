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
  {:else if !suspended && loadFailed}
    <vbox flex class="state-panel state-overlay">
      <AlertCircleIcon size="28px" class="state-icon" />
      <span class="state-title font-smallest">
        {embedBlocked ? $t`This site cannot be shown in the panel` : $t`This website cannot be shown here`}
      </span>
      <p class="state-text font-smallest">
        {#if embedBlocked}
          {$t`Some sites block the side panel even after sign-in. Open the site in a Jackdaw window with the same session.`}
        {:else}
          {$t`Sign in through Jackdaw to reuse the session in this panel. Safari and Chrome cannot share login with the app.`}
        {/if}
      </p>
      {#if url}
        <Button
          label={signInBusy ? $t`Signing in…` : $t`Sign in`}
          disabled={signInBusy}
          onClick={() => catchErrors(signInAndRetry)} />
        <Button
          label={popoutOpen ? $t`Show Jackdaw window` : $t`Open in Jackdaw window`}
          onClick={() => catchErrors(openPopoutView)} />
        <Button plain label={$t`Open in browser`} onClick={() => catchErrors(() => openExternalURL(url))} />
      {/if}
      <Button plain label={$t`Retry`} onClick={retryLoad} />
    </vbox>
  {/if}
</vbox>

<script lang="ts">
  import WebView from "../Shared/WebView.svelte";
  import JackdawChaseLoader from "../Shared/JackdawChaseLoader.svelte";
  import Button from "../Shared/Button.svelte";
  import AlertCircleIcon from "lucide-svelte/icons/circle-alert";
  import ArrowLeftIcon from "lucide-svelte/icons/arrow-left";
  import ArrowRightIcon from "lucide-svelte/icons/arrow-right";
  import RotateCwIcon from "lucide-svelte/icons/rotate-cw";
  import HouseIcon from "lucide-svelte/icons/house";
  import { openExternalURL } from "../../logic/util/os-integration";
  import {
    focusWidgetPopout,
    openWidgetPopout,
    openWidgetSignIn,
  } from "../../logic/util/widgetBrowser";
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

  /** Bird animation until load succeeds or failure is confirmed */
  let loadSettled = false;
  let loadFailed = false;
  let embedBlocked = false;
  let signInBusy = false;
  let popoutOpen = false;
  let reloadKey = 0;
  let loadTimer: ReturnType<typeof setTimeout> | null = null;
  let failDebounceTimer: ReturnType<typeof setTimeout> | null = null;
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
  const FAIL_DEBOUNCE_MS = 4000;

  $: if (url && url !== activeUrl) {
    activeUrl = url;
    popoutOpen = false;
    beginLoad();
  }

  onDestroy(() => {
    clearLoadTimer();
    clearFailDebounce();
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
    if (prevSuspended && !suspended && webviewElement) {
      if (loadFailed || !loadSettled) {
        catchErrors(() => onLoadFinished(webviewElement!));
      }
    }
    prevSuspended = suspended;
  }

  function clearLoadTimer() {
    if (loadTimer) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
  }

  function clearFailDebounce() {
    if (failDebounceTimer) {
      clearTimeout(failDebounceTimer);
      failDebounceTimer = null;
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
    clearFailDebounce();
    loadSettled = false;
    loadFailed = false;
    embedBlocked = false;
    loadFinishedForAttempt = 0;
    loadTimer = setTimeout(() => {
      if (attempt === loadAttempt && !loadSettled) {
        settleFailed(embedBlocked);
      }
    }, LOAD_TIMEOUT_MS);
  }

  function settleSuccess() {
    clearLoadTimer();
    clearFailDebounce();
    loadSettled = true;
    loadFailed = false;
    embedBlocked = false;
  }

  function settleFailed(blocked: boolean) {
    clearLoadTimer();
    clearFailDebounce();
    loadSettled = true;
    loadFailed = true;
    embedBlocked = blocked;
  }

  function isIgnorableLoadError(
    errorCode: number | undefined,
    errorDescription: string,
    isMainFrame: boolean | undefined
  ): boolean {
    // Подресурсы (реклама, аналитика, вспомогательные фреймы) сбоят штатно — никогда не блокируем сайт
    if (isMainFrame === false) {
      return true;
    }
    // ERR_ABORTED (-3) возникает при любых клиентских и HTTP редиректах, смене URL
    if (errorCode === -3 || errorDescription.includes("ERR_ABORTED")) {
      return true;
    }
    return false;
  }

  function scheduleLoadFailure(event: Event | undefined, blocked: boolean) {
    let attempt = loadAttempt;
    clearFailDebounce();
    failDebounceTimer = setTimeout(() => {
      if (attempt !== loadAttempt || loadSettled) {
        return;
      }
      if (loadFinishedForAttempt >= attempt) {
        return;
      }
      // Не объявляем ошибку, если страница всё ещё активно в процессе загрузки
      let webview = webviewElement as (HTMLElement & { isLoading?: () => boolean }) | null;
      if (typeof webview?.isLoading === "function" && webview.isLoading()) {
        return;
      }
      embedBlocked = blocked;
      settleFailed(blocked);
    }, FAIL_DEBOUNCE_MS);
  }

  function markLoadFailed(event?: Event) {
    if (loadFinishedForAttempt === loadAttempt) {
      return;
    }
    let detail = (event as CustomEvent | undefined)?.detail ?? {};
    let errorCode = (detail?.errorCode ?? (event as any)?.errorCode) as number | undefined;
    let errorDescription = String(detail?.errorDescription ?? (event as any)?.errorDescription ?? "");
    let isMainFrame = (detail?.isMainFrame ?? (event as any)?.isMainFrame) as boolean | undefined;

    if (isIgnorableLoadError(errorCode, errorDescription, isMainFrame)) {
      return;
    }
    let blocked = errorCode === -27
      || errorDescription.includes("X-Frame-Options")
      || errorDescription.includes("Refused to display")
      || errorDescription.includes("refused to connect")
      || errorDescription.includes("Content Security Policy");
    scheduleLoadFailure(event, blocked);
  }

  async function pageLooksEmbedBlocked(element: HTMLElement): Promise<boolean> {
    let webview = element as HTMLElement & { executeJavaScript?: (code: string) => Promise<unknown> };
    if (!webview.executeJavaScript) {
      return false;
    }
    try {
      return await webview.executeJavaScript(`
        (() => {
          if (location.href.startsWith("chrome-error://")) {
            return true;
          }
          const text = (document.body?.innerText ?? "").trim();
          if (text.length === 0 || text.length > 500) {
            return false;
          }
          const lower = text.toLowerCase();
          return lower.includes("refused to connect")
            || lower.includes("cannot be shown in a frame")
            || lower.includes("нельзя показать во фрейме");
        })()
      `) as boolean;
    } catch {
      return false;
    }
  }

  async function onLoadFinished(element: HTMLElement) {
    let attempt = loadAttempt;
    clearFailDebounce();
    if (attempt !== loadAttempt) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 400));
    if (attempt !== loadAttempt) {
      return;
    }
    loadFinishedForAttempt = attempt;
    if (await pageLooksEmbedBlocked(element)) {
      settleFailed(true);
      return;
    }
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
      clearFailDebounce();
      loadFailed = false;
      // Если попытка загрузки ещё не завершена (новая страница, рефреш):
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
    element.addEventListener("did-fail-load", (evt) => {
      markLoadFailed(evt as Event);
    });
    element.addEventListener("dom-ready", () => {
      loadFinishedForAttempt = loadAttempt;
      clearFailDebounce();
      syncNavigationState(element);
      catchErrors(() => onLoadFinished(element));
    });
    element.addEventListener("did-finish-load", () => {
      loadFinishedForAttempt = loadAttempt;
      clearFailDebounce();
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
      element.addEventListener("error", () => {
        markLoadFailed();
      });
      element.addEventListener("load", () => {
        loadFinishedForAttempt = loadAttempt;
        clearFailDebounce();
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

  async function signInAndRetry() {
    if (!url || signInBusy) {
      return;
    }
    signInBusy = true;
    try {
      await openWidgetSignIn(sessionID, url, title);
      retryLoad();
    } finally {
      signInBusy = false;
    }
  }

  async function openPopoutView() {
    if (!url) {
      return;
    }
    if (popoutOpen && await focusWidgetPopout(sessionID)) {
      return;
    }
    await openWidgetPopout(sessionID, url, title);
    popoutOpen = true;
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
  .state-panel :global(.state-icon) {
    color: color-mix(in srgb, var(--leftbar-fg) 58%, transparent);
  }
  .state-title {
    font-weight: 650;
  }
  .state-text {
    margin: 0;
    max-width: 260px;
    line-height: 1.35;
    color: color-mix(in srgb, var(--leftbar-fg) 68%, transparent);
  }
</style>

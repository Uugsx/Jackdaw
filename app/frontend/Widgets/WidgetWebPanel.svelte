<vbox flex class="widget-web-panel" class:suspended class:frozen>
  {#if url && !frozen}
    {#key `${reloadKey}-${mobileVersion}`}
      <WebView
        {url}
        {title}
        sessionID={sessionID}
        containNavigation={true}
        userAgent={mobileVersion ? MOBILE_WEBVIEW_USER_AGENT : null}
        on:webview={onWebviewReady} />
    {/key}
  {/if}

  {#if !suspended && loading}
    <vbox flex class="state-panel state-overlay">
      <JackdawChaseLoader label={$t`Loading website…`} />
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

  let loading = true;
  let loadFailed = false;
  let embedBlocked = false;
  let signInBusy = false;
  let popoutOpen = false;
  let reloadKey = 0;
  let loadTimer: ReturnType<typeof setTimeout> | null = null;
  let lastReloadTick = 0;
  let activeUrl = "";

  $: if (url && url !== activeUrl) {
    activeUrl = url;
    popoutOpen = false;
    startLoadTimer();
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

  function startLoadTimer() {
    clearLoadTimer();
    loading = true;
    loadFailed = false;
    embedBlocked = false;
    loadTimer = setTimeout(() => {
      if (loading) {
        loading = false;
        loadFailed = true;
      }
    }, 30000);
  }

  function markLoadFailed(event?: Event) {
    let detail = (event as CustomEvent | undefined)?.detail ?? {};
    let errorCode = detail?.errorCode ?? (event as any)?.errorCode;
    let errorDescription = String(detail?.errorDescription ?? (event as any)?.errorDescription ?? "");
    if (detail?.isMainFrame === false || errorCode === -3) {
      return;
    }
    loading = false;
    loadFailed = true;
    clearLoadTimer();
    embedBlocked = errorCode === -27
      || errorDescription.includes("X-Frame-Options")
      || errorDescription.includes("frame")
      || errorDescription.includes("CSP");
  }

  async function pageLooksEmbedBlocked(element: HTMLElement): Promise<boolean> {
    let webview = element as HTMLElement & { executeJavaScript?: (code: string) => Promise<unknown> };
    if (!webview.executeJavaScript) {
      return false;
    }
    try {
      return await webview.executeJavaScript(`
        (() => {
          const text = (document.body?.innerText ?? "").toLowerCase();
          return text.includes("cannot be shown")
            || text.includes("can't be shown")
            || text.includes("нельзя показать")
            || text.includes("refused to connect");
        })()
      `) as boolean;
    } catch {
      return false;
    }
  }

  async function onLoadFinished(element: HTMLElement) {
    clearLoadTimer();
    if (await pageLooksEmbedBlocked(element)) {
      embedBlocked = true;
      loading = false;
      loadFailed = true;
      return;
    }
    loading = false;
    loadFailed = false;
    embedBlocked = false;
  }

  $: if (frozen) {
    webviewElement = null;
  }

  $: syncWebviewVisibility(webviewElement, suspended && !frozen);

  function syncWebviewVisibility(element: HTMLElement | null, hide: boolean) {
    if (!element) {
      return;
    }
    element.style.display = hide ? "none" : "";
  }

  function onWebviewReady(event: CustomEvent<HTMLElement>) {
    let element = event.detail;
    webviewElement = element;
    syncWebviewVisibility(webviewElement, suspended && !frozen);

    element.addEventListener("did-fail-load", (evt) => {
      markLoadFailed(evt as Event);
    });
    element.addEventListener("did-finish-load", () => {
      catchErrors(() => onLoadFinished(element));
    });
    if (element instanceof HTMLIFrameElement) {
      element.addEventListener("error", () => {
        markLoadFailed();
      });
      element.addEventListener("load", () => {
        catchErrors(() => onLoadFinished(element));
      });
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
    startLoadTimer();
  }
</script>

<style>
  .widget-web-panel {
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
    background: var(--leftbar-bg);
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

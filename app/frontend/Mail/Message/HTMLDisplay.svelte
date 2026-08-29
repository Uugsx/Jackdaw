<WebView html={displayHtml} {headHTML} {bodyClass} allowServerCalls={allowExternalImages} title={$t`Text`} on:webview />

<script lang="ts">
  import cssContent from "./content.css?inline";
  import cssBody from "./content-body.css?inline";
  import cssBodyDark from "./content-body-dark.css?inline";
  import { adaptEmailHtmlForDarkMode } from "./emailDarkMode";
  import WebView from "../../Shared/WebView.svelte";
  import { getLocalStorage } from "../../Util/LocalStorage";
  import { t } from "../../../l10n/l10n";

  /** DANGER Attention: You must sanitize the HTML. It comes from untrusted sources.
   * @see also Chat Message.svelte */
  export let html: string;
  export let allowExternalImages = false;
  /** out only */
  export let webviewE: HTMLIFrameElement = null;

  let themeSetting = getLocalStorage("appearance.theme", "system");

  function resolveDarkTheme(theme: string): boolean {
    if (theme == "dark") {
      return true;
    }
    if (theme == "light") {
      return false;
    }
    return typeof window != "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  $: darkEmail = resolveDarkTheme($themeSetting.value);
  $: bodyClass = darkEmail ? "jackdaw-email-dark" : "jackdaw-email-light";
  $: displayHtml = darkEmail ? adaptEmailHtmlForDarkMode(html) : html;
  $: headHTML = `<style>\n${cssBody}\n${cssContent}\n${cssBodyDark}\n</style>`;
</script>

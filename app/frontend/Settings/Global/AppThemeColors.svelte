<vbox class="colors">
  <hbox class="hint font-small">{$t`These colors override the current theme. Clear restores the default.`}</hbox>
  {#each Object.keys(cssVars) as cssVar}
    {@const label = cssVars[cssVar]}
    {@const custom = !!colors[cssVar]}
    <grid class="color-setting">
      <hbox class="label">{label}</hbox>
      <label class="swatch">
        <input type="color"
          value={swatchHex(cssVar)}
          on:input={(event) => onPick(cssVar, event.currentTarget.value)}
          />
        <hbox class="swatch-face" style:background={swatchHex(cssVar)} />
      </label>
      <Button
        label={$t`Clear`}
        icon={XIcon}
        iconSize="16px"
        plain
        onClick={() => onClear(cssVar)}
        disabled={!custom}
        />
    </grid>
  {/each}
</vbox>

<script lang="ts">
  import { getLocalStorage } from "../../Util/LocalStorage";
  import { applyColors, contrastTextColor, cssColorToHex } from "./AppThemeColors";
  import Button from "../../Shared/Button.svelte";
  import XIcon from "lucide-svelte/icons/x";
  import { t } from "../../../l10n/l10n";

  let themeSetting = getLocalStorage("appearance.theme", "system");
  let colorsSetting = getLocalStorage("appearance.colors", {});
  $: colors = ($colorsSetting.value ?? {}) as Record<string, string>;
  $: theme = $themeSetting.value;

  /**
   * Defines which colors (css vars) the user can modify.
   *
   * Key: The CSS var in `app.css` `:root {`
   * Value: User-readable label for the key.
   *
   * List only the "-bg" CSS var.
   * The corresponding "-fg" will be set automatically to the contrast color.
   */
  const cssVars = {
    "bg": $t`Background`,
    "main-bg": $t`Center`,
    "leftbar-bg": $t`Left bar`,
    "appbar-bg": $t`App bar`,
    "windowheader-bg": $t`Title bar`,
    "selected-bg": $t`Selection`,
  };

  $: computed = readComputed(theme, colors);

  function readComputed(_theme: string, _colors: Record<string, string>): Record<string, string> {
    if (typeof document == "undefined") {
      return {};
    }
    let style = getComputedStyle(document.documentElement);
    let result: Record<string, string> = {};
    for (let cssVar of Object.keys(cssVars)) {
      result[cssVar] = cssColorToHex(style.getPropertyValue("--" + cssVar)) || "#000000";
    }
    return result;
  }

  function swatchHex(cssVar: string): string {
    return colors[cssVar] || computed[cssVar] || "#000000";
  }

  function onPick(cssVar: string, color: string) {
    let next = { ...colors, [cssVar]: color };
    if (cssVar.endsWith("bg")) {
      let fgVar = cssVar.substring(0, cssVar.length - 2) + "fg";
      let textColor = contrastTextColor(color);
      next[fgVar] = textColor;
      if (cssVar == "bg") {
        themeSetting.value = textColor == "#ffffff" ? "dark" : "light";
      }
    }
    colorsSetting.value = next;
    applyColors(next);
  }

  function onClear(cssVar: string) {
    let next = { ...colors };
    delete next[cssVar];
    if (cssVar.endsWith("bg")) {
      delete next[cssVar.substring(0, cssVar.length - 2) + "fg"];
    }
    colorsSetting.value = next;
    applyColors(next);
  }
</script>

<style>
  .hint {
    opacity: 0.7;
    margin-block-end: 12px;
    max-width: 40em;
    line-height: 1.4;
  }
  grid.color-setting {
    grid-template-columns: 10em 3.5em auto 1fr;
    align-items: center;
    gap: 12px 16px;
    min-height: 32px;
  }
  .label {
    align-items: center;
  }
  .swatch {
    position: relative;
    width: 3.5em;
    height: 24px;
    cursor: pointer;
  }
  .swatch input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }
  .swatch-face {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    border: 1px solid var(--border);
    box-sizing: border-box;
    pointer-events: none;
  }
</style>

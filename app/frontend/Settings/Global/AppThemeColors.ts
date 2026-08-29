/**
 * @param hex a background color, as HTML hex with `#`
 * @returns either black or white,
 *   depending on what gives the best contrast,
 *   as HTML hex with `#`
 */
export function contrastTextColor(hex: string): "#ffffff" | "#000000" {
    let h = hex.replace(/^#/, "");
    let r = parseInt(h.slice(0, 2), 16);
    let g = parseInt(h.slice(2, 4), 16);
    let b = parseInt(h.slice(4, 6), 16);
    let yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
}

const managedColorVars = [
  "bg", "fg",
  "main-bg", "main-fg",
  "leftbar-bg", "leftbar-fg",
  "appbar-bg", "appbar-fg",
  "windowheader-bg", "windowheader-fg",
  "selected-bg", "selected-fg",
];

export function applyColors(colors: Record<string, string> | null | undefined) {
  let style = document.documentElement.style;
  let next = colors ?? {};
  for (let cssVar of managedColorVars) {
    let color = next[cssVar];
    if (color) {
      style.setProperty("--" + cssVar, color);
    } else {
      style.removeProperty("--" + cssVar);
    }
  }
}

/** Native `<input type="color">` needs `#rrggbb`. */
export function cssColorToHex(value: string): string {
  let raw = (value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return raw.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    let r = raw[1];
    let g = raw[2];
    let b = raw[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  let rgb = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    let hex = (n: string) => Number(n).toString(16).padStart(2, "0");
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
  }
  return "";
}

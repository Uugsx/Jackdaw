<div class="preview" aria-hidden="true">
  {#if kind === "popup"}
    <svg viewBox="0 0 176 72" xmlns="http://www.w3.org/2000/svg">
      <rect class="shell" x="1" y="1" width="174" height="70" rx="12" />
      <rect class="tile" x="12" y="15" width="30" height="30" rx="9" />
      <path class="ink-stroke" d="M19 27.5h16v11H19z M20 29l7 5 7-5" />
      <circle class="accent" cx="158" cy="15" r="5.5" />
      <path class="muted-stroke" d="M54 20h90 M54 30h72 M54 49h48" />
      <path class="accent-stroke" d="M54 58h28" />
    </svg>
  {:else if kind === "sound"}
    <svg viewBox="0 0 176 72" xmlns="http://www.w3.org/2000/svg">
      <rect class="shell" x="1" y="1" width="174" height="70" rx="12" />
      <circle class="tile" cx="38" cy="36" r="22" />
      <path class="accent-stroke" d="M27 33h6l8-7v20l-8-7h-6z" />
      <path class="ink-stroke" d="M47 30c4 3 4 9 0 12 M53 25c7 6 7 16 0 22" />
      <path class="muted-stroke" d="M80 25h65 M80 36h47 M80 47h58" />
      <circle class="accent" cx="151" cy="47" r="4" />
    </svg>
  {:else if kind === "appbar"}
    <svg viewBox="0 0 176 72" xmlns="http://www.w3.org/2000/svg">
      <rect class="shell" x="18" y="5" width="35" height="62" rx="12" />
      <rect class="tile" x="25" y="15" width="21" height="21" rx="7" />
      <path class="ink-stroke" d="M29 22h13v8H29z M30 23.5l5.5 4 5.5-4" />
      <circle class="accent" cx="46" cy="16" r="6" />
      <path class="muted-stroke" d="M72 22h48 M72 33h68 M72 44h34" />
      <path class="accent-stroke" d="M72 55h26" />
    </svg>
  {:else}
    <svg viewBox="0 0 176 72" xmlns="http://www.w3.org/2000/svg">
      <rect class="shell" x="1" y="1" width="174" height="70" rx="12" />
      <path class="muted-stroke" d="M24 58h128" />
      <rect class="tile" x="70" y="19" width="36" height="31" rx="10" />
      <path class="ink-stroke" d="M78 28h20v13H78z M79.5 30l8.5 6 8.5-6" />
      <circle class="accent" cx="101" cy="20" r="6" />
      <path class="muted-stroke" d="M47 47h13 M116 47h13" />
    </svg>
  {/if}
</div>

<script lang="ts">
  export type NotificationPreviewKind = "popup" | "sound" | "appbar" | "taskbar";

  export let kind: NotificationPreviewKind;
</script>

<style>
  .preview {
    width: 120px;
    height: 68px;
    margin: 4px 0 20px 28px;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .shell {
    fill: var(--glass-bg-elevated);
    stroke: var(--border);
    stroke-width: 1.25;
  }

  .tile {
    fill: color-mix(in srgb, var(--icon-primary) 14%, var(--main-bg));
    stroke: var(--glass-border);
    stroke-width: 1.25;
  }

  .accent {
    fill: var(--icon-primary);
  }

  .accent-stroke,
  .ink-stroke,
  .muted-stroke {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .accent-stroke {
    stroke: var(--icon-primary);
    stroke-width: 1.8;
  }

  .ink-stroke {
    stroke: var(--fg);
    stroke-width: 1.65;
  }

  .muted-stroke {
    stroke: color-mix(in srgb, var(--fg) 38%, transparent);
    stroke-width: 1.7;
  }
</style>

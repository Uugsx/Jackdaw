<div class="jackdaw-chase" class:compact class:idle role="status" aria-live="polite" aria-label={label ?? undefined}>
  <div class="scene" aria-hidden="true">
    <div class="sky-line" />
    <span class="puff puff-1" />
    <span class="puff puff-2" />
    <span class="puff puff-3" />
    <div class="actor envelope">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path class="envelope-body" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
        <path class="envelope-flap" d="M3 7.5 12 13.5 21 7.5" />
      </svg>
    </div>
    <div class="actor bird">
      <img class="bird-art" src={jackdawBird} alt="" draggable="false" decoding="async" />
    </div>
  </div>
  {#if label}
    <span class="label font-smallest">{label}</span>
  {/if}
</div>

<script lang="ts">
  import jackdawBird from "../asset/icon/general/jackdaw-flight-bird.png";

  export let compact = false;
  export let idle = false;
  export let label: string | null = null;
</script>

<style>
  .jackdaw-chase {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 8px 4px;
  }
  .jackdaw-chase.compact {
    gap: 8px;
    padding: 4px 0;
  }
  .scene {
    position: relative;
    width: 196px;
    height: 72px;
    overflow: hidden;
  }
  .compact .scene {
    width: 168px;
    height: 58px;
  }
  .sky-line {
    position: absolute;
    left: 8px;
    right: 8px;
    bottom: 14px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--icon-primary) 28%, var(--border)) 18%,
      color-mix(in srgb, var(--icon-primary) 28%, var(--border)) 82%,
      transparent
    );
    opacity: 0.85;
  }
  .puff {
    position: absolute;
    bottom: 20px;
    width: 10px;
    height: 2px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--leftbar-fg, var(--fg)) 18%, transparent);
    opacity: 0;
    animation: puff-fade 2.4s ease-in-out infinite;
  }
  .puff-1 { left: 24px; animation-delay: 0s; }
  .puff-2 { left: 72px; animation-delay: 0.55s; }
  .puff-3 { left: 120px; animation-delay: 1.1s; }
  .actor {
    position: absolute;
    bottom: 2px;
    will-change: transform;
  }
  .envelope {
    animation: envelope-glide 2.4s cubic-bezier(0.42, 0, 0.2, 1) infinite;
  }
  .bird {
    animation: bird-chase 2.4s cubic-bezier(0.42, 0, 0.2, 1) infinite;
    transform-origin: 58% 62%;
  }
  .bird-art {
    display: block;
    width: auto;
    height: 46px;
    transform-origin: 58% 58%;
    animation: bird-flap 0.38s ease-in-out infinite alternate;
    user-select: none;
    pointer-events: none;
    -webkit-user-drag: none;
    filter: drop-shadow(0 1px 0 color-mix(in srgb, var(--leftbar-fg, var(--fg)) 8%, transparent));
  }
  .compact .bird-art {
    height: 36px;
  }
  .envelope-body {
    fill: color-mix(in srgb, var(--leftbar-bg, var(--bg)) 88%, var(--icon-primary) 12%);
    stroke: color-mix(in srgb, var(--icon-primary) 72%, var(--leftbar-fg, var(--fg)));
    stroke-width: 1.4;
  }
  .envelope-flap {
    fill: none;
    stroke: color-mix(in srgb, var(--icon-primary) 55%, var(--leftbar-fg, var(--fg)));
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .label {
    margin: 0;
    color: color-mix(in srgb, var(--leftbar-fg, var(--fg)) 68%, transparent);
    line-height: 1.35;
    text-align: center;
  }

  @keyframes envelope-glide {
    0%, 100% {
      transform: translate(118px, 2px) rotate(-2deg);
    }
    45% {
      transform: translate(132px, -2px) rotate(1deg);
    }
    55% {
      transform: translate(128px, -1px) rotate(0deg);
    }
  }
  @keyframes bird-chase {
    0%, 100% {
      transform: translate(-4px, 4px) rotate(-4deg) scale(0.98);
    }
    45% {
      transform: translate(54px, -2px) rotate(-2deg) scale(1);
    }
    55% {
      transform: translate(44px, 0) rotate(-3deg) scale(0.99);
    }
  }
  @keyframes bird-flap {
    from {
      transform: scaleY(0.94) rotate(-3deg);
    }
    to {
      transform: scaleY(1.05) rotate(2deg);
    }
  }
  @keyframes puff-fade {
    0%, 100% { opacity: 0; transform: translateX(0); }
    20% { opacity: 0.55; }
    50% { opacity: 0; transform: translateX(10px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .envelope,
    .bird,
    .bird-art,
    .puff {
      animation: none;
    }
    .envelope {
      transform: translate(124px, 2px);
    }
    .bird {
      transform: translate(40px, 0) rotate(-3deg);
    }
  }

  .idle .envelope {
    animation: idle-float 3.2s ease-in-out infinite;
  }
  .idle .bird {
    animation: idle-watch 3.2s ease-in-out infinite;
  }
  .idle .bird-art {
    animation: bird-idle-bob 2.8s ease-in-out infinite alternate;
  }
  .idle .puff {
    display: none;
  }

  @keyframes idle-float {
    0%, 100% { transform: translate(102px, 2px) rotate(-1deg); }
    50% { transform: translate(102px, 0) rotate(1deg); }
  }
  @keyframes idle-watch {
    0%, 100% { transform: translate(34px, 2px) rotate(-3deg); }
    50% { transform: translate(36px, 0) rotate(-2deg); }
  }
  @keyframes bird-idle-bob {
    from { transform: translateY(1px) scaleY(0.98); }
    to { transform: translateY(-1px) scaleY(1.02); }
  }

  @media (prefers-reduced-motion: reduce) {
    .idle .envelope {
      transform: translate(102px, 2px);
    }
    .idle .bird {
      transform: translate(34px, 2px) rotate(-3deg);
    }
  }
</style>

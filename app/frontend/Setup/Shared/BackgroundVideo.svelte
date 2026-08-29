<div class="setup-background" aria-hidden="true"></div>

<style>
  .setup-background {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      radial-gradient(ellipse 80% 60% at 85% 15%, rgba(245, 158, 11, 0.22), transparent 55%),
      radial-gradient(ellipse 70% 50% at 10% 90%, rgba(197, 205, 214, 0.35), transparent 50%),
      linear-gradient(155deg, #E8EAEE 0%, #F6F7F9 42%, #DEE3E9 100%);
  }

  @media (prefers-color-scheme: dark) {
    .setup-background {
      background:
        radial-gradient(ellipse 75% 55% at 88% 12%, rgba(245, 158, 11, 0.18), transparent 55%),
        radial-gradient(ellipse 65% 45% at 8% 88%, rgba(31, 41, 51, 0.9), transparent 50%),
        linear-gradient(155deg, #0B0F14 0%, #141A22 48%, #1F2933 100%);
    }
  }
</style>

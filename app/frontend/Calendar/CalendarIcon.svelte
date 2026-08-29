<hbox class="calendar-icon" style="width: {size}; height: {size}">
  <vbox class="frame" style="width: {frameSize}px; height: {frameSize}px">
    <hbox class="header" style="height: {headerHeight}px" />
    <hbox class="day" style="font-size: {dayFontSize}px">{day}</hbox>
  </vbox>
</hbox>

<script lang="ts">
  import { onMount } from "svelte";

  export let size: string = "24px";

  let day = new Date().getDate();

  $: px = parseInt(size) || 24;
  $: frameSize = Math.round(px * 0.82);
  $: headerHeight = Math.max(4, Math.round(px * 0.24));
  $: dayFontSize = Math.max(9, Math.round(px * 0.42));

  onMount(setupNextUpdate);
  function setupNextUpdate() {
    let now = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    let nextUpdate = tomorrow.getTime() - now.getTime();
    setTimeout(() => {
      day = new Date().getDate();
      setupNextUpdate();
    }, nextUpdate);
  }
</script>

<style>
  .calendar-icon {
    align-items: center;
    justify-content: center;
    color: inherit;
  }
  .frame {
    border: 1.75px solid currentColor;
    border-radius: 4px;
    overflow: hidden;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  .header {
    background: currentColor;
    opacity: 0.88;
    flex-shrink: 0;
  }
  .day {
    flex: 1;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
    font-feature-settings: "tnum";
    color: currentColor;
  }
</style>

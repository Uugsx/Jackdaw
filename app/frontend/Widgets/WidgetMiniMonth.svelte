<vbox class="widget-mini-month">
  <hbox class="month-toolbar">
    <button type="button" class="nav-btn" title={$t`Previous month`} on:click={previousMonth}>
      <ChevronLeftIcon size="16px" />
    </button>
    <hbox flex class="month-label font-smallest">{monthTitle}</hbox>
    <button type="button" class="nav-btn" title={$t`Next month`} on:click={nextMonth}>
      <ChevronRightIcon size="16px" />
    </button>
  </hbox>

  <grid class="weekday-row">
    {#each weekdayLabels as label}
      <span class="weekday font-smallest">{label}</span>
    {/each}
  </grid>

  <grid class="day-grid" class:expanded>
    {#each visibleDays as day (day.getTime())}
      <button type="button"
        class="day-cell font-smallest tabular-nums"
        class:other-month={!isSameMonth(day, visibleMonth)}
        class:today={isSameDay(day, today)}
        class:selected={isSameDay(day, $selectedDate)}
        on:click={() => selectDay(day)}>
        {#if day.getDate() === 1 && !isSameMonth(day, visibleMonth)}
          <span class="day-num with-month">{formatDayWithMonth(day)}</span>
        {:else}
          <span class="day-num">{day.getDate()}</span>
        {/if}
      </button>
    {/each}
  </grid>

  <button type="button" class="expand-btn" title={expanded ? $t`Show fewer weeks` : $t`Show full month`}
    on:click={() => expanded = !expanded}>
    {#if expanded}
      <ChevronUpIcon size="14px" />
    {:else}
      <ChevronDownIcon size="14px" />
    {/if}
  </button>
</vbox>

<script lang="ts">
  import ChevronLeftIcon from "lucide-svelte/icons/chevron-left";
  import ChevronRightIcon from "lucide-svelte/icons/chevron-right";
  import ChevronDownIcon from "lucide-svelte/icons/chevron-down";
  import ChevronUpIcon from "lucide-svelte/icons/chevron-up";
  import { getToday, getWeekStart, kAllWeekdays, weekdayLabel } from "../Util/date";
  import { selectedDate } from "../Calendar/selected";
  import { getDateTimeLocale, t } from "../../l10n/l10n";
  import { onMount } from "svelte";

  export let visibleMonth = startOfMonth(new Date());
  let expanded = false;
  let today = getToday();
  let midnightTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    refreshTodayAtMidnight();
    return () => {
      if (midnightTimer) {
        clearTimeout(midnightTimer);
      }
    };
  });

  function refreshTodayAtMidnight() {
    let now = new Date();
    let nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    midnightTimer = setTimeout(() => {
      today = getToday();
      refreshTodayAtMidnight();
    }, nextMidnight.getTime() - now.getTime());
  }

  $: weekdayLabels = kAllWeekdays.map(day => weekdayLabel(day, "narrow"));
  $: visibleDays = expanded ? buildMonthGrid(visibleMonth) : buildCompactGrid(visibleMonth);
  $: monthTitle = visibleMonth.toLocaleDateString(getDateTimeLocale(), { month: "long", year: "numeric" });

  function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function isSameDay(a: Date, b: Date | null | undefined): boolean {
    if (!b) {
      return false;
    }
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function buildCompactGrid(anchor: Date): Date[] {
    let pivot = isSameMonth(new Date(), anchor)
      ? new Date()
      : new Date(anchor.getFullYear(), anchor.getMonth(), 15);
    return buildDayRange(getWeekStart(pivot), 14);
  }

  function buildMonthGrid(anchor: Date): Date[] {
    let start = getWeekStart(anchor);
    while (start.getMonth() !== anchor.getMonth() && start.getDate() > 7) {
      start.setDate(start.getDate() - 7);
    }
    return buildDayRange(start, 42);
  }

  function buildDayRange(start: Date, count: number): Date[] {
    let cursor = new Date(start);
    let days: Date[] = [];
    for (let i = 0; i < count; i++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  function formatDayWithMonth(day: Date): string {
    return day.toLocaleDateString(getDateTimeLocale(), { day: "numeric", month: "short" });
  }

  function selectDay(day: Date) {
    $selectedDate = day;
    visibleMonth = startOfMonth(day);
  }

  function previousMonth() {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  }

  function nextMonth() {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
  }
</script>

<style>
  .widget-mini-month {
    flex-shrink: 0;
    gap: 2px;
    padding: 10px 10px 4px;
    border-block-end: 1px solid var(--border);
    background: var(--leftbar-bg);
  }
  .month-toolbar {
    align-items: center;
    gap: 2px;
    margin-block-end: 6px;
  }
  .month-label {
    justify-content: center;
    font-weight: 650;
    text-transform: capitalize;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-btn,
  .expand-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    background: transparent;
    color: color-mix(in srgb, var(--leftbar-fg) 72%, transparent);
    cursor: default;
  }
  .nav-btn:hover,
  .expand-btn:hover {
    background: var(--hover-bg);
    color: var(--hover-fg);
    border-color: var(--border);
  }
  .weekday-row,
  .day-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    column-gap: 2px;
  }
  .weekday-row {
    margin-block-end: 2px;
  }
  .weekday {
    text-align: center;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: color-mix(in srgb, var(--leftbar-fg) 58%, transparent);
    padding-block: 2px;
  }
  .day-grid {
    row-gap: 2px;
  }
  .day-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: default;
  }
  .day-cell:hover:not(.today) {
    background: var(--hover-bg);
  }
  .day-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.75rem;
    min-height: 1.75rem;
    line-height: 1;
  }
  .day-num.with-month {
    font-size: 10px;
    min-width: 0;
    padding-inline: 2px;
  }
  .day-cell.other-month {
    color: color-mix(in srgb, var(--leftbar-fg) 42%, transparent);
  }
  .day-cell.today .day-num {
    background: var(--icon-primary);
    color: var(--selected-fg, #fff);
    border-radius: 999px;
    font-weight: 650;
  }
  .day-cell.selected:not(.today) {
    background: color-mix(in srgb, var(--icon-primary) 12%, transparent);
    color: var(--icon-primary);
    font-weight: 600;
  }
  .expand-btn {
    align-self: center;
    margin-block-start: 2px;
    width: 100%;
    height: 22px;
    opacity: 0.72;
  }
  .expand-btn:hover {
    opacity: 1;
  }
</style>

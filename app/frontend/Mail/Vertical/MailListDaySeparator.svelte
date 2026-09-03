<hbox class="mail-list-day-separator">
  <hbox class="label">{label}</hbox>
</hbox>

<script lang="ts">
  export let label: string;
</script>

<style>
  .mail-list-day-separator {
    min-height: var(--fast-list-row-height, 2.75rem);
    box-sizing: border-box;
    align-items: flex-end;
    padding: 4px 12px 6px 22px;
    border-bottom: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
    pointer-events: none;
    user-select: none;
  }
  .label {
    font-size: var(--msg-list-fs-sm, 12px);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--icon-primary, #0066cc);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>

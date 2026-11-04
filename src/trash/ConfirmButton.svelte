<script lang="ts">
  import { TRASH_PATH } from "./icons";

  /** How long a first click waits for the second before it stands down. */
  const ARMED_MS = 4000;

  /** Deletes for good on a second click: the first only asks, and the question goes away if it is not answered. */
  let { label, onconfirm, iconOnly = false, class: className = "" }: { label: string; onconfirm: () => void; iconOnly?: boolean; class?: string } = $props();
  let armed = $state(false);

  $effect(() => {
    if (!armed) return;
    const timer = setTimeout(() => (armed = false), ARMED_MS);
    return () => clearTimeout(timer);
  });

  function click(event: MouseEvent) {
    event.stopPropagation();
    if (!armed) armed = true;
    else {
      armed = false;
      onconfirm();
    }
  }
</script>

<button type="button" class="desk-confirm {className}" class:armed class:icon-only={iconOnly && !armed} aria-label={iconOnly && !armed ? label : undefined} title={iconOnly && !armed ? label : undefined} onclick={click} onblur={() => (armed = false)}>
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html TRASH_PATH}</svg>
  {#if armed}Delete forever?{:else if !iconOnly}{label}{/if}
</button>

<style>
  .desk-confirm {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border: none;
    border-radius: var(--r-sm);
    background: none;
    color: var(--hot);
    font: inherit;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color var(--dur-fast) ease;
  }
  .desk-confirm.icon-only {
    padding: 0;
  }
  .desk-confirm:hover {
    background: color-mix(in srgb, var(--hot) 10%, transparent);
  }
  .desk-confirm.armed,
  .desk-confirm.armed:hover {
    padding: 0 8px;
    background: var(--hot);
    color: var(--surface);
  }
  svg {
    flex-shrink: 0;
  }
</style>

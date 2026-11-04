<script lang="ts">
  import ConfirmButton from "./ConfirmButton.svelte";
  import { RESTORE_PATH, TRASH_PATH } from "./icons";
  import { ago } from "./time";

  /** On something in the trash: since when it has been there, the way back out, and the way out for good. */
  let { since, onrestore, onpurge, days }: { since: number | string; onrestore: () => void; onpurge: () => void; days?: number } = $props();
  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(timer);
  });
</script>

<div class="desk-trash-banner" role="status">
  <p>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html TRASH_PATH}</svg>
    Moved to trash {ago(since, now)}{#if days}<span class="dim"> · deleted for good after {days} days</span>{/if}
  </p>
  <button type="button" onclick={onrestore}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html RESTORE_PATH}</svg>
    Restore
  </button>
  <ConfirmButton label="Delete permanently" class="tall" onconfirm={onpurge} />
</div>

<style>
  .desk-trash-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--hot);
    font-family: var(--font-ui);
    font-size: 14px;
  }
  p {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 6px 0 0;
    font-weight: 500;
    white-space: nowrap;
  }
  .dim {
    font-weight: 400;
    opacity: 0.7;
  }
  button {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px;
    border: none;
    border-radius: var(--r-sm);
    background: none;
    color: inherit;
    font: inherit;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color var(--dur-fast) ease;
  }
  button:hover {
    background: color-mix(in srgb, var(--hot) 10%, transparent);
  }
  .desk-trash-banner :global(.desk-confirm.tall) {
    height: 28px;
    padding: 0 8px;
    font-size: 14px;
  }
  @media (max-width: 639px) {
    p {
      display: none;
    }
  }
</style>

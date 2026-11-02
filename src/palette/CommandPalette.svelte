<script lang="ts">
  import { tick } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { isPaletteShortcut, menuKey } from "../keys";
  import ItemList from "./ItemList.svelte";
  import { filterItems, groupItems, type PaletteItem } from "./items";

  /**
   * The suite's ⌘K: one box that finds anything in the app and runs any command. The app hands it every row it knows
   * (`items`: pages, commands, records) and, for what only a server can find, `search`. Rows marked `quiet` wait until
   * something is typed. Up / Down or Ctrl+J / Ctrl+K move, Enter runs, Escape closes.
   */
  let {
    items,
    search,
    open = $bindable(false),
    placeholder = "Search or run a command…",
    shortcut = true,
    limit = 60,
  }: {
    items: readonly PaletteItem[];
    search?: (query: string, signal: AbortSignal) => Promise<readonly PaletteItem[]>;
    open?: boolean;
    placeholder?: string;
    shortcut?: boolean;
    limit?: number;
  } = $props();

  const SEARCH_DELAY_MS = 150;

  let query = $state("");
  let selected = $state(0);
  let found = $state<readonly PaletteItem[]>([]);
  let searching = $state(false);
  let input = $state<HTMLInputElement>();
  let returnTo: HTMLElement | null = null;

  const shown = $derived.by(() => {
    const typed = query.trim();
    const local = filterItems(typed ? items : items.filter((item) => !item.quiet), typed, limit);
    const keys = new Set(local.map((item) => item.key));
    return groupItems([...local, ...found.filter((item) => !keys.has(item.key))]);
  });

  $effect(() => {
    const typed = query.trim();
    selected = 0;
    found = [];
    if (!open || !search || !typed) return void (searching = false);
    const controller = new AbortController();
    searching = true;
    const timer = setTimeout(() => {
      search(typed, controller.signal).then(
        (result) => {
          if (!controller.signal.aborted) {
            found = filterItems(result, typed);
            searching = false;
          }
        },
        () => {
          if (!controller.signal.aborted) searching = false;
        },
      );
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });

  $effect(() => {
    if (!open) return;
    query = "";
    returnTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    void tick().then(() => input?.focus());
  });

  function close() {
    open = false;
    if (returnTo?.isConnected) returnTo.focus();
    returnTo = null;
  }

  function run(item: PaletteItem | undefined) {
    if (!item) return;
    close();
    item.run();
  }

  function onwindowkey(event: KeyboardEvent) {
    if (!shortcut || !isPaletteShortcut(event)) return;
    event.preventDefault();
    if (open) close();
    else open = true;
  }

  function onkey(event: KeyboardEvent) {
    const key = menuKey(event);
    if (key === "ArrowDown") selected = Math.min(shown.length - 1, selected + 1);
    else if (key === "ArrowUp") selected = Math.max(0, selected - 1);
    else if (key === "Enter") run(shown[selected]);
    else if (key === "Escape") close();
    else return;
    event.preventDefault();
  }
</script>

<svelte:window onkeydown={onwindowkey} />

{#if open}
  <div class="desk-palette-backdrop" role="presentation" transition:fade={{ duration: 100 }} onmousedown={(event) => event.target === event.currentTarget && close()}>
    <div class="dialog" role="dialog" aria-modal="true" aria-label="Search" transition:scale={{ start: 0.97, duration: 120 }}>
      <label class="search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input bind:this={input} bind:value={query} onkeydown={onkey} {placeholder} aria-label="Search" autocomplete="off" spellcheck="false" />
      </label>
      <div class="results">
        <ItemList items={shown} bind:selected onpick={run} loading={searching && !shown.length} empty={query.trim() ? `Nothing matches “${query.trim()}”.` : "Nothing here yet."} />
      </div>
    </div>
  </div>
{/if}

<style>
  .desk-palette-backdrop {
    position: fixed;
    inset: 0;
    z-index: 110;
    padding: 0 16px;
    background: var(--backdrop);
  }

  .dialog {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 680px;
    max-height: 70dvh;
    margin: 10dvh auto 0;
    overflow: hidden;
    border-radius: var(--r-lg);
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--float-shadow);
    font-family: var(--font-ui);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 20px;
    color: var(--ink-45);
  }

  svg {
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  input {
    height: 56px;
    min-width: 0;
    flex: 1;
    border: none;
    outline: none;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 17px;
  }

  input::placeholder {
    color: var(--ink-30);
  }

  .results {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    padding: 0 8px 8px;
    border-top: 1px solid var(--line);
  }
</style>

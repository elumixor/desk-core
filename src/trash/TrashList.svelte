<script lang="ts" generics="T extends TrashItem">
  import type { Snippet } from "svelte";
  import { menuKey } from "../keys";
  import ConfirmButton from "./ConfirmButton.svelte";
  import { RESTORE_PATH } from "./icons";
  import type { TrashItem } from "./types";

  /**
   * A desk app's trash, as a popup's body: a search over what was deleted, each row opening it, restoring it, or
   * deleting it for good on a second click. The app owns the data; `lead` draws a row's icon. Up / Down move, Enter opens.
   */
  let {
    items,
    onopen,
    onrestore,
    onpurge,
    lead,
    href,
    empty = "Nothing deleted.",
    placeholder = "Search trash…",
  }: {
    items: readonly T[] | null;
    onopen: (item: T) => void;
    onrestore: (item: T) => void;
    onpurge: (item: T) => void;
    lead?: Snippet<[T]>;
    href?: (item: T) => string;
    empty?: string;
    placeholder?: string;
  } = $props();

  let query = $state("");
  let active = $state(0);
  const shown = $derived(items?.filter((item) => (item.title || "Untitled").toLowerCase().includes(query.trim().toLowerCase())) ?? null);

  function focus(node: HTMLInputElement) {
    node.focus();
  }

  function onkey(event: KeyboardEvent) {
    const key = menuKey(event);
    const n = shown?.length ?? 0;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (n) active = (active + (key === "ArrowDown" ? 1 : -1) + n) % n;
    } else if (key === "Enter") {
      event.preventDefault();
      const item = shown?.[active];
      if (item) onopen(item);
    }
  }
</script>

<div class="desk-trash">
  <input {@attach focus} bind:value={query} oninput={() => (active = 0)} onkeydown={onkey} {placeholder} aria-label="Search trash" autocomplete="off" spellcheck="false" />
  {#if shown === null}
    <p class="note">Loading…</p>
  {:else if !shown.length}
    <p class="note">{items?.length ? "No match." : empty}</p>
  {:else}
    <div class="list" role="listbox" aria-label="Trash">
      {#each shown as item, index (item.id)}
        <div class="row" role="option" tabindex="-1" aria-selected={index === active} class:active={index === active} onmouseenter={() => (active = index)}>
          {#if lead}<span class="lead">{@render lead(item)}</span>{/if}
          <a class="title" href={href?.(item) ?? "#"} onclick={(e) => { e.preventDefault(); onopen(item); }}>{item.title || "Untitled"}</a>
          <button type="button" class="restore" aria-label="Restore" title="Restore" onclick={() => onrestore(item)}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html RESTORE_PATH}</svg>
          </button>
          <ConfirmButton label="Delete permanently" iconOnly onconfirm={() => onpurge(item)} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .desk-trash {
    font-family: var(--font-ui);
    color: var(--ink);
    font-size: 13px;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    height: 32px;
    margin-bottom: 4px;
    padding: 0 8px;
    border: none;
    border-radius: var(--r-sm);
    background: var(--ink-5);
    color: inherit;
    font: inherit;
    outline: none;
  }
  .note {
    margin: 0;
    padding: 4px 8px;
    color: var(--ink-30);
  }
  .list {
    max-height: 360px;
    overflow-y: auto;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px;
    border-radius: var(--r-sm);
  }
  .row.active {
    background: var(--ink-5);
  }
  .lead {
    display: grid;
    place-items: center;
    width: 16px;
    flex-shrink: 0;
    color: var(--ink-45);
  }
  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .restore {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-left: auto;
    padding: 0;
    border: none;
    border-radius: var(--r-xs);
    background: none;
    color: var(--ink-45);
    cursor: pointer;
  }
  .restore:hover {
    background: var(--ink-10);
    color: var(--ink);
  }
</style>

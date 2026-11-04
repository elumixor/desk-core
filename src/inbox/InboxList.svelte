<script lang="ts" generics="T extends InboxItem">
  import type { Snippet } from "svelte";
  import type { InboxFilter, InboxGroup, InboxItem } from "./types";

  /**
   * A desk app's inbox: rows under their headings, the unread ones bold with a dot, "Mark all read" while any are,
   * and optional filters. The app owns the data and what opening a row does; `lead` draws a row's avatar or icon,
   * `heading` a group's icon, and `aside` something at a row's end (a link out).
   */
  let {
    groups,
    unread,
    onopen,
    onreadall,
    title = "Inbox",
    empty = "Nothing yet.",
    filters = [],
    filter = $bindable(""),
    lead,
    heading,
    aside,
  }: {
    groups: readonly InboxGroup<T>[];
    unread: number;
    onopen: (item: T) => void;
    onreadall?: () => void;
    title?: string;
    empty?: string;
    filters?: readonly InboxFilter[];
    filter?: string;
    lead?: Snippet<[T]>;
    heading?: Snippet<[InboxGroup<T>]>;
    aside?: Snippet<[T]>;
  } = $props();
</script>

<div class="desk-inbox">
  <div class="bar">
    <span class="name">{title}</span>
    {#if filters.length}
      <span class="filters" role="tablist" aria-label="Show">
        {#each filters as f (f.value)}
          <button type="button" role="tab" aria-selected={filter === f.value} class:on={filter === f.value} onclick={() => (filter = f.value)}>{f.label}</button>
        {/each}
      </span>
    {/if}
    {#if unread && onreadall}
      <button type="button" class="read-all" onclick={onreadall}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>
        Mark all read
      </button>
    {/if}
  </div>
  <div class="list">
    {#each groups as group (group.key)}
      <section>
        {#if group.title}
          <h3>
            {#if heading}{@render heading(group)}{/if}
            <span class="text">{group.title}</span>
          </h3>
        {/if}
        {#each group.items as item (item.id)}
          <div class="row" class:quiet={item.quiet}>
            <button type="button" class="open" onclick={() => onopen(item)}>
              {#if lead}<span class="lead">{@render lead(item)}</span>{/if}
              <span class="body">
                <span class="title" class:unread={item.unread}>
                  <span class="text">{item.title}</span>
                  {#if item.unread}<span class="dot" aria-label="Unread"></span>{/if}
                </span>
                {#if item.text}<span class="said">{item.text}</span>{/if}
                {#if item.meta}<span class="meta">{item.meta}</span>{/if}
              </span>
            </button>
            {#if aside}<span class="aside">{@render aside(item)}</span>{/if}
          </div>
        {/each}
      </section>
    {:else}
      <p class="empty">{empty}</p>
    {/each}
  </div>
</div>

<style>
  .desk-inbox {
    font-family: var(--font-ui);
    color: var(--ink);
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px;
  }

  .name {
    flex: 1;
    color: var(--ink-45);
    font-size: 12px;
    font-weight: 500;
  }

  .filters {
    display: flex;
    gap: 2px;
  }

  .filters button,
  .read-all {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border: none;
    border-radius: var(--r-xs);
    background: none;
    color: var(--ink-45);
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  .filters button:hover,
  .read-all:hover {
    background: var(--ink-10);
    color: var(--ink);
  }

  .filters button.on {
    background: var(--ink-10);
    color: var(--ink);
  }

  .list {
    max-height: 60vh;
    overflow-y: auto;
  }

  section + section {
    margin-top: 4px;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    margin: 0;
    padding: 0 8px;
    color: var(--ink-45);
    font-size: 12px;
    font-weight: 500;
  }

  .text {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row {
    display: flex;
    align-items: flex-start;
    border-radius: var(--r-sm);
  }

  .row:hover {
    background: var(--ink-5);
  }

  .row.quiet {
    opacity: 0.6;
  }

  .open {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 8px;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .lead {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    color: var(--ink-45);
  }

  .body {
    min-width: 0;
    flex: 1;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-70);
    font-size: 13px;
  }

  .title.unread {
    color: var(--ink);
    font-weight: 500;
  }

  .dot {
    width: 6px;
    height: 6px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--accent);
  }

  .said,
  .meta {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .said {
    color: var(--ink-45);
    font-size: 12px;
  }

  .meta {
    color: var(--ink-30);
    font-size: 11px;
  }

  .aside {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    padding: 6px 8px 0 0;
  }

  .empty {
    margin: 0;
    padding: 4px 8px;
    color: var(--ink-30);
    font-size: 13px;
  }
</style>

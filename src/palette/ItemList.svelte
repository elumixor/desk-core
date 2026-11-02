<script lang="ts" generics="T extends ListItem">
  import type { Component } from "svelte";
  import Highlighted from "./Highlighted.svelte";
  import type { ListItem } from "./items";

  /**
   * The rows of a desk list under their group headings, one lit: the ⌘K palette and the `@` menu draw the same way.
   * Keys stay with the owner (an input keeps focus); `selected` is the lit row, which scrolls into view as it moves.
   */
  let {
    items,
    selected = $bindable(0),
    onpick,
    empty = "Nothing matches.",
    loading = false,
    dense = false,
  }: {
    items: readonly T[];
    selected?: number;
    onpick: (item: T) => void;
    empty?: string;
    loading?: boolean;
    dense?: boolean;
  } = $props();

  let list = $state<HTMLUListElement>();
  const iconOf = (item: T) => (typeof item.icon === "string" ? null : (item.icon as Component<{ size?: number; class?: string }> | undefined));

  $effect(() => {
    void selected;
    list?.querySelector<HTMLElement>("[aria-selected=true]")?.scrollIntoView({ block: "nearest" });
  });
</script>

<ul bind:this={list} class="desk-list" class:dense role="listbox">
  {#each items as item, index (item.key)}
    {#if item.group && item.group !== items[index - 1]?.group}
      <li class="group" role="presentation">{item.group}</li>
    {/if}
    {@const Icon = iconOf(item)}
    <li role="option" aria-selected={index === selected}>
      <button
        type="button"
        class="row"
        class:lit={index === selected}
        tabindex="-1"
        onmouseenter={() => (selected = index)}
        onmousedown={(event) => event.preventDefault()}
        onclick={() => onpick(item)}
      >
        <span class="icon" style:color={item.tint}>
          {#if typeof item.icon === "string"}<img src={item.icon} alt="" />{:else if Icon}<Icon size={dense ? 15 : 17} />{/if}
        </span>
        <span class="label"><Highlighted text={item.label} matches={item.matches} /></span>
        {#if item.hint}<span class="hint">{item.hint}</span>{/if}
      </button>
    </li>
  {:else}
    {#if !loading}<li class="empty" role="presentation">{empty}</li>{/if}
  {/each}
  {#if loading}
    <li class="loading" role="presentation"><span class="spinner"></span>Searching…</li>
  {/if}
</ul>

<style>
  .desk-list {
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--font-ui);
  }

  .group {
    padding: 12px 12px 4px;
    color: var(--ink-45);
    font-size: 12px;
    font-weight: 500;
  }

  .dense .group {
    padding: 8px 8px 2px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: none;
    border-radius: var(--r-sm);
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--ui);
    text-align: left;
    cursor: pointer;
  }

  .dense .row {
    gap: 8px;
    height: 32px;
    padding: 0 8px;
  }

  .row.lit {
    background: var(--ink-5);
  }

  .icon {
    display: grid;
    width: 20px;
    flex-shrink: 0;
    place-items: center;
    color: var(--ink-45);
  }

  .icon img {
    width: 18px;
    height: 18px;
    border-radius: var(--r-xs);
    object-fit: contain;
  }

  .label {
    min-width: 0;
    overflow: hidden;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dense .label {
    font-weight: 400;
  }

  .hint {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    color: var(--ink-30);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hint::before {
    content: "— ";
  }

  .empty,
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 12px;
    color: var(--ink-30);
  }

  .dense .empty,
  .dense .loading {
    justify-content: flex-start;
    padding: 6px 8px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--line);
    border-top-color: var(--ink-45);
    border-radius: 50%;
    animation: desk-spin 0.8s linear infinite;
  }

  @keyframes desk-spin {
    to {
      rotate: 360deg;
    }
  }
</style>

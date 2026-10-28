<script lang="ts" generics="S extends SettingsSection">
  import { type Component, type Snippet, tick } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { isSettingsShortcut, matchSections, type SettingsSection } from "./sections";

  /**
   * An app's settings as one dialog: a rail of sections down the left with a search box over it, and every section
   * in one scroll on the right, the way an editor's settings work. The rail lights the section in view; a click
   * scrolls to one; typing narrows the rail to the sections that mention the word and scrolls to the first of them.
   *
   * ⌘⇧, opens and closes it from anywhere (`shortcut={false}` leaves the key to the app), Escape closes it. The app
   * renders each section through `section`; the dialog only lays them out, so it looks the same in every desk app.
   */
  let {
    sections,
    section,
    open = $bindable(false),
    active = $bindable(sections[0]?.id),
    title = "Settings",
    shortcut = true,
    onclose,
  }: {
    sections: readonly S[];
    section: Snippet<[S]>;
    open?: boolean;
    active?: S["id"];
    title?: string;
    shortcut?: boolean;
    onclose?: () => void;
  } = $props();

  /** How far below the top of the scroll a section has to reach to count as the one in view. */
  const IN_VIEW_PX = 48;

  let scroller = $state<HTMLDivElement | null>(null);
  let input = $state<HTMLInputElement | null>(null);
  let query = $state("");
  const matches = $derived(matchSections(sections, query));

  const iconOf = (entry: S) => entry.icon as Component<{ size?: number; class?: string }> | undefined;
  const sectionEl = (id: string) => scroller?.querySelector<HTMLElement>(`[data-section="${CSS.escape(id)}"]`) ?? null;

  function close() {
    open = false;
    onclose?.();
  }

  function scrollTo(id: S["id"], smooth = true) {
    active = id;
    sectionEl(id)?.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "instant" });
  }

  /** The section the top of the scroll is in, or the last one once the bottom is reached. */
  function onscroll() {
    if (!scroller) return;
    const last = sections.at(-1);
    if (last && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1) return void (active = last.id);
    const top = scroller.scrollTop + IN_VIEW_PX;
    let current = sections[0]?.id;
    for (const entry of sections) {
      const el = sectionEl(entry.id);
      if (el && el.offsetTop <= top) current = entry.id;
    }
    if (current !== undefined) active = current;
  }

  function onkeydown(event: KeyboardEvent) {
    if (shortcut && isSettingsShortcut(event)) {
      event.preventDefault();
      if (open) close();
      else open = true;
    } else if (open && event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  /** Up and down walk the sections that match, Enter goes to the one lit. */
  function onsearchkey(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    event.preventDefault();
    if (!matches.length) return;
    const index = matches.findIndex((entry) => entry.id === active);
    const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    const next = matches[(Math.max(index, 0) + step + matches.length) % matches.length];
    if (next) scrollTo(next.id);
  }

  // Opened onto a section, the scroll starts there with the search box focused: ⌘⇧, then a word is the whole way.
  $effect(() => {
    if (!open) return;
    query = "";
    void tick().then(() => {
      if (active !== undefined) scrollTo(active, false);
      input?.focus();
    });
  });

  // The first section that matches is where a typed word leads, as it is typed.
  $effect(() => {
    const first = matches[0];
    if (query.trim() && first && !matches.some((entry) => entry.id === active)) scrollTo(first.id);
  });
</script>

<svelte:window {onkeydown} />

{#if open}
  <div
    class="desk-settings-backdrop"
    role="presentation"
    transition:fade={{ duration: 120 }}
    onmousedown={(event) => event.target === event.currentTarget && close()}
  >
    <div class="dialog" role="dialog" aria-modal="true" aria-label={title} transition:scale={{ start: 0.97, duration: 140 }}>
      <nav class="rail" aria-label={title}>
        <div class="search">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input bind:this={input} bind:value={query} onkeydown={onsearchkey} placeholder="Find a setting" aria-label="Find a setting" />
        </div>
        <div class="list">
          {#each matches as entry (entry.id)}
            {@const Icon = iconOf(entry)}
            <button type="button" class="item" class:current={active === entry.id} aria-current={active === entry.id ? "location" : undefined} onclick={() => scrollTo(entry.id)}>
              {#if Icon}<Icon size={16} class="desk-settings-icon" />{/if}
              <span>{entry.label}</span>
            </button>
          {:else}
            <p class="empty">Nothing matches.</p>
          {/each}
        </div>
      </nav>

      <div class="body">
        <header>
          <h2>{title}</h2>
          <button type="button" class="close" aria-label="Close" onclick={close}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>
        <div class="scroll" bind:this={scroller} {onscroll}>
          {#each sections as entry (entry.id)}
            <section data-section={entry.id}>{@render section(entry)}</section>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .desk-settings-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    padding: 16px;
    background: var(--backdrop);
  }

  .dialog {
    display: flex;
    width: min(880px, 100%);
    height: min(680px, 82dvh);
    overflow: hidden;
    border-radius: var(--r-lg);
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--float-shadow);
    font-family: var(--font-ui);
    font-size: var(--ui);
    line-height: var(--ui-lh);
  }

  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .rail {
    display: flex;
    width: 13rem;
    flex-shrink: 0;
    flex-direction: column;
    gap: 8px;
    padding: 12px 8px;
    border-right: 1px solid var(--line);
    background: var(--surface-2);
  }

  .search {
    position: relative;
    color: var(--ink-30);
  }

  .search svg {
    position: absolute;
    top: 50%;
    left: 10px;
    translate: 0 -50%;
    pointer-events: none;
  }

  .search input {
    width: 100%;
    height: 32px;
    padding: 0 10px 0 30px;
    border: none;
    border-radius: var(--r-sm);
    outline: none;
    background: var(--ink-5);
    color: var(--ink);
    font: inherit;
  }

  .search input::placeholder {
    color: var(--ink-30);
  }

  .search input:focus {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent);
  }

  .list {
    display: flex;
    min-height: 0;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    border-radius: var(--r-sm);
    background: none;
    color: var(--ink-70);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--dur-fast) var(--ease);
  }

  .item span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item:hover {
    background: var(--ink-5);
  }

  .item.current {
    background: var(--ink-10);
    color: var(--ink);
    font-weight: 500;
  }

  .item :global(.desk-settings-icon) {
    flex-shrink: 0;
    color: var(--ink-45);
  }

  .item.current :global(.desk-settings-icon) {
    color: var(--ink);
  }

  .empty {
    margin: 0;
    padding: 6px 8px;
    color: var(--ink-30);
    font-size: var(--meta);
  }

  .body {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }

  header {
    display: flex;
    align-items: center;
    padding: 18px 16px 6px 28px;
  }

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .close {
    display: grid;
    width: 28px;
    height: 28px;
    margin-left: auto;
    place-items: center;
    border: none;
    border-radius: var(--r-sm);
    background: none;
    color: var(--ink-45);
    cursor: pointer;
  }

  .close:hover {
    background: var(--ink-5);
    color: var(--ink);
  }

  .scroll {
    min-height: 0;
    flex: 1;
    overflow-y: auto;
    padding: 12px 28px 28px;
  }

  section {
    scroll-margin-top: 12px;
  }

  section + section {
    margin-top: 40px;
  }

  /* No room for a column beside the content on a phone: the rail becomes a strip along the top. */
  @media (max-width: 767px) {
    .desk-settings-backdrop {
      padding: 8px;
    }

    .dialog {
      height: 90dvh;
      flex-direction: column;
    }

    .rail {
      width: auto;
      flex-direction: row;
      border-right: none;
      border-bottom: 1px solid var(--line);
    }

    .search {
      flex: 0 0 9rem;
    }

    .list {
      flex-direction: row;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .item {
      width: auto;
      flex-shrink: 0;
    }

    header {
      padding: 14px 12px 4px 20px;
    }

    .scroll {
      padding: 8px 20px 20px;
    }
  }
</style>

<script lang="ts">
  import { tick } from "svelte";
  import Icon from "../chat/Icon.svelte";
  import type { IconName } from "../chat/icons";
  import { menuKey } from "../keys";
  import { EMOJI_GROUPS, type EmojiEntry, emojiTerms, loadEmoji, search, TONE_SAMPLES, toned } from "./emoji";
  import { emojiTone, recentEmoji, rememberEmoji, setEmojiTone } from "./used";

  /**
   * The suite's emoji picker: the ones used lately, then every emoji by category (the bar at its foot jumps between
   * them), or the matches for what is typed in its search (shortcode, name, tag), in the skin tone picked. Up / Down
   * move through the matches and Enter picks; Escape is `onclose`. `onpick` gets the emoji, which also goes first among
   * the recent ones. It fills its host's width (`--emoji-picker-height` sets its height); the host draws the surface.
   */
  let { onpick, onclose }: { onpick: (emoji: string) => void; onclose?: () => void } = $props();

  type SectionKey = "recent" | (typeof EMOJI_GROUPS)[number]["key"];
  const SECTION_ICONS: Record<SectionKey, IconName> = {
    recent: "clock",
    people: "smile",
    nature: "paw",
    food: "apple",
    activities: "trophy",
    travel: "car",
    objects: "lightbulb",
    symbols: "heart",
    flags: "flag",
  };
  const RESULTS = 200;
  // A phone's keyboard would cover the picker it just opened: there the search is focused only when pressed.
  const TOUCH = matchMedia("(pointer: coarse)").matches;

  let query = $state("");
  let entries = $state.raw<readonly EmojiEntry[]>([]);
  let failed = $state(false);
  let tone = $state(emojiTone());
  let toneOpen = $state(false);
  /** The match the keys are on. */
  let selected = $state(0);
  let scrolledTo = $state<SectionKey | null>(null);
  let body = $state<HTMLDivElement>();
  let grid = $state<HTMLDivElement>();
  let field = $state<HTMLInputElement>();
  const recent = recentEmoji();

  const q = $derived(query.trim().toLowerCase());
  const byGroup = $derived(new Map(EMOJI_GROUPS.map((g) => [g.key, entries.filter((e) => e.group === g.key)])));
  const found = $derived(q ? search(entries, q, emojiTerms, RESULTS) : []);
  const sections = $derived<SectionKey[]>([...(recent.length ? (["recent"] as const) : []), ...EMOJI_GROUPS.map((g) => g.key)]);
  const active = $derived(scrolledTo ?? sections[0]);

  loadEmoji().then(
    (list) => (entries = list),
    (error) => {
      console.warn("[emoji] could not load", error);
      failed = true;
    },
  );

  $effect(() => {
    if (!TOUCH) field?.focus();
  });

  $effect(() => {
    void q;
    selected = 0;
    body?.scrollTo({ top: 0 });
  });

  function pick(emoji: string) {
    rememberEmoji(emoji);
    onpick(emoji);
  }

  function chooseTone(next: number) {
    tone = next;
    setEmojiTone(next);
    toneOpen = false;
  }

  /** Escape anywhere in the picker shuts the tone menu, else the picker. */
  function keydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    if (toneOpen) toneOpen = false;
    else onclose?.();
  }

  /** In the search, Up / Down move a row through the matches, Ctrl+J / Ctrl+K too, and Enter picks the one lit. */
  function searchkey(event: KeyboardEvent) {
    if (!found.length) return;
    if (event.key === "Enter") {
      event.preventDefault();
      const entry = found[selected] ?? found[0];
      if (entry) pick(toned(entry, tone));
      return;
    }
    const key = menuKey(event);
    if (key !== "ArrowDown" && key !== "ArrowUp") return;
    event.preventDefault();
    const across = grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").length : 1;
    selected = Math.max(0, Math.min(found.length - 1, selected + (key === "ArrowDown" ? across : -across)));
    void tick().then(() => grid?.querySelector("[aria-selected=true]")?.scrollIntoView({ block: "nearest" }));
  }

  function jumpTo(key: SectionKey) {
    body?.querySelector(`[data-section="${key}"]`)?.scrollIntoView({ block: "start" });
  }

  /** The category bar marks the section scrolled to. */
  function onscroll() {
    if (!body || q) return;
    const top = body.scrollTop + 8;
    let current = sections[0] ?? "people";
    for (const section of body.querySelectorAll<HTMLElement>("[data-section]"))
      if (section.offsetTop <= top) current = section.dataset.section as SectionKey;
    scrolledTo = current;
  }

  const label = (key: SectionKey) => (key === "recent" ? "Recent" : (EMOJI_GROUPS.find((g) => g.key === key)?.label ?? ""));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="emoji-picker" onkeydown={keydown}>
  <div class="top">
    <input class="search" type="search" placeholder="Search emoji" aria-label="Search emoji" autocomplete="off" bind:this={field} bind:value={query} onkeydown={searchkey} />
    <div class="tone">
      <button type="button" class="cell small" title="Skin tone" aria-label="Skin tone" aria-expanded={toneOpen} onclick={() => (toneOpen = !toneOpen)}>{TONE_SAMPLES[tone]}</button>
      {#if toneOpen}
        <div class="tone-menu">
          {#each TONE_SAMPLES as sample, index (index)}
            <button type="button" class="cell small" class:lit={index === tone} aria-label={index ? `Tone ${index}` : "Default tone"} onclick={() => chooseTone(index)}>{sample}</button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div class="body" bind:this={body} {onscroll}>
    {#if failed}
      <p class="quiet">Couldn't load emoji</p>
    {:else if q}
      {#if found.length}
        <div class="grid" role="listbox" aria-label="Emoji" bind:this={grid}>
          {#each found as entry, index (entry.emoji)}
            <button type="button" role="option" class="cell" class:lit={index === selected} aria-selected={index === selected} title={entry.label} aria-label={entry.label} onmouseenter={() => (selected = index)} onclick={() => pick(toned(entry, tone))}>{toned(entry, tone)}</button>
          {/each}
        </div>
      {:else if entries.length}
        <p class="quiet">No emoji match</p>
      {/if}
    {:else}
      {#each sections as key (key)}
        <section data-section={key}>
          <p class="heading">{label(key)}</p>
          <div class="grid">
            {#if key === "recent"}
              {#each recent as emoji (emoji)}
                <button type="button" class="cell" aria-label={emoji} onclick={() => pick(emoji)}>{emoji}</button>
              {/each}
            {:else}
              {#each byGroup.get(key) ?? [] as entry (entry.emoji)}
                <button type="button" class="cell" title={entry.label} aria-label={entry.label} onclick={() => pick(toned(entry, tone))}>{toned(entry, tone)}</button>
              {/each}
            {/if}
          </div>
        </section>
      {/each}
    {/if}
  </div>

  {#if !q && !failed}
    <nav class="bar" aria-label="Categories">
      {#each sections as key (key)}
        <button type="button" class:on={active === key} title={label(key)} aria-label={label(key)} onclick={() => jumpTo(key)}><Icon name={SECTION_ICONS[key]} size={15} /></button>
      {/each}
    </nav>
  {/if}
</div>

<style>
  .emoji-picker {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: var(--emoji-picker-height, min(22rem, calc(100dvh - 8rem)));
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: var(--ui);
  }

  .top {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 4px 6px;
  }

  .search {
    flex: 1;
    min-width: 0;
    height: 32px;
    padding: 0 10px;
    border: 0;
    border-radius: var(--r-sm);
    background: var(--ink-5);
    color: var(--ink);
    font: inherit;
    outline: none;
    appearance: none;
  }

  .search::placeholder {
    color: var(--ink-30);
  }

  .search::-webkit-search-cancel-button {
    display: none;
  }

  .tone {
    position: relative;
  }

  .tone-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 2;
    display: flex;
    margin-top: 4px;
    padding: 4px;
    border-radius: var(--r);
    background: var(--surface);
    box-shadow: var(--float-shadow);
  }

  /* Positioned, so a section's offsetTop is measured from the top of the scroll. */
  .body {
    position: relative;
    flex: 1;
    min-height: 0;
    padding: 0 4px 4px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  section {
    content-visibility: auto;
    contain-intrinsic-size: auto 12rem;
  }

  .heading {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0;
    padding: 6px 4px 4px;
    background: var(--surface);
    color: var(--ink-45);
    font-size: 12px;
    font-weight: 500;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 36px);
    justify-content: space-between;
  }

  .cell {
    display: grid;
    width: 36px;
    height: 36px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: inherit;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: background-color var(--dur-fast) var(--ease);
  }

  .cell.small {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }

  .cell.lit,
  .cell:focus-visible {
    background: var(--ink-5);
    outline: none;
  }

  .quiet {
    margin: 0;
    padding: 24px 4px;
    color: var(--ink-30);
    text-align: center;
  }

  .bar {
    display: flex;
    justify-content: space-between;
    padding: 4px 4px 0;
    border-top: 1px solid var(--ink-10);
  }

  .bar button {
    display: grid;
    width: 28px;
    height: 28px;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--ink-30);
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease);
  }

  .bar button.on {
    color: var(--ink);
  }

  @media (hover: hover) {
    .cell:hover,
    .bar button:hover {
      background: var(--ink-5);
    }
  }
</style>

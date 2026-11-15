<script lang="ts">
  import type { Component } from "svelte";
  import { lookupPill, type PillLook, pillKind } from "./kinds";
  import { statusInk, statusShape } from "./status";

  /**
   * A record named in text, as every desk app draws it: a round wash of the text colour, the record's mark (with the
   * link arrow when it lives in another app), its title clipped to fit, muted meta, and its status circle. Everything
   * it knows comes from the kind registered for `urn` (`registerPillKind`), so a new kind needs no change here.
   *
   * `label` is the title it wears, whatever the record answers (a link's own text: `[Title](link)`); `text` instead keeps the reference as
   * that plain text until it is found, and for good if it is not; `look` skips the lookup.
   */
  let {
    urn,
    label,
    text,
    look: given,
    class: klass = "",
  }: { urn: string; label?: string; text?: string; look?: PillLook; class?: string } = $props();

  const kind = $derived(pillKind(urn));
  const asked = $derived(given ? given : lookupPill(urn));
  let answered = $state<{ for: Promise<PillLook | null>; look: PillLook | null }>();
  $effect(() => {
    const pending = asked;
    if (!(pending instanceof Promise)) return;
    let live = true;
    void pending.then((look) => live && (answered = { for: pending, look }));
    return () => void (live = false);
  });
  /** `undefined` while asking, `null` when not found. */
  const look = $derived(asked instanceof Promise ? (answered?.for === asked ? answered.look : undefined) : (asked ?? null));
  /** Blank bars while asking; the text then grows and fades in, once this pill has waited for it. */
  const blank = $derived(look === undefined && !label);
  let waited = $state(false);
  $effect(() => {
    if (blank) waited = true;
  });
  const plain = $derived(text !== undefined && !look);
  const shown = $derived(look ?? { title: label || urn });
  const href = $derived(look ? (look.href ?? kind?.href?.(urn, look)) : undefined);
  const external = $derived(shown.external ?? kind?.external ?? false);
  const title = $derived(label || shown.title || "Untitled");
  const icon = $derived(shown.icon ?? kind?.icon);
  const color = $derived(shown.color ?? kind?.tint);
  const hint = $derived(look === null ? `Not found: ${urn}` : (shown.hint ?? [title, shown.meta].filter(Boolean).join(" · ")));
  const status = $derived(shown.status && { shape: statusShape(shown.status.name), ink: statusInk(shown.status.color), name: shown.status.name });
  const attachment = $derived((look && kind?.attach?.(urn, look)) || undefined);
  const image = (value: string) => /^(https?:|data:|\/|\.)/.test(value);

  function press(event: MouseEvent) {
    event.stopPropagation();
    if (!look || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (kind?.open) {
      event.preventDefault();
      kind.open(urn, look, event);
    } else if (href) {
      event.preventDefault();
      if (external) window.open(href, "_blank", "noopener");
      else window.location.assign(href);
    }
  }
</script>

{#if plain}{text}{:else}
  <svelte:element
    this={href ? "a" : "span"}
    class="desk-pill {klass}"
    class:pending={look === undefined && !blank}
    class:arrived={waited && !blank}
    class:missing={look === null}
    class:done={shown.done}
    href={href}
    target={href && external ? "_blank" : undefined}
    rel={href && external ? "noopener" : undefined}
    title={blank ? undefined : hint}
    data-urn={urn}
    data-kind={kind?.name}
    role={href ? undefined : "presentation"}
    onclick={press}
    {@attach attachment}
  >
    {#if icon || color || external}
      <span class="mark" style:color={color}>
        {#if typeof icon === "string"}
          {#if image(icon)}<img src={icon} alt="" />{:else}<span class="emoji">{icon}</span>{/if}
        {:else if icon}
          {@const Icon = icon as Component<{ size?: number | string }>}
          <Icon size="1.1em" />
        {:else if color}<span class="dot"></span>
        {/if}
        {#if external}
          <span class="arrow" aria-hidden="true">
            <svg class="halo" viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10" /></svg>
            <svg viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10" /></svg>
          </span>
        {/if}
      </span>
    {/if}
    {#if blank}
      <span class="skeleton title-skeleton"></span>
      {#if kind?.pendingMeta}<span class="skeleton meta-skeleton"></span>{/if}
    {:else}
      <span class="title"><span class="text">{title}</span></span>
    {/if}
    {#if blank}{:else if shown.meta && "metaIcon" in shown && shown.metaIcon}
      {@const MetaIcon = shown.metaIcon as Component<{ size?: number | string }>}
      <span class="meta-pill"><MetaIcon size={11} />{shown.meta}</span>
    {:else if shown.meta}<span class="meta">{shown.meta}</span>{/if}
    {#if status}
      <svg class="status" viewBox="0 0 16 16" style:color={status.ink} role="img" aria-label={status.name}>
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5" />
        {#if status.shape === "done"}<circle cx="8" cy="8" r="3.5" fill="currentColor" />
        {:else if status.shape === "doing"}<path d="M8 4.5a3.5 3.5 0 0 1 0 7z" fill="currentColor" />
        {:else if status.shape === "cancelled"}<path d="M5 11 11 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        {/if}
      </svg>
    {/if}
  </svelte:element>
{/if}

<style>
  .desk-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    box-sizing: border-box;
    min-width: 0;
    max-width: var(--pill-max, 100%);
    padding: 0.05em 0.6em 0.05em 0.45em;
    border-radius: var(--r-pill, 999px);
    background: color-mix(in srgb, currentColor 7%, transparent);
    color: inherit;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    vertical-align: bottom;
    cursor: default;
  }

  a.desk-pill {
    cursor: pointer;
  }

  a.desk-pill:hover {
    background: color-mix(in srgb, currentColor 12%, transparent);
  }

  .pending,
  .missing {
    opacity: 0.6;
  }

  .done {
    opacity: 0.6;
  }

  .done .title {
    text-decoration: line-through;
    text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
  }

  .mark {
    position: relative;
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 1.15em;
    height: 1.15em;
  }

  .mark img {
    width: 1.1em;
    height: 1.1em;
    border-radius: 3px;
    object-fit: contain;
  }

  .emoji {
    font-size: 0.95em;
    line-height: 1;
  }

  .dot {
    width: 0.6em;
    height: 0.6em;
    border-radius: 50%;
    background: currentColor;
  }

  .arrow {
    position: absolute;
    right: -0.2em;
    bottom: -0.15em;
    display: grid;
    width: 0.7em;
    height: 0.7em;
    color: var(--ink, currentColor);
  }

  .arrow svg {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 4;
  }

  .arrow .halo {
    stroke: var(--pill-halo, var(--surface, Canvas));
    stroke-width: 9;
  }

  /* Both give way when the pill is clipped, each by its length, so a long title still shows most of itself. */
  .title {
    flex: 0 1 auto;
    min-width: 2em;
    overflow: hidden;
    text-overflow: clip; animation: clip-fade linear both; animation-timeline: scroll(self inline);
  }

  .skeleton {
    flex: none;
    height: 0.8em;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 10%, transparent);
    animation: skeleton-pulse 1.2s ease-in-out infinite alternate;
  }

  .title-skeleton {
    width: 7em;
  }

  .meta-skeleton {
    width: 2.6em;
    height: 1.1em;
  }

  @keyframes skeleton-pulse {
    to {
      opacity: 0.45;
    }
  }

  /* From the skeleton's width to the text's own, the text fading in as it opens. */
  .arrived .title {
    interpolate-size: allow-keywords;
    animation: clip-fade linear both, pill-grow 0.35s var(--ease, ease-out);
    animation-timeline: scroll(self inline), auto;
  }

  .arrived .meta,
  .arrived .meta-pill {
    interpolate-size: allow-keywords;
    overflow: hidden;
    animation: pill-grow-meta 0.35s var(--ease, ease-out);
  }

  .arrived .text,
  .arrived .meta-pill > :global(*) {
    animation: pill-fade 0.35s ease-out;
  }

  @keyframes pill-grow {
    from {
      width: 7em;
    }
  }

  @keyframes pill-grow-meta {
    from {
      width: 2.6em;
      opacity: 0;
    }
  }

  @keyframes pill-fade {
    from {
      opacity: 0;
    }
  }

  .meta {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: clip; animation: clip-fade linear both; animation-timeline: scroll(self inline);
    font-weight: 400;
    opacity: 0.6;
  }

  .meta-pill {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 3px;
    height: 1.35em;
    padding: 0 0.45em;
    border-radius: 999px;
    background: var(--ink-5);
    color: var(--ink-70);
    font-size: 0.8em;
    font-weight: 500;
    white-space: nowrap;
  }

  .status {
    flex: none;
    width: 0.9em;
    height: 0.9em;
  }
</style>

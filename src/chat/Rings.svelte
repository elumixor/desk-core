<script lang="ts" module>
  import type { MenuRow } from "./host";

  /** What the context ring offers when it is a button: its rows, and what it says it does. */
  export interface RingMenu {
    readonly title: string;
    readonly rows: readonly MenuRow[];
  }
</script>

<script lang="ts">
  import { modelName } from "./format";
  import { chatHost, type UsageWindow } from "./host";
  import Icon from "./Icon.svelte";

  /**
   * The discs in the box's foot, as Claude Code's status line has them: the conversation's context, the session window
   * and the week, each a percent. The time to the reset shows only when it matters: the session past half, the week
   * ahead of its pace and at 10% or more.
   */
  let { model, session, menu }: { model?: string | null; session?: string; menu?: RingMenu } = $props();
  const R = 6.5;
  const C = 2 * Math.PI * R;
  const CONTEXT_EVERY_MS = 20_000;
  const SESSION_TIME_AT = 50;
  const WEEK_TIME_AT = 10;
  const WEEK_MS = 7 * 24 * 3_600_000;

  let context = $state<number | undefined>();
  $effect(() => {
    const id = session;
    context = undefined;
    if (!id) return;
    const read = () => void chatHost().contextUsage(id).then((u) => (context = u.percentage === undefined ? undefined : Math.round(u.percentage)), () => {});
    read();
    const timer = setInterval(read, CONTEXT_EVERY_MS);
    return () => clearInterval(timer);
  });

  /** One unit: 30m, 1.4h, 2.5d. */
  function left(iso?: string) {
    const ms = iso ? new Date(iso).getTime() - Date.now() : 0;
    if (ms <= 0) return "";
    const hours = ms / 3_600_000;
    if (hours >= 24) return `${+(hours / 24).toFixed(1)}d`;
    return hours >= 1 ? `${+hours.toFixed(1)}h` : `${Math.ceil(ms / 60_000)}m`;
  }
  /** Used more of the week than has gone by. */
  function aheadOfPace(w: UsageWindow) {
    const remaining = w.resetsAt ? new Date(w.resetsAt).getTime() - Date.now() : 0;
    return remaining > 0 && remaining <= WEEK_MS && w.percent > ((WEEK_MS - remaining) / WEEK_MS) * 100;
  }
  const level = (percent: number, warm = 70) => (percent >= 90 ? "hot" : percent >= warm ? "warm" : "cool");

  const discs = $derived.by(() => {
    const data = chatHost().usage() ?? { windows: [], error: "the daemon is not reachable" };
    const s = data.windows.find((w) => w.name === "Session");
    const family = model ? modelName(model).split(" ")[0]!.toLowerCase() : "";
    const week = (family && data.windows.find((w) => w.name.toLowerCase().includes(family))) || data.windows.find((w) => w.name === "Weekly");
    const why = `${data.error ?? "no usage reported yet"}${data.needsLogin ? " — reconnect Claude at /claude/login" : ""}`;
    const ahead = week ? aheadOfPace(week) : false;
    return [
      ...(session ? [{ key: "context", percent: context, level: "context", time: "", title: context === undefined ? "Context: not known yet" : `Context: ${context}% full` }] : []),
      { key: "session", percent: s?.percent, level: s ? level(s.percent) : "none", time: s && s.percent > SESSION_TIME_AT ? left(s.resetsAt) : "", title: s ? `${s.name}: ${s.percent}% used · resets in ${left(s.resetsAt)}` : `Session: unavailable — ${why}` },
      { key: "week", percent: week?.percent, level: week ? (ahead && week.percent < 90 ? "warm" : level(week.percent, 101)) : "none", time: ahead && week!.percent >= WEEK_TIME_AT ? left(week!.resetsAt) : "", title: week ? `${week.name}: ${week.percent}% used · resets in ${left(week.resetsAt)}` : `Weekly: unavailable — ${why}` },
    ];
  });
</script>

{#snippet disc(d: (typeof discs)[number])}
  <span class="disc">
    <svg viewBox="0 0 15 15" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r={R} class="track" />
      {#if d.percent !== undefined}<circle cx="7.5" cy="7.5" r={R} class="fill" stroke-dasharray={C} stroke-dashoffset={C * (1 - Math.min(100, d.percent) / 100)} transform="rotate(-90 7.5 7.5)" />{/if}
    </svg>
    <span class="value">{d.percent ?? "–"}</span>
    {#if menu && d.key === "context"}<span class="action"><Icon name="refresh" size={9} /></span>{/if}
  </span>
  {#if d.time}<span>{d.time}</span>{/if}
{/snippet}

<span class="rings">
  {#each discs as d (d.key)}
    {#if menu && d.key === "context"}
      <button type="button" class="ring-mini ring-button {d.level}" title="{d.title} · {menu.title}" aria-label={menu.title} onclick={(e) => chatHost().menu(e.currentTarget, menu.rows)}>{@render disc(d)}</button>
    {:else}
      <span class="ring-mini {d.level}" title={d.title}>{@render disc(d)}</span>
    {/if}
  {/each}
</span>

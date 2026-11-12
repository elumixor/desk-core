import CalendarGlyph from "./CalendarGlyph.svelte";
import type { PillKind, PillLook } from "./kinds";

/** A Balance calendar block, as Balance's MCP `get_event` gives it. */
export interface BalanceBlock {
  readonly id: string;
  readonly title: string;
  readonly start: string;
  readonly end: string;
  readonly allDay: boolean;
  readonly location?: string | null;
  readonly cancelled?: boolean;
  readonly sphere: { readonly id: string; readonly name: string; readonly color: string } | null;
  /** Where Balance shows it, from its origin: `/calendar?event=<id>&at=<start>`. */
  readonly path?: string;
}

export const BALANCE_BLOCK = /^balance:block\/[A-Za-z0-9_-]+$/;
export const balanceBlock = (id: string) => `balance:block/${id}`;
export const BALANCE_URL = "https://balance.desk.atmagaming.com";

const DAY_MS = 86_400_000;

/** "Fri 20 Nov · 11:30–12:15" in the reader's zone; the year when not this one; an all-day block is its days. */
export function blockTime(block: Pick<BalanceBlock, "start" | "end" | "allDay">, now = new Date()) {
  const start = new Date(block.start);
  const end = new Date(block.end);
  const year = start.getFullYear() === now.getFullYear() ? undefined : "numeric";
  const date = (at: Date) =>
    at.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year });
  const time = (at: Date) => at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (block.allDay) {
    const last = new Date(end.getTime() - DAY_MS);
    return last > start ? `${date(start)} – ${date(last)}` : date(start);
  }
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${date(start)} · ${time(start)}–${time(end)}`
    : `${date(start)} ${time(start)} – ${date(end)} ${time(end)}`;
}

/** A block's look: its title, its time, its sphere's colour on the calendar mark; a press opens it in Balance. */
export function blockLook(block: BalanceBlock, origin = BALANCE_URL): PillLook {
  const meta = blockTime(block);
  const base = origin.replace(/\/$/, "");
  return {
    title: block.title || "Untitled",
    meta,
    color: block.sphere?.color,
    href: `${base}${block.path ?? `/calendar?event=${encodeURIComponent(block.id)}`}`,
    hint: [block.title, meta, block.sphere?.name, block.location].filter(Boolean).join("\n"),
    done: block.cancelled,
  };
}

/**
 * The `balance:block/<id>` kind. Balance's API is behind its own sign-in, so each app hands in how it reads one block
 * (its server, with a Balance MCP key).
 */
export const balanceKind = (read: (id: string) => Promise<BalanceBlock | null>, origin = BALANCE_URL): PillKind => ({
  name: "balance:block",
  pattern: BALANCE_BLOCK,
  icon: CalendarGlyph,
  external: true,
  resolve: async (ref) => {
    const block = await read(ref.slice("balance:block/".length));
    return block && blockLook(block, origin);
  },
});

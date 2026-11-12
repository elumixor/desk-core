import type { Attachment } from "svelte/attachments";

/** A Keep status as a pill shows it: one small circle in the option's colour (`STATUS_INK`). */
export interface PillStatus {
  readonly name: string;
  readonly color: string | null;
}

/** What a pill shows of its record right now. Anything left out falls back to the kind's own. */
export interface PillLook {
  readonly title: string;
  /** Muted text after the title: a block's time, a commit's repo. */
  readonly meta?: string;
  /** The mark's colour: tints the icon, or is a dot when there is no icon (a Balance sphere). */
  readonly color?: string;
  readonly status?: PillStatus;
  /** A Svelte component taking `size`, an image URL, or an emoji; overrides the kind's icon. */
  readonly icon?: unknown;
  /** Where a press goes. */
  readonly href?: string;
  /** The tooltip; the title (and meta) when left out. */
  readonly hint?: string;
  /** Finished or cancelled: drawn faded. */
  readonly done?: boolean;
  /** Lives in another app (arrow, new tab), when that differs per record; else the kind's `external`. */
  readonly external?: boolean;
  /** The record itself, for the kind's `open` and `attach`. */
  readonly data?: unknown;
}

export type PillAnswer = PillLook | null | undefined;

/**
 * One kind of record a pill can name. Adding a kind is one `registerPillKind` call: the component reads everything
 * else from here.
 */
export interface PillKind {
  readonly name: string;
  /** Tested against the whole reference: a URN (`balance:block/<id>`), or a short form the app accepts (a bare hash). */
  readonly pattern: RegExp;
  /**
   * The record's look. A sync answer is read reactively (a Svelte store or `$state` stays live); a promise is asked
   * once per reference for `fresh` ms across the page. `null` = not found.
   */
  readonly resolve?: (ref: string) => PillAnswer | Promise<PillAnswer>;
  readonly icon?: unknown;
  /** The mark's colour when the look has none. */
  readonly tint?: string;
  /** The record lives in another app: the link arrow in the mark's corner, and a press opens a new tab. */
  readonly external?: boolean;
  /** Where a press goes when the look has no `href`. */
  readonly href?: (ref: string, look: PillLook) => string | undefined;
  /** What a press does instead of following `href` (an in-app route, revealing a card). */
  readonly open?: (ref: string, look: PillLook, event: MouseEvent) => void;
  /** More behaviour on the pill once resolved: a hover preview, what copying it gives. */
  readonly attach?: (ref: string, look: PillLook) => Attachment<HTMLElement> | undefined;
  /** How long a resolved look is reused, in ms. Default 60 s. */
  readonly fresh?: number;
}

const kinds: PillKind[] = [];

/** Registers a kind; a later registration of the same name replaces it. Returns the unregister. */
export function registerPillKind(kind: PillKind) {
  const at = kinds.findIndex((k) => k.name === kind.name);
  if (at >= 0) kinds.splice(at, 1, kind);
  else kinds.push(kind);
  forgetPills();
  return () => {
    const index = kinds.indexOf(kind);
    if (index >= 0) kinds.splice(index, 1);
  };
}

/** The kind a reference is, the first registered that matches. */
export const pillKind = (ref: string) => kinds.find((kind) => kind.pattern.test(ref));

/** Every registered kind, in order. */
export const pillKinds = (): readonly PillKind[] => kinds;

const FRESH_MS = 60_000;
const cache = new Map<string, { at: number; answer: Promise<PillAnswer>; settled?: { look: PillLook | null } }>();

/**
 * A reference's look: the look itself when known now (a sync resolver, or a fresh cached answer), else a promise of
 * it. `undefined` for a reference no kind claims.
 */
export function lookupPill(ref: string): PillLook | null | undefined | Promise<PillLook | null> {
  const kind = pillKind(ref);
  if (!kind) return undefined;
  if (!kind.resolve) return { title: ref };
  const hit = cache.get(ref);
  if (hit && Date.now() - hit.at < (kind.fresh ?? FRESH_MS)) return hit.settled ? hit.settled.look : settle(hit.answer);
  let answer: PillAnswer | Promise<PillAnswer>;
  try {
    answer = kind.resolve(ref);
  } catch {
    return null;
  }
  if (!(answer instanceof Promise)) return answer ?? null;
  const entry: { at: number; answer: Promise<PillAnswer>; settled?: { look: PillLook | null } } = {
    at: Date.now(),
    answer,
  };
  cache.set(ref, entry);
  answer.then(
    (look) => (entry.settled = { look: look ?? null }),
    () => (entry.settled = { look: null }),
  );
  return settle(answer);
}

const settle = (answer: Promise<PillAnswer>) =>
  answer.then(
    (look) => look ?? null,
    () => null,
  );

/** A reference's look, always as a promise. */
export const resolvePill = async (ref: string) => (await lookupPill(ref)) ?? null;

/** Drops cached looks: one reference's, or all. */
export function forgetPills(ref?: string) {
  if (ref) cache.delete(ref);
  else cache.clear();
}

/**
 * The references in plain text that a registered kind claims, by each kind's pattern (anchors dropped), in order and
 * without overlaps. For an app's pass over rendered text.
 */
export function pillsIn(text: string) {
  const found: { ref: string; kind: PillKind; index: number }[] = [];
  for (const kind of kinds) {
    const source = kind.pattern.source.replace(/^\^/, "").replace(/\$$/, "");
    for (const match of text.matchAll(new RegExp(source, `g${kind.pattern.flags.replace("g", "")}`)))
      found.push({ ref: match[0], kind, index: match.index ?? 0 });
  }
  found.sort((a, b) => a.index - b.index || b.ref.length - a.ref.length);
  let end = 0;
  return found.filter((hit) => {
    if (hit.index < end) return false;
    end = hit.index + hit.ref.length;
    return true;
  });
}

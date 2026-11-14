import type { Emoji as EmojibaseEmoji } from "emojibase";

/**
 * The Unicode emoji every desk app picks from: Emojibase's English data with GitHub's shortcodes, only those this
 * device draws, fetched the first time something asks (its own chunk, so an app's first load does not carry it).
 */
export interface EmojiEntry {
  readonly emoji: string;
  readonly label: string;
  readonly group: EmojiGroup["key"];
  /** GitHub's names for it (`grinning`), which `:` finds it by first. */
  readonly shortcodes: readonly string[];
  readonly tags: readonly string[];
  /** The emoji in each skin tone, lightest first, when it has them. */
  readonly skins: readonly string[] | null;
}

/** The picker's sections, in Emojibase's groups (smileys and people are one, as in Notion; skin swatches are none). */
export const EMOJI_GROUPS = [
  { key: "people", label: "People", groups: [0, 1] },
  { key: "nature", label: "Animals & nature", groups: [3] },
  { key: "food", label: "Food & drink", groups: [4] },
  { key: "activities", label: "Activities", groups: [6] },
  { key: "travel", label: "Travel & places", groups: [5] },
  { key: "objects", label: "Objects", groups: [7] },
  { key: "symbols", label: "Symbols", groups: [8] },
  { key: "flags", label: "Flags", groups: [9] },
] as const;
type EmojiGroup = (typeof EMOJI_GROUPS)[number];

const TONES = ["1F3FB", "1F3FC", "1F3FD", "1F3FE", "1F3FF"];

let emojiList: Promise<readonly EmojiEntry[]> | null = null;
/** Filled once the emoji are loaded, so typing `:smile:` can turn into 😄 without waiting. */
let byShortcode = new Map<string, EmojiEntry>();

export function loadEmoji(): Promise<readonly EmojiEntry[]> {
  emojiList ??= Promise.all([import("emojibase-data/en/data.json"), import("emojibase-data/en/shortcodes/github.json")])
    .then(([{ default: data }, { default: shortcodes }]) => {
      const list = build(data, shortcodes);
      byShortcode = new Map(list.flatMap((e) => e.shortcodes.map((code) => [code, e] as const)));
      return list;
    })
    .catch((error: unknown) => {
      // A failed fetch (offline) is tried again on the next ask.
      emojiList = null;
      throw error;
    });
  return emojiList;
}

/** An emoji in the skin tone picked (0 is the yellow default, 1 to 5 the tones), when it comes in tones. */
export const toned = (entry: EmojiEntry, tone: number): string => (tone && entry.skins?.[tone - 1]) || entry.emoji;

/** The emoji a shortcode names, in the tone given, once the emoji are loaded. */
export function shortcodeEmoji(code: string, tone = 0): string | undefined {
  const entry = byShortcode.get(code);
  return entry && toned(entry, tone);
}

/** The raised hand in each tone, which the picker's tone switch shows. */
export const TONE_SAMPLES = ["✋", "✋🏻", "✋🏼", "✋🏽", "✋🏾", "✋🏿"];

function build(data: readonly EmojibaseEmoji[], shortcodes: Record<string, string | string[]>): EmojiEntry[] {
  const drawn = newestDrawn(data);
  const groupOf = new Map<number, EmojiGroup["key"]>(
    EMOJI_GROUPS.flatMap((g) => g.groups.map((n) => [n, g.key] as const)),
  );
  return data
    .filter((e) => e.group !== undefined && groupOf.has(e.group) && (e.version ?? 0) <= drawn)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((e) => {
      const codes = shortcodes[e.hexcode] ?? [];
      return {
        emoji: e.emoji,
        label: e.label,
        group: groupOf.get(e.group as number) as EmojiGroup["key"],
        shortcodes: Array.isArray(codes) ? codes : [codes],
        tags: e.tags ?? [],
        skins: skinsOf(e),
      };
    });
}

/** The five single-tone variants (a couple's 25 mixes are left out), or none. */
function skinsOf(entry: EmojibaseEmoji): string[] | null {
  if (!entry.skins) return null;
  const tones = TONES.map((tone) =>
    entry.skins?.find(
      (s) =>
        s.hexcode
          .split("-")
          .filter((c) => TONES.includes(c))
          .join() === tone,
    ),
  );
  return tones.every(Boolean) ? tones.map((s) => s?.emoji ?? "") : null;
}

/**
 * The newest Emoji version this device draws in colour: its first emoji is drawn twice, in red and in blue, and a
 * glyph the font has keeps its own colours both times where a missing one takes the fill's (as emoji-mart tells).
 */
function newestDrawn(data: readonly EmojibaseEmoji[]): number {
  const firstOf = new Map<number, string>();
  for (const e of data) if (e.version !== undefined && !firstOf.has(e.version)) firstOf.set(e.version, e.emoji);
  const versions = [...firstOf.keys()].sort((a, b) => b - a);
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!context) return versions[0] ?? 0;
  return versions.find((version) => drawsInColour(context, firstOf.get(version) ?? "")) ?? 0;
}

function drawsInColour(context: CanvasRenderingContext2D, emoji: string): boolean {
  const size = 20;
  context.canvas.width = size * 2;
  context.canvas.height = size;
  context.font = `${size - 4}px sans-serif`;
  context.textBaseline = "top";
  context.fillStyle = "#f00";
  context.fillText(emoji, 0, 0);
  context.fillStyle = "#00f";
  context.fillText(emoji, size, 0);
  const left = context.getImageData(0, 0, size, size).data;
  let i = 0;
  while (i < left.length && !left[i + 3]) i += 4;
  if (i >= left.length || context.measureText(emoji).width >= size * 1.5) return false;
  const right = context.getImageData(size + ((i / 4) % size), Math.floor(i / 4 / size), 1, 1).data;
  return left[i] === right[0] && left[i + 2] === right[2];
}

/**
 * How well words match a query, lower is better and `null` none: a name that is the query, then one that starts with
 * it, then a word of the label or a tag that starts with it, then any that contains it.
 */
function rank(query: string, names: readonly string[], words: readonly string[]): number | null {
  const q = query.toLowerCase();
  if (!q) return 0;
  if (names.includes(q)) return 0;
  if (names.some((n) => n.startsWith(q))) return 1;
  if (
    words.some((w) =>
      w
        .toLowerCase()
        .split(/[\s_-]+/)
        .some((part) => part.startsWith(q)),
    )
  )
    return 2;
  if ([...names, ...words].some((w) => w.toLowerCase().includes(q))) return 3;
  return null;
}

/** The entries that match, best first; an entry is found by its names, then by its other words. */
export function search<T>(
  list: readonly T[],
  query: string,
  terms: (entry: T) => { names: readonly string[]; words: readonly string[] },
  limit = Number.POSITIVE_INFINITY,
): T[] {
  if (!query) return list.slice(0, limit);
  const ranked: { entry: T; rank: number; index: number }[] = [];
  list.forEach((entry, index) => {
    const { names, words } = terms(entry);
    const found = rank(query, names, words);
    if (found !== null) ranked.push({ entry, rank: found, index });
  });
  return ranked
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((r) => r.entry);
}

export const emojiTerms = (e: EmojiEntry) => ({ names: e.shortcodes, words: [e.label, ...e.tags] });

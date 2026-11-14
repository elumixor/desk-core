import type { ListItem } from "../palette/items";
import { type EmojiEntry, emojiTerms, loadEmoji, search, toned } from "./emoji";
import { emojiTone, recentEmoji } from "./used";

/** A row of the `:` menu: the emoji, drawn as the row's icon, and the shortcode it answers to. */
export interface EmojiItem extends ListItem {
  readonly glyph: string;
}

/** What a bare `:` offers after the ones used lately. */
const POPULAR = ["👍", "❤️", "😂", "🙏", "🔥", "😊", "🎉", "✅", "👀", "😅", "🤔", "💯"];

/**
 * What `:query` offers, best first: emoji whose shortcode is or starts with it, then those a word of their name or a
 * tag starts with; each labelled by the shortcode that matched (its name when it has none), in the tone picked. A bare
 * `:` (no query yet) offers the ones used lately, then the popular ones.
 */
export async function emojiItems(query: string, limit = 8): Promise<EmojiItem[]> {
  const list = await loadEmoji();
  const tone = emojiTone();
  const q = query.toLowerCase();
  if (!q) return recentAndPopular(list, tone, limit);
  return search(list, q, emojiTerms, limit).map((entry) => {
    const code = entry.shortcodes.find((c) => c.startsWith(q)) ?? entry.shortcodes[0];
    return { key: entry.emoji, label: code ? `:${code}:` : entry.label, glyph: toned(entry, tone) };
  });
}

function recentAndPopular(list: readonly EmojiEntry[], tone: number, limit: number): EmojiItem[] {
  const byGlyph = new Map(list.flatMap((e) => [e.emoji, ...(e.skins ?? [])].map((g) => [g, e] as const)));
  const out: EmojiItem[] = [];
  for (const glyph of [...recentEmoji(), ...POPULAR]) {
    const entry = byGlyph.get(glyph);
    if (!entry || out.some((i) => i.key === entry.emoji)) continue;
    const code = entry.shortcodes[0];
    // A recent pick keeps the tone it was picked in; a popular one takes the tone chosen now.
    out.push({
      key: entry.emoji,
      label: code ? `:${code}:` : entry.label,
      glyph: glyph === entry.emoji ? toned(entry, tone) : glyph,
    });
    if (out.length >= limit) break;
  }
  return out;
}

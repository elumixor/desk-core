import type { ListItem } from "../palette/items";
import { emojiTerms, loadEmoji, search, toned } from "./emoji";
import { emojiTone } from "./used";

/** A row of the `:` menu: the emoji, drawn as the row's icon, and the shortcode it answers to. */
export interface EmojiItem extends ListItem {
  readonly glyph: string;
}

/**
 * What `:query` offers, best first: emoji whose shortcode is or starts with it, then those a word of their name or a
 * tag starts with; each labelled by the shortcode that matched (its name when it has none), in the tone picked.
 */
export async function emojiItems(query: string, limit = 8): Promise<EmojiItem[]> {
  const list = await loadEmoji();
  const tone = emojiTone();
  const q = query.toLowerCase();
  return search(list, q, emojiTerms, limit).map((entry) => {
    const code = entry.shortcodes.find((c) => c.startsWith(q)) ?? entry.shortcodes[0];
    return { key: entry.emoji, label: code ? `:${code}:` : entry.label, glyph: toned(entry, tone) };
  });
}

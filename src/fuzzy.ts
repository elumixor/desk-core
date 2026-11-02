/**
 * Finding things by name as the person types: every word of the query has to appear in the text, as a run or as its
 * letters in order. Runs beat scattered letters, a word's start beats its middle, and a shorter text beats a longer one.
 */

export interface FuzzyHit {
  /** Higher is better; only comparable between hits for the same query. */
  readonly score: number;
  /** The text's characters the query matched, ascending. */
  readonly matches: readonly number[];
}

const isBoundary = (text: string, index: number) => index === 0 || /[\s\-_/.,:()[\]]/.test(text[index - 1] ?? " ");

function matchWord(word: string, text: string, lower: string): FuzzyHit | null {
  // A run: the best is one starting a word, else the first.
  let best = -1;
  for (let at = lower.indexOf(word); at !== -1; at = lower.indexOf(word, at + 1)) {
    if (isBoundary(text, at)) {
      best = at;
      break;
    }
    if (best === -1) best = at;
  }
  if (best !== -1) {
    const matches = Array.from({ length: word.length }, (_, i) => best + i);
    return { score: 100 + (isBoundary(text, best) ? 50 : 0) - best * 0.5, matches };
  }
  // Letters in order, each preferring the start of a word.
  const matches: number[] = [];
  let from = 0;
  let score = 0;
  for (const char of word) {
    let at = lower.indexOf(char, from);
    if (at === -1) return null;
    for (let next = at; next !== -1; next = lower.indexOf(char, next + 1))
      if (isBoundary(text, next)) {
        at = next;
        break;
      }
    score += isBoundary(text, at) ? 8 : at === (matches.at(-1) ?? -2) + 1 ? 4 : -Math.min(6, at - from);
    matches.push(at);
    from = at + 1;
  }
  return score < word.length * -2 ? null : { score, matches };
}

/** How well `query` names `text`; null when some word of it is not there. An empty query matches everything. */
export function fuzzyMatch(query: string, text: string): FuzzyHit | null {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { score: 0, matches: [] };
  const lower = text.toLowerCase();
  const matches = new Set<number>();
  let score = -text.length * 0.1;
  for (const word of words) {
    const hit = matchWord(word, text, lower);
    if (!hit) return null;
    score += hit.score;
    for (const index of hit.matches) matches.add(index);
  }
  return { score, matches: [...matches].sort((a, b) => a - b) };
}

/**
 * The items that match, best first, each with the label's characters that matched. `extra` is more text to match
 * against (other names, a path) that is not drawn highlighted.
 */
export function fuzzyFilter<T>(
  items: readonly T[],
  query: string,
  label: (item: T) => string,
  options: { extra?: (item: T) => string | undefined; limit?: number } = {},
): { item: T; matches: readonly number[] }[] {
  const hits: { item: T; matches: readonly number[]; score: number; order: number }[] = [];
  for (const [order, item] of items.entries()) {
    const name = label(item);
    const hit = fuzzyMatch(query, name);
    if (hit) {
      hits.push({ item, matches: hit.matches, score: hit.score, order });
      continue;
    }
    const more = options.extra?.(item);
    const loose = more ? fuzzyMatch(query, `${name} ${more}`) : null;
    if (loose)
      hits.push({ item, matches: loose.matches.filter((i) => i < name.length), score: loose.score - 40, order });
  }
  hits.sort((a, b) => b.score - a.score || a.order - b.order);
  return hits.slice(0, options.limit ?? hits.length).map(({ item, matches }) => ({ item, matches }));
}

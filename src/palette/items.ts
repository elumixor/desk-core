import { fuzzyFilter } from "../fuzzy";

/** One row of a desk list: the ⌘K palette, an `@` menu, any picker. */
export interface ListItem {
  /** Unique within the list. */
  readonly key: string;
  readonly label: string;
  /** Rows are drawn under their group's heading, groups in the order they first appear. */
  readonly group?: string;
  /** Quiet text after the label: a path, an amount, an email. */
  readonly hint?: string;
  /** A Svelte component taking `size` and `class` (a lucide icon), or an image URL. */
  readonly icon?: unknown;
  /** A colour for the icon, any CSS colour. */
  readonly tint?: string;
  /** More words the row answers to, not drawn. */
  readonly keywords?: string;
  /** The label's characters the query matched; filled in by `filterItems`. */
  readonly matches?: readonly number[];
}

/** A row of the ⌘K palette: what choosing it does. */
export interface PaletteItem extends ListItem {
  readonly run: () => void;
  /** Shown only once something is typed: records, as opposed to the commands and places listed up front. */
  readonly quiet?: boolean;
}

/** The items whose label (or keywords) match the query, best first, each with what matched; all of them, in order, for none. */
export function filterItems<T extends ListItem>(items: readonly T[], query: string, limit?: number): T[] {
  if (!query.trim()) return limit === undefined ? [...items] : items.slice(0, limit);
  return fuzzyFilter(items, query, (item) => item.label, {
    extra: (item) => [item.keywords, item.hint, item.group].filter(Boolean).join(" "),
    limit,
  }).map(({ item, matches }) => ({ ...item, matches }));
}

/** Keeps each group together, in the order the groups first appear, best rows first within each. */
export function groupItems<T extends ListItem>(items: readonly T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = item.group ?? "";
    const list = groups.get(group);
    if (list) list.push(item);
    else groups.set(group, [item]);
  }
  return [...groups.values()].flat();
}

import type { ListItem } from "../palette/items";

/** A row of the `@` menu: a record the text can point at. */
export interface MentionItem extends ListItem {
  readonly urn: string;
}

/** What an app knows about a referenced record right now; anything left out falls back to the text's own label. */
export interface RefLook {
  readonly label?: string;
  /** A Svelte component taking `size` and `class`, or an image URL. */
  readonly icon?: unknown;
  readonly tint?: string;
  /** Where clicking the reference goes. */
  readonly href?: string;
}

export type MentionSource = (query: string) => readonly MentionItem[] | Promise<readonly MentionItem[]>;
export type RefResolver = (urn: string) => RefLook | undefined;

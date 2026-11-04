/** One thing an app tells its person about: a row of the inbox. */
export interface InboxItem {
  readonly id: string;
  readonly title: string;
  /** What it says beyond the title, on one line. */
  readonly text?: string;
  /** The small line under it: what kind, and when. */
  readonly meta?: string;
  readonly unread: boolean;
  /** Drawn dimmer: kept in the list for the record, nothing to act on. */
  readonly quiet?: boolean;
}

/** Rows under one heading (a page, a source); `title` left out draws them without one. */
export interface InboxGroup<T extends InboxItem = InboxItem> {
  readonly key: string;
  readonly title?: string;
  readonly items: readonly T[];
}

/** A filter above the list: "Relevant", "All". */
export interface InboxFilter {
  readonly value: string;
  readonly label: string;
}

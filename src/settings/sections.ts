/** One section of an app's settings: a row in the dialog's rail and a block in its scroll. */
export interface SettingsSection<Id extends string = string> {
  id: Id;
  label: string;
  /** Any Svelte component taking `size` and `class`, a lucide icon say. */
  icon?: unknown;
  /** What somebody might type to get here: the words on the section, not its name. */
  keywords?: string;
}

/** The sections whose name or words contain the query; every section for an empty one. */
export function matchSections<S extends SettingsSection>(sections: readonly S[], query: string): S[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...sections];
  return sections.filter((section) => `${section.label} ${section.keywords ?? ""}`.toLowerCase().includes(needle));
}

/**
 * ⌘⇧, (Ctrl+Shift+, off a Mac), the suite's settings key. By the physical key, since Shift turns "," into "<" on
 * most layouts.
 */
export function isSettingsShortcut(
  event: Pick<KeyboardEvent, "code" | "key" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">,
) {
  const comma = event.code === "Comma" || event.key === "," || event.key === "<";
  return comma && event.shiftKey && !event.altKey && (event.metaKey || event.ctrlKey);
}

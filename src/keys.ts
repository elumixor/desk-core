const PUNCTUATION: Record<string, [string, string]> = {
  Backquote: ["`", "~"],
  Minus: ["-", "_"],
  Equal: ["=", "+"],
  BracketLeft: ["[", "{"],
  BracketRight: ["]", "}"],
  Backslash: ["\\", "|"],
  Semicolon: [";", ":"],
  Quote: ["'", '"'],
  Comma: [",", "<"],
  Period: [".", ">"],
  Slash: ["/", "?"],
};

type KeyEvent = Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "ctrlKey" | "metaKey" | "altKey">;

/** The key a US layout would give: shortcuts keep working when the layout is Russian, Ukrainian, ... */
export function latinKey(event: Pick<KeyEvent, "key" | "code" | "shiftKey">): string {
  if (event.key.length !== 1 || event.key.charCodeAt(0) < 128) return event.key;
  const { code, shiftKey } = event;
  const letter = /^Key([A-Z])$/.exec(code)?.[1];
  if (letter) return shiftKey ? letter : letter.toLowerCase();
  const punctuation = PUNCTUATION[code];
  return punctuation ? punctuation[shiftKey ? 1 : 0] : event.key;
}

/** A menu's navigation key: Ctrl+J / Ctrl+K count as Down / Up, the way every desk list moves. */
export function menuKey(event: KeyEvent): string {
  if (event.ctrlKey && !event.metaKey && !event.altKey) {
    const key = latinKey(event);
    if (key === "j") return "ArrowDown";
    if (key === "k") return "ArrowUp";
  }
  return event.key;
}

/** ⌘K (Ctrl+K off a Mac), the suite's search and command key. */
export function isPaletteShortcut(event: KeyEvent) {
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const modifier = mac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  return modifier && !event.shiftKey && !event.altKey && latinKey(event).toLowerCase() === "k";
}

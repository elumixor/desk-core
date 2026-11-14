/**
 * What this device remembers about picking emoji: the ones used lately (the picker's Recent) and the skin tone they
 * are picked in. Kept in localStorage; a browser that refuses it just forgets.
 */
const RECENT = "desk.emoji.recent";
const TONE = "desk.emoji.tone";
const RECENT_MAX = 24;

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : (JSON.parse(stored) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full store: nothing is remembered.
  }
}

export const recentEmoji = (): string[] => read<string[]>(RECENT, []);

/** An emoji picked goes first among the recent ones. */
export const rememberEmoji = (emoji: string) =>
  write(RECENT, [emoji, ...recentEmoji().filter((e) => e !== emoji)].slice(0, RECENT_MAX));

/** 0 is the yellow default, 1 to 5 the tones from lightest to darkest. */
export const emojiTone = (): number => read<number>(TONE, 0);

export const setEmojiTone = (tone: number) => write(TONE, tone);

/** How the desk apps say times: relative ("5 minutes ago", "yesterday"), as a day heading, short for a bar, a clock. */

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Largest first: a time is said in the largest unit it fills at least once. */
const UNITS = [
  ["year", 365 * DAY_MS],
  ["month", 30 * DAY_MS],
  ["week", 7 * DAY_MS],
  ["day", DAY_MS],
  ["hour", HOUR_MS],
  ["minute", MINUTE_MS],
] as const;

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

type When = string | number | Date;

/** "5 minutes ago", "yesterday", "in 3 days"; under a minute is "just now". */
export function ago(at: When, now = Date.now()) {
  const ms = new Date(at).getTime() - now;
  const unit = UNITS.find(([, size]) => Math.abs(ms) >= size);
  return unit ? relative.format(Math.round(ms / unit[1]), unit[0]) : "just now";
}

const startOfDay = (at: Date) => new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();

/** The day a time falls on, as a heading: "Today", "Yesterday", or the date (with the year when not this one). */
export function day(at: When, now = new Date()) {
  const date = new Date(at);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const year = date.getFullYear() === now.getFullYear() ? undefined : "numeric";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year });
}

/** Short enough for a top bar: "just now", "5m ago", "3h ago", "yesterday", then the date ("Sep 29", "Sep 29, 2025"). */
export function brief(at: When, now = new Date()) {
  const date = new Date(at);
  const ms = now.getTime() - date.getTime();
  if (ms < MINUTE_MS) return "just now";
  if (ms < HOUR_MS) return `${Math.floor(ms / MINUTE_MS)}m ago`;
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return `${Math.floor(ms / HOUR_MS)}h ago`;
  if (days === 1) return "yesterday";
  const year = date.getFullYear() === now.getFullYear() ? undefined : "numeric";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year });
}

export const clock = (at: When) => new Date(at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export const stamp = (at: When) => new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Whether two times read the same on a clock. */
export const sameMinute = (a: When, b: When) =>
  Math.floor(new Date(a).getTime() / MINUTE_MS) === Math.floor(new Date(b).getTime() / MINUTE_MS);

/** Each option colour as an ink strong enough for a small mark (the `--tag-*` tokens are washes). */
export const STATUS_INK: Readonly<Record<string, string>> = {
  gray: "#8b8b8b",
  blue: "#3b82f6",
  green: "#2f9e5b",
  yellow: "#d4a106",
  orange: "#ea7a1a",
  red: "#e5484d",
  purple: "#8e4ec6",
  pink: "#d6409f",
  brown: "#a1714f",
};

export type StatusShape = "todo" | "doing" | "done" | "cancelled";

/** A status read from its name: empty circle to do, half in progress, full done, struck cancelled. */
export function statusShape(name: string): StatusShape {
  const lower = name.toLowerCase();
  if (/done|complete|finish|closed|shipped|merged/.test(lower)) return "done";
  if (/cancel|drop|won.?t|abandon/.test(lower)) return "cancelled";
  if (/doing|progress|review|active|started|wip|testing|block/.test(lower)) return "doing";
  return "todo";
}

export const statusInk = (color: string | null) => STATUS_INK[color ?? ""] ?? STATUS_INK.gray;

/** How the conversation's pieces say things: a model, a size, how long. */
export const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
export const sizeOf = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
export const duration = (ms: number) =>
  ms < 60_000 ? `${Math.max(1, Math.round(ms / 1000))}s` : `${Math.round(ms / 60_000)} min`;

/** `claude-sonnet-5-20260501` reads as `sonnet 5`; an alias such as `sonnet` stays as it is. */
export function modelName(model: string | null | undefined) {
  if (!model) return "model?";
  const m = /^claude-([a-z]+)-(\d+)(?:-(\d+))?/.exec(model);
  if (!m) return model;
  return `${m[1]} ${m[2]}${m[3] && m[3].length < 3 ? `.${m[3]}` : ""}`;
}

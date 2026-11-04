/** "just now", "5 minutes ago", "3 days ago": how long ago `since` was. */
export function ago(since: number | string | Date, now = Date.now()): string {
  const at = since instanceof Date ? since.getTime() : typeof since === "number" ? since : Date.parse(since);
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return "just now";
  const units: [number, string][] = [
    [3600, "hour"],
    [86_400, "day"],
    [2_592_000, "month"],
    [31_536_000, "year"],
  ];
  let unit: [number, string] = [60, "minute"];
  for (const u of units) if (s >= u[0] * 0.9) unit = u;
  const n = Math.max(1, Math.round(s / unit[0]));
  return `${n} ${unit[1]}${n === 1 ? "" : "s"} ago`;
}

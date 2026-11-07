import type { TranscriptTool } from "./host";
import type { IconName } from "./icons";

/** One turn's thinking and tool calls, from the transcript or the stream. */
export interface ToolGroup {
  readonly kind: "tools";
  readonly key: string;
  at: number;
  end: number;
  thinking: string;
  tools: TranscriptTool[];
  live: boolean;
  /** The session whose transcript holds these calls in full. */
  readonly session?: string;
}

/** A message's own words and what was pasted into it, which is drawn as an attachment. Nested pastes flatten into the outer one. */
export function splitPastes(body: string): { text: string; pastes: string[] } {
  const pastes: string[] = [];
  let text = "";
  let depth = 0;
  let at = 0;
  let inner = "";
  for (const tag of body.matchAll(/<(\/?)pasted_content\b[^>]*>/g)) {
    const between = body.slice(at, tag.index);
    at = tag.index + tag[0].length;
    if (depth) inner += between;
    else text += between;
    if (tag[1]) {
      if (depth && --depth === 0) {
        pastes.push(inner.trim());
        inner = "";
      }
    } else depth += 1;
  }
  const rest = body.slice(at);
  if (depth) pastes.push((inner + rest).trim());
  else text += rest;
  return { text: pastes.length ? text.replace(/\n{3,}/g, "\n\n").trim() : text, pastes };
}

/** "Created a file, ran 5 commands" — what a turn's tool calls amount to, by family. */
export function describeTools(tools: readonly TranscriptTool[]) {
  const families: Record<string, [string, string]> = {
    Write: ["created a file", "created %n files"],
    Edit: ["edited a file", "edited %n files"],
    Bash: ["ran a command", "ran %n commands"],
    Read: ["read a file", "read %n files"],
    Grep: ["searched", "searched %n times"],
    Glob: ["searched", "searched %n times"],
    WebSearch: ["searched the web", "searched the web %n times"],
    WebFetch: ["fetched a page", "fetched %n pages"],
    Agent: ["delegated once", "delegated %n times"],
  };
  const counts = new Map<string, number>();
  for (const t of tools) {
    const family = families[t.name] ? t.name : "other";
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  const text = [...counts]
    .map(([family, n]) => {
      const [one, many] = families[family] ?? ["used a tool", "%n tool calls"];
      return n === 1 ? one : many.replace("%n", String(n));
    })
    .join(", ");
  return text ? text[0]!.toUpperCase() + text.slice(1) : "";
}

/** Built-in tools as the chat says them: a verb and an icon. */
const TOOL_VERBS: Record<string, [string, IconName]> = {
  Bash: ["Ran", "terminal"],
  Read: ["Read", "file"],
  Edit: ["Edited", "pencil"],
  MultiEdit: ["Edited", "pencil"],
  Write: ["Created", "file"],
  NotebookEdit: ["Edited", "pencil"],
  Grep: ["Searched", "search"],
  Glob: ["Found files", "search"],
  WebSearch: ["Searched the web", "globe"],
  WebFetch: ["Fetched", "globe"],
  Agent: ["Delegated", "bot"],
  Task: ["Delegated", "bot"],
  ToolSearch: ["Loaded tools", "wrench"],
  TodoWrite: ["Updated the plan", "list"],
  Skill: ["Used a skill", "book"],
  AskUserQuestion: ["Asked you", "help"],
};
const SERVER_ICONS: Record<string, IconName> = {
  gmail: "mail",
  mail: "mail",
  calendar: "calendar",
  balance: "calendar",
  playwright: "globe",
  browser: "globe",
  tg: "message",
  telegram: "message",
  linkedin: "users",
  pai: "zap",
};
const sentence = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** `mcp__claude_ai_Gmail__gmail_search` → server "Gmail", action "Search"; a built-in → its verb. */
export function toolLabel(name: string): { server?: string; action: string; icon: IconName } {
  const builtin = TOOL_VERBS[name];
  if (builtin) return { action: builtin[0], icon: builtin[1] };
  const mcp = /^mcp__(.+?)__(.+)$/.exec(name);
  if (!mcp) return { action: sentence(name.replace(/_/g, " ")), icon: "wrench" };
  const server = mcp[1]!
    .replace(/^claude_ai_/, "")
    .replace(/^plugin_[^_]+_/, "")
    .replace(/_/g, " ");
  const key = server.toLowerCase();
  const action = mcp[2]!.replace(new RegExp(`^${key.replace(/\W/g, "_")}_`, "i"), "").replace(/[_-]+/g, " ");
  return { server: sentence(server), action: sentence(action), icon: SERVER_ICONS[key] ?? "zap" };
}

/** What the call was about, without the tool's name the summary starts with. */
export function toolArgument(tool: TranscriptTool) {
  const short = tool.name.replace(/^mcp__/, "").replace(/__/g, ":");
  let text = (tool.input ?? "").trim();
  for (const prefix of [short, tool.name]) if (text.startsWith(prefix)) text = text.slice(prefix.length).trim();
  if (tool.name === "ToolSearch")
    text = text
      .replace(/^select:/, "")
      .replace(/mcp__[^_]+(?:_[^_]+)*?__/g, "")
      .replace(/,/g, ", ");
  return text.replace(/^(\$|search|fetch|agent:)\s+/, "").replace(/^"(.*)"$/, "$1");
}

/** A preview the daemon cut ends in "… +N lines". */
export const CUT = /\n… \+(\d+) lines$/;

/** "12 lines", "no output" — how much came back, for the end of the row. */
export function resultSize(result: string) {
  const text = result.trim();
  if (!text || text === "[]" || text === "{}") return "no output";
  const hidden = Number(CUT.exec(text)?.[1] ?? 0);
  const lines = text.replace(CUT, "").split("\n").length + hidden;
  return lines > 1 ? `${lines} lines` : "";
}

const TODO_MARK: Readonly<Record<string, string>> = { completed: "✓", in_progress: "▸", pending: "○" };

/** What an edit took out and put in, line by line; none for anything but an edit. */
export function editedLines(name: string, input: unknown): { kind: "add" | "del"; text: string }[] {
  if ((name !== "Edit" && name !== "MultiEdit") || !input || typeof input !== "object") return [];
  const fields = input as {
    old_string?: string;
    new_string?: string;
    edits?: { old_string?: string; new_string?: string }[];
  };
  const edits = fields.edits ?? [fields];
  return edits.flatMap((e) => [
    ...(e.old_string ? e.old_string.split("\n").map((text) => ({ kind: "del" as const, text })) : []),
    ...(e.new_string ? e.new_string.split("\n").map((text) => ({ kind: "add" as const, text })) : []),
  ]);
}

/** A call's input as a person reads it: the command, the path, else the fields. */
export function inputText(name: string, input: unknown) {
  if (!input || typeof input !== "object") return String(input ?? "");
  const fields = input as Record<string, unknown>;
  if (name === "Bash" && typeof fields.command === "string") return fields.command;
  if (name === "Write" && typeof fields.content === "string") return fields.content;
  if ((name === "Agent" || name === "Task") && typeof fields.prompt === "string") return fields.prompt;
  if (name === "TodoWrite" && Array.isArray(fields.todos))
    return (fields.todos as { content?: string; status?: string }[])
      .map((t) => `${TODO_MARK[t.status ?? ""] ?? "○"} ${t.content ?? ""}`)
      .join("\n");
  const values = Object.values(fields);
  if (values.length === 1 && typeof values[0] === "string") return values[0];
  return JSON.stringify(fields, null, 2);
}

/** How big a file is, as a row says it. */
export const fileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** A kept attachment is a name on the row (`a1b2….jpg`); a local preview is already a data url. */
export const KEPT = /^[0-9a-f]{16}\.\w+$/;

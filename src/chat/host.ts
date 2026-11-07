import type { IconName } from "./icons";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface Upload {
  readonly media_type: string;
  readonly data: string;
  readonly name?: string;
}

export interface SlashCommand {
  readonly name: string;
  readonly description: string;
  readonly argumentHint: string;
}

export interface TranscriptTool {
  readonly id?: string;
  readonly name: string;
  readonly input?: string;
  readonly result?: string;
}

export interface UsageWindow {
  readonly name: string;
  readonly percent: number;
  readonly resetsAt?: string;
  readonly length: number;
}

export interface UsageReading {
  readonly windows: readonly UsageWindow[];
  readonly error?: string;
  readonly needsLogin?: boolean;
}

/** A row of the small menu a button opens: the current one marked. */
export interface MenuRow {
  readonly label: string;
  readonly hint?: string;
  readonly on?: boolean;
  readonly pick: () => void;
}

export interface ToolCallDetail {
  readonly name: string;
  readonly input: unknown;
  readonly result?: string;
}

/** What a conversation's pieces need from the app they are in. One host per page, set as the app starts. */
export interface ChatHost {
  /** The session's slash commands, offered on `/`. */
  commands(session: string): Promise<readonly SlashCommand[]>;
  /** The newest model of each family, by family name. */
  models(): Promise<Readonly<Record<string, { readonly id: string; readonly name: string }>>>;
  contextUsage(session: string): Promise<{ readonly percentage?: number }>;
  toolCall(session: string, tool: string): Promise<ToolCallDetail>;
  attachmentUrl(name: string): string;
  /** Opens the small menu under a button. */
  menu(anchor: HTMLElement, rows: readonly MenuRow[]): void;
  /** Read in a reactive scope, so the rings follow it. */
  usage(): UsageReading | undefined;
  /** Vim keys in the message box. */
  vim(): boolean;
}

let host: ChatHost | undefined;

export const configureChat = (next: ChatHost) => {
  host = next;
};

export function chatHost(): ChatHost {
  if (!host) throw new Error("configureChat was not called before a conversation drew");
  return host;
}

export type { IconName };
